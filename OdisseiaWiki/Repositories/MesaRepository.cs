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

        public Task<Mesa?> GetDetailedByIdAsync(int id)
            => DetailedQuery()
                .FirstOrDefaultAsync(mesa => mesa.Idmesa == id);

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

        public Task<bool> UsuarioPodeAcessarMesaSocialAsync(int idMesa, int idUsuario)
            => _context.Mesas.AnyAsync(mesa =>
                mesa.Idmesa == idMesa &&
                !mesa.PadraoSistema &&
                (mesa.IdusuarioCriacao == idUsuario ||
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

        public async Task<(List<Mesa> Itens, int Total)> GetOwnedPageAsync(
            int usuarioId,
            int pagina,
            int tamanhoPagina)
        {
            IQueryable<Mesa> query = DetailedQuery()
                .Where(mesa =>
                    !mesa.PadraoSistema &&
                    mesa.IdusuarioCriacao == usuarioId);

            int total = await query.CountAsync();
            List<Mesa> itens = await query
                .OrderByDescending(mesa => mesa.DataAtualizacao)
                .ThenBy(mesa => mesa.Nome)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina)
                .ToListAsync();
            return (itens, total);
        }

        public async Task<(List<Mesa> Itens, int Total)> GetParticipatingPageAsync(
            int usuarioId,
            int pagina,
            int tamanhoPagina)
        {
            IQueryable<Mesa> query = DetailedQuery()
                .Where(mesa =>
                    !mesa.PadraoSistema &&
                    mesa.IdusuarioCriacao != usuarioId &&
                    mesa.Mesausuarios.Any(vinculo => vinculo.Idusuario == usuarioId));

            int total = await query.CountAsync();
            List<Mesa> itens = await query
                .OrderByDescending(mesa => mesa.DataAtualizacao)
                .ThenBy(mesa => mesa.Nome)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina)
                .ToListAsync();
            return (itens, total);
        }

        public async Task<(List<Mesa> Itens, int Total)> SearchPageAsync(
            string? termo,
            int? idSistemaRpg,
            bool somenteComVagas,
            int pagina,
            int tamanhoPagina)
        {
            IQueryable<Mesa> query = DetailedQuery()
                .Where(mesa =>
                    !mesa.PadraoSistema &&
                    mesa.IdusuarioCriacao.HasValue &&
                    mesa.IdSistemaVersao.HasValue &&
                    mesa.SistemaVersao != null &&
                    mesa.SistemaVersao.SistemaRpg.Ativo);

            if (!string.IsNullOrWhiteSpace(termo))
            {
                string pattern = $"%{termo.Trim()}%";
                query = query.Where(mesa =>
                    EF.Functions.Like(mesa.Nome, pattern) ||
                    (mesa.Descricao != null && EF.Functions.Like(mesa.Descricao, pattern)) ||
                    (mesa.Tags != null && EF.Functions.Like(mesa.Tags, pattern)) ||
                    (mesa.IdusuarioCriacaoNavigation != null &&
                     (EF.Functions.Like(mesa.IdusuarioCriacaoNavigation.Nome, pattern) ||
                      EF.Functions.Like(mesa.IdusuarioCriacaoNavigation.Nickname, pattern))));
            }

            if (idSistemaRpg.HasValue)
                query = query.Where(mesa => mesa.SistemaVersao!.IdSistemaRpg == idSistemaRpg.Value);

            if (somenteComVagas)
                query = query.Where(mesa => mesa.Mesausuarios.Count < mesa.LimiteJogadores);

            int total = await query.CountAsync();
            List<Mesa> itens = await query
                .OrderByDescending(mesa => mesa.DataAtualizacao)
                .ThenBy(mesa => mesa.Nome)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina)
                .ToListAsync();
            return (itens, total);
        }

        public Task<SistemaVersao?> GetSelectableVersionAsync(int idSistemaVersao)
            => _context.SistemaVersoes
                .AsNoTracking()
                .Include(versao => versao.SistemaRpg)
                .FirstOrDefaultAsync(versao =>
                    versao.IdSistemaVersao == idSistemaVersao &&
                    versao.Status == SistemaVersaoStatus.Publicado &&
                    versao.SistemaRpg.Ativo);

        public Task<int> CountMembersAsync(int idMesa)
            => _context.Mesausuarios.CountAsync(vinculo => vinculo.Idmesa == idMesa);

        public Task<List<Mesausuario>> GetMembersAsync(int idMesa)
            => _context.Mesausuarios
                .AsNoTracking()
                .Include(vinculo => vinculo.IdusuarioNavigation)
                .Where(vinculo => vinculo.Idmesa == idMesa)
                .OrderBy(vinculo => vinculo.IdusuarioNavigation!.Nome)
                .ToListAsync();

        public async Task<IReadOnlyDictionary<int, int>> GetMemberCharacterCountsAsync(int idMesa)
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Where(personagem => personagem.Idmesa == idMesa)
                .GroupBy(personagem => personagem.Idusuario)
                .Select(grupo => new { IdUsuario = grupo.Key, Quantidade = grupo.Count() })
                .ToDictionaryAsync(item => item.IdUsuario, item => item.Quantidade);

        public async Task<HashSet<int>> GetParticipantUserIdsAsync(int idMesa)
        {
            Mesa? mesa = await _context.Mesas
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Idmesa == idMesa);
            HashSet<int> ids = (await _context.Mesausuarios
                    .AsNoTracking()
                    .Where(vinculo => vinculo.Idmesa == idMesa && vinculo.Idusuario.HasValue)
                    .Select(vinculo => vinculo.Idusuario!.Value)
                    .ToListAsync())
                .ToHashSet();
            if (mesa?.IdusuarioCriacao is int idMestre)
                ids.Add(idMestre);
            return ids;
        }

        public Task<List<MesaSolicitacaoEntrada>> GetRequestsAsync(int idMesa)
            => _context.MesaSolicitacoesEntrada
                .AsNoTracking()
                .Include(solicitacao => solicitacao.Usuario)
                .Where(solicitacao => solicitacao.Idmesa == idMesa)
                .OrderBy(solicitacao => solicitacao.DataSolicitacao)
                .ToListAsync();

        public Task<MesaSolicitacaoEntrada?> GetUserRequestAsync(int idMesa, int idUsuario)
            => _context.MesaSolicitacoesEntrada
                .AsNoTracking()
                .FirstOrDefaultAsync(solicitacao =>
                    solicitacao.Idmesa == idMesa &&
                    solicitacao.Idusuario == idUsuario);

        public async Task<MesaParticipacaoPersistenciaResultado> CreateRequestAsync(
            int idMesa,
            int idUsuario,
            string? mensagem)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);
                Mesa? mesa = await _context.Mesas
                    .FirstOrDefaultAsync(item => item.Idmesa == idMesa && !item.PadraoSistema);
                if (mesa is null)
                    return MesaParticipacaoPersistenciaResultado.MesaNaoEncontrada;
                if (mesa.IdusuarioCriacao == idUsuario)
                    return MesaParticipacaoPersistenciaResultado.MestreNaoPodeSolicitarOuSerExpulso;
                if (await _context.Mesausuarios.AnyAsync(vinculo =>
                        vinculo.Idmesa == idMesa && vinculo.Idusuario == idUsuario))
                    return MesaParticipacaoPersistenciaResultado.UsuarioJaParticipa;
                if (await _context.MesaSolicitacoesEntrada.AnyAsync(solicitacao =>
                        solicitacao.Idmesa == idMesa && solicitacao.Idusuario == idUsuario))
                    return MesaParticipacaoPersistenciaResultado.SolicitacaoDuplicada;
                if (await _context.Mesausuarios.CountAsync(vinculo => vinculo.Idmesa == idMesa) >= mesa.LimiteJogadores)
                    return MesaParticipacaoPersistenciaResultado.MesaLotada;

                _context.MesaSolicitacoesEntrada.Add(new MesaSolicitacaoEntrada
                {
                    Idmesa = idMesa,
                    Idusuario = idUsuario,
                    Mensagem = mensagem,
                    DataSolicitacao = DateTime.UtcNow,
                });
                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return MesaParticipacaoPersistenciaResultado.Sucesso;
                }
                catch (DbUpdateException)
                {
                    await transaction.RollbackAsync();
                    _context.ChangeTracker.Clear();
                    return MesaParticipacaoPersistenciaResultado.Conflito;
                }
            });
        }

        public async Task<MesaParticipacaoPersistenciaResultado> AcceptRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idMestre)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);
                Mesa? mesa = await _context.Mesas.FirstOrDefaultAsync(item => item.Idmesa == idMesa);
                if (mesa is null)
                    return MesaParticipacaoPersistenciaResultado.MesaNaoEncontrada;
                if (mesa.IdusuarioCriacao != idMestre)
                    return MesaParticipacaoPersistenciaResultado.MestreNaoAutorizado;

                MesaSolicitacaoEntrada? solicitacao = await _context.MesaSolicitacoesEntrada
                    .FirstOrDefaultAsync(item =>
                        item.IdMesaSolicitacaoEntrada == idSolicitacao &&
                        item.Idmesa == idMesa);
                if (solicitacao is null)
                    return MesaParticipacaoPersistenciaResultado.SolicitacaoNaoEncontrada;
                if (await _context.Mesausuarios.AnyAsync(vinculo =>
                        vinculo.Idmesa == idMesa && vinculo.Idusuario == solicitacao.Idusuario))
                    return MesaParticipacaoPersistenciaResultado.UsuarioJaParticipa;
                if (await _context.Mesausuarios.CountAsync(vinculo => vinculo.Idmesa == idMesa) >= mesa.LimiteJogadores)
                    return MesaParticipacaoPersistenciaResultado.MesaLotada;

                _context.Mesausuarios.Add(new Mesausuario
                {
                    Idmesa = idMesa,
                    Idusuario = solicitacao.Idusuario,
                    DataEntrada = DateTime.UtcNow,
                });
                _context.MesaSolicitacoesEntrada.Remove(solicitacao);
                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return MesaParticipacaoPersistenciaResultado.Sucesso;
                }
                catch (DbUpdateException)
                {
                    await transaction.RollbackAsync();
                    _context.ChangeTracker.Clear();
                    return MesaParticipacaoPersistenciaResultado.Conflito;
                }
            });
        }

        public async Task<MesaParticipacaoPersistenciaResultado> RefuseRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idMestre)
        {
            Mesa? mesa = await _context.Mesas.FindAsync(idMesa);
            if (mesa is null)
                return MesaParticipacaoPersistenciaResultado.MesaNaoEncontrada;
            if (mesa.IdusuarioCriacao != idMestre)
                return MesaParticipacaoPersistenciaResultado.MestreNaoAutorizado;
            MesaSolicitacaoEntrada? solicitacao = await _context.MesaSolicitacoesEntrada
                .FirstOrDefaultAsync(item =>
                    item.IdMesaSolicitacaoEntrada == idSolicitacao &&
                    item.Idmesa == idMesa);
            if (solicitacao is null)
                return MesaParticipacaoPersistenciaResultado.SolicitacaoNaoEncontrada;
            _context.MesaSolicitacoesEntrada.Remove(solicitacao);
            await _context.SaveChangesAsync();
            return MesaParticipacaoPersistenciaResultado.Sucesso;
        }

        public async Task<MesaParticipacaoPersistenciaResultado> ExpelMemberAsync(
            int idMesa,
            int idUsuario,
            int idMestre,
            string motivo)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            Mesa? mesa = await _context.Mesas.FindAsync(idMesa);
            if (mesa is null)
                return MesaParticipacaoPersistenciaResultado.MesaNaoEncontrada;
            if (mesa.IdusuarioCriacao != idMestre)
                return MesaParticipacaoPersistenciaResultado.MestreNaoAutorizado;
            if (idUsuario == idMestre)
                return MesaParticipacaoPersistenciaResultado.MestreNaoPodeSolicitarOuSerExpulso;
            Mesausuario? vinculo = await _context.Mesausuarios.FirstOrDefaultAsync(item =>
                item.Idmesa == idMesa && item.Idusuario == idUsuario);
            if (vinculo is null)
                return MesaParticipacaoPersistenciaResultado.UsuarioNaoParticipa;

            _context.Mesausuarios.Remove(vinculo);
            _context.MesaExpulsoesRegistro.Add(new MesaExpulsaoRegistro
            {
                Idmesa = idMesa,
                Idusuario = idUsuario,
                IdusuarioMestre = idMestre,
                NomeMesa = mesa.Nome,
                Motivo = motivo,
                DataExpulsao = DateTime.UtcNow,
            });
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return MesaParticipacaoPersistenciaResultado.Sucesso;
        }

        public Task<List<MesaExpulsaoRegistro>> GetExpulsionRecordsAsync(int idUsuario)
            => _context.MesaExpulsoesRegistro
                .AsNoTracking()
                .Include(registro => registro.Mestre)
                .Where(registro => registro.Idusuario == idUsuario)
                .OrderByDescending(registro => registro.DataExpulsao)
                .ToListAsync();

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
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                _context.ChangeTracker.Clear();
                await using var transaction = await _context.Database.BeginTransactionAsync();
                var mesa = await _context.Mesas.FindAsync(id);
                if (mesa is null) return false;

                // A mesa aponta para a sessão ativa e a sessão pertence à mesa.
                // Desfazemos primeiro esse vínculo circular para o cascade funcionar.
                if (mesa.IdMesaSessaoAtiva.HasValue)
                {
                    mesa.IdMesaSessaoAtiva = null;
                    await _context.SaveChangesAsync();
                }

                _context.Mesas.Remove(mesa);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            });
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

        private IQueryable<Mesa> DetailedQuery()
            => _context.Mesas
                .AsNoTracking()
                .Include(mesa => mesa.IdusuarioCriacaoNavigation)
                .Include(mesa => mesa.SistemaVersao)
                    .ThenInclude(versao => versao!.SistemaRpg)
                .Include(mesa => mesa.Mesausuarios)
                .Include(mesa => mesa.SolicitacoesEntrada);
    }
}
