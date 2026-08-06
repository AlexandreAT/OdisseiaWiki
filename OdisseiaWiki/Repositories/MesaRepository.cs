using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using System.Data;
using System.Text.Json.Nodes;

namespace OdisseiaWiki.Repositories
{
    public class MesaRepository : IMesaRepository
    {
        private readonly OdisseiaContext _context;

        public MesaRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Mesa>> GetAllAsync()
            => await _context.Mesas
                .AsNoTracking()
                .ToListAsync();

        public async Task<Mesa?> GetByIdAsync(int id)
            => await _context.Mesas.FindAsync(id);

        public Task<Mesa?> GetByCodigoSistemaAsync(string codigoSistema)
            => _context.Mesas.FirstOrDefaultAsync(mesa => mesa.CodigoSistema == codigoSistema);

        public async Task<Mesa> EnsureSystemDefaultAsync(
            string codigoSistema,
            string nome,
            int? idSistemaVersao)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            bool criandoMesaPadrao = false;
            try
            {
                return await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await _context.Database.BeginTransactionAsync(
                        IsolationLevel.Serializable);

                    List<Mesa> possiveis = await _context.Mesas
                        .Where(mesa =>
                            mesa.CodigoSistema == codigoSistema ||
                            mesa.IdusuarioCriacao == null)
                        .OrderBy(mesa => mesa.Idmesa)
                        .ToListAsync();
                    List<Mesa> candidatas = possiveis
                        .Where(mesa =>
                            string.Equals(
                                mesa.CodigoSistema,
                                codigoSistema,
                                StringComparison.OrdinalIgnoreCase) ||
                            (mesa.IdusuarioCriacao is null &&
                             SystemMesaConstants.NomeRepresentaMesaPadrao(mesa.Nome)))
                        .ToList();

                    Mesa? mesaPadrao = candidatas.FirstOrDefault(mesa =>
                        string.Equals(
                            mesa.CodigoSistema,
                            codigoSistema,
                            StringComparison.OrdinalIgnoreCase));
                    mesaPadrao ??= candidatas.FirstOrDefault();

                    if (mesaPadrao is null)
                    {
                        criandoMesaPadrao = true;
                        mesaPadrao = new Mesa
                        {
                            Nome = nome,
                            CodigoSistema = codigoSistema,
                            PadraoSistema = true,
                            IdusuarioCriacao = null,
                            IdSistemaVersao = idSistemaVersao,
                            DataCriacao = DateTime.UtcNow,
                        };
                        _context.Mesas.Add(mesaPadrao);
                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();
                        return mesaPadrao;
                    }

                    List<Mesa> duplicadas = candidatas
                        .Where(mesa => mesa.Idmesa != mesaPadrao.Idmesa)
                        .ToList();

                    // Libera primeiro a chave lógica única caso a candidata histórica seja promovida.
                    foreach (Mesa duplicada in duplicadas)
                    {
                        duplicada.CodigoSistema = null;
                        duplicada.PadraoSistema = false;
                    }
                    if (duplicadas.Count > 0)
                        await _context.SaveChangesAsync();

                    mesaPadrao.Nome = nome;
                    mesaPadrao.CodigoSistema = codigoSistema;
                    mesaPadrao.PadraoSistema = true;
                    mesaPadrao.IdusuarioCriacao = null;
                    mesaPadrao.IdSistemaVersao = idSistemaVersao;

                    if (duplicadas.Count > 0)
                    {
                        int[] idsDuplicados = duplicadas.Select(mesa => mesa.Idmesa).ToArray();

                        List<PersonagemJogador> personagens = await _context.PersonagemJogadores
                            .Where(personagem => idsDuplicados.Contains(personagem.Idmesa))
                            .ToListAsync();
                        foreach (PersonagemJogador personagem in personagens)
                            personagem.Idmesa = mesaPadrao.Idmesa;

                        List<Mesausuario> vinculos = await _context.Mesausuarios
                            .Where(vinculo => vinculo.Idmesa.HasValue && idsDuplicados.Contains(vinculo.Idmesa.Value))
                            .ToListAsync();
                        HashSet<int> usuariosJaVinculados = (await _context.Mesausuarios
                                .Where(vinculo => vinculo.Idmesa == mesaPadrao.Idmesa && vinculo.Idusuario.HasValue)
                                .Select(vinculo => vinculo.Idusuario!.Value)
                                .ToListAsync())
                            .ToHashSet();
                        foreach (Mesausuario vinculo in vinculos)
                        {
                            if (vinculo.Idusuario.HasValue && !usuariosJaVinculados.Add(vinculo.Idusuario.Value))
                                _context.Mesausuarios.Remove(vinculo);
                            else
                                vinculo.Idmesa = mesaPadrao.Idmesa;
                        }

                        List<MesaEntidadeConfig> configuracoes = await _context.MesaEntidadeConfigs
                            .Where(configuracao =>
                                configuracao.Idmesa == mesaPadrao.Idmesa ||
                                idsDuplicados.Contains(configuracao.Idmesa))
                            .OrderBy(configuracao => configuracao.DataAtualizacao)
                            .ToListAsync();
                        Dictionary<(MesaEntidadeTipo Tipo, string Identidade), MesaEntidadeConfig>
                            configuracoesCanonicas = configuracoes
                                .Where(configuracao => configuracao.Idmesa == mesaPadrao.Idmesa)
                                .ToDictionary(
                                    configuracao => (configuracao.TipoEntidade, configuracao.Identidade),
                                    configuracao => configuracao);

                        foreach (MesaEntidadeConfig configuracao in configuracoes
                            .Where(configuracao => configuracao.Idmesa != mesaPadrao.Idmesa))
                        {
                            var chave = (configuracao.TipoEntidade, configuracao.Identidade);
                            if (!configuracoesCanonicas.TryGetValue(chave, out MesaEntidadeConfig? existente))
                            {
                                configuracao.Idmesa = mesaPadrao.Idmesa;
                                configuracoesCanonicas[chave] = configuracao;
                                continue;
                            }

                            bool duplicadaMaisNova = configuracao.DataAtualizacao >= existente.DataAtualizacao;
                            existente.ConfigJson = MesclarConfiguracoes(
                                duplicadaMaisNova ? existente.ConfigJson : configuracao.ConfigJson,
                                duplicadaMaisNova ? configuracao.ConfigJson : existente.ConfigJson);
                            existente.DataCriacao = existente.DataCriacao <= configuracao.DataCriacao
                                ? existente.DataCriacao
                                : configuracao.DataCriacao;
                            existente.DataAtualizacao = existente.DataAtualizacao >= configuracao.DataAtualizacao
                                ? existente.DataAtualizacao
                                : configuracao.DataAtualizacao;
                            _context.MesaEntidadeConfigs.Remove(configuracao);
                        }

                        if (string.IsNullOrWhiteSpace(mesaPadrao.Imagem))
                        {
                            mesaPadrao.Imagem = duplicadas
                                .Select(mesa => mesa.Imagem)
                                .FirstOrDefault(imagem => !string.IsNullOrWhiteSpace(imagem));
                        }

                        _context.Mesas.RemoveRange(duplicadas);
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return mesaPadrao;
                });
            }
            catch (DbUpdateException) when (criandoMesaPadrao)
            {
                _context.ChangeTracker.Clear();
                Mesa? criadaPorOutraInstancia = await GetByCodigoSistemaAsync(codigoSistema);
                if (criadaPorOutraInstancia is not null)
                    return criadaPorOutraInstancia;

                throw;
            }
        }

        public Task<bool> IsOwnerAsync(int idMesa, int idUsuario)
            => _context.Mesas.AnyAsync(mesa =>
                mesa.Idmesa == idMesa && mesa.IdusuarioCriacao == idUsuario);

        public Task<bool> UsuarioPodeUsarMesaAsync(int idMesa, int idUsuario)
            => _context.Mesas.AnyAsync(mesa =>
                mesa.Idmesa == idMesa &&
                (mesa.PadraoSistema ||
                 mesa.IdusuarioCriacao == idUsuario ||
                 _context.Mesausuarios.Any(vinculo =>
                    vinculo.Idmesa == idMesa && vinculo.Idusuario == idUsuario)));

        public Task<List<Mesa>> GetAccessibleByUsuarioIdAsync(int usuarioId)
            => _context.Mesas
                .AsNoTracking()
                .Where(mesa =>
                    mesa.PadraoSistema ||
                    mesa.IdusuarioCriacao == usuarioId ||
                    _context.Mesausuarios.Any(vinculo =>
                        vinculo.Idmesa == mesa.Idmesa && vinculo.Idusuario == usuarioId))
                .ToListAsync();

        public async Task<List<Mesa>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.Mesas
                .AsNoTracking()
                .Where(m => m.IdusuarioCriacao == usuarioId)
                .ToListAsync();
        }

        public async Task<Mesa> CreateAsync(Mesa mesa)
        {
            _context.Mesas.Add(mesa);
            await _context.SaveChangesAsync();
            return mesa;
        }

        public async Task<Mesa> UpdateAsync(Mesa mesa)
        {
            _context.Mesas.Update(mesa);
            await _context.SaveChangesAsync();
            return mesa;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var mesa = await _context.Mesas.FindAsync(id);
            if (mesa == null) return false;

            _context.Mesas.Remove(mesa);
            await _context.SaveChangesAsync();
            return true;
        }

        private static string MesclarConfiguracoes(string baseJson, string overrideJson)
        {
            try
            {
                JsonNode? baseNode = JsonNode.Parse(baseJson);
                JsonNode? overrideNode = JsonNode.Parse(overrideJson);
                if (baseNode is null || overrideNode is null)
                    return overrideJson;

                return JsonOverrideMerger.Merge(baseNode, overrideNode).ToJsonString();
            }
            catch (System.Text.Json.JsonException)
            {
                return overrideJson;
            }
        }
    }
}
