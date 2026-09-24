using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using System.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class PersonagemJogadorRepository : IPersonagemJogadorRepository
    {
        private readonly OdisseiaContext _context;

        public PersonagemJogadorRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<PersonagemJogador>> GetAllAsync()
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .Include(p => p.ConfiguracaoVisibilidade)
                .ToListAsync();

        public async Task<List<PersonagemJogador>> GetByIdsAsync(IEnumerable<int> ids)
        {
            int[] normalizedIds = ids.Distinct().ToArray();
            if (normalizedIds.Length == 0)
                return new List<PersonagemJogador>();

            return await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .Include(p => p.ConfiguracaoVisibilidade)
                .Where(p => normalizedIds.Contains(p.IdpersonagemJogador))
                .ToListAsync();
        }

        public async Task<PersonagemJogador?> GetByIdAsync(int id) => await _context.PersonagemJogadores.FindAsync(id);

        public async Task<PersonagemJogador?> GetByIdWithDetailsAsync(int id)
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .Include(p => p.ConfiguracaoVisibilidade)
                .FirstOrDefaultAsync(p => p.IdpersonagemJogador == id);

        public async Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .Include(p => p.ConfiguracaoVisibilidade)
                .Where(p => p.Idusuario == usuarioId)
                .ToListAsync();
        }

        public Task<List<PersonagemJogador>> GetByMesaIdAsync(int mesaId)
            => _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                    .ThenInclude(mesa => mesa.SistemaVersao)
                .Include(p => p.Usuario)
                .Include(p => p.ConfiguracaoVisibilidade)
                .Where(p => p.Idmesa == mesaId)
                .OrderBy(p => p.Nome)
                .ToListAsync();

        public async Task<Dictionary<int, List<Proficiencia>>> GetProficienciasByPersonagemIdsAsync(IEnumerable<int> personagemIds)
        {
            int[] ids = personagemIds.Distinct().ToArray();
            if (ids.Length == 0)
                return new Dictionary<int, List<Proficiencia>>();

            var rows = await _context.PersonagemProficiencias
                .AsNoTracking()
                .Where(link => link.IdpersonagemJogador.HasValue && ids.Contains(link.IdpersonagemJogador.Value))
                .Join(
                    _context.Proficiencias.AsNoTracking(),
                    link => link.Idproficiencia,
                    proficiencia => proficiencia.Idproficiencia,
                    (link, proficiencia) => new
                    {
                        PersonagemId = link.IdpersonagemJogador!.Value,
                        Proficiencia = proficiencia,
                    })
                .ToListAsync();

            return rows
                .GroupBy(row => row.PersonagemId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(row => row.Proficiencia).ToList());
        }


        public async Task<PersonagemJogador> CreateAsync(PersonagemJogador personagem)
        {
            _context.PersonagemJogadores.Add(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<PersonagemJogador> UpdateAsync(PersonagemJogador personagem)
        {
            _context.PersonagemJogadores.Update(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<PersonagemJogador> UpdateWithRuntimeAuditAsync(
            PersonagemJogador personagem,
            long revisaoEsperada,
            PersonagemRuntimeWriteAudit audit)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                _context.ChangeTracker.Clear();
                int? idMesaAtual = await _context.PersonagemJogadores
                    .AsNoTracking()
                    .Where(item => item.IdpersonagemJogador == personagem.IdpersonagemJogador)
                    .Select(item => (int?)item.Idmesa)
                    .SingleOrDefaultAsync();
                if (!idMesaAtual.HasValue)
                    throw new KeyNotFoundException("PERSONAGEM_NAO_ENCONTRADO");

                await using var transaction = await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);
                try
                {
                    // Lock source and destination in a stable order. A sheet edit
                    // must not bypass the active-session ledger by changing Idmesa.
                    List<Mesa> mesasBloqueadas = await _context.Mesas
                        .FromSqlInterpolated($"SELECT * FROM `mesas` WHERE `IDMesa` IN ({idMesaAtual.Value}, {personagem.Idmesa}) ORDER BY `IDMesa` FOR UPDATE")
                        .ToListAsync();
                    Mesa? mesaAtual = mesasBloqueadas.SingleOrDefault(item => item.Idmesa == idMesaAtual.Value);
                    Mesa? mesaDestino = mesasBloqueadas.SingleOrDefault(item => item.Idmesa == personagem.Idmesa);
                    if (mesaAtual is null || mesaDestino is null)
                        throw new InvalidOperationException("MESA_NAO_ENCONTRADA");

                    var sessoesAtivas = new Dictionary<int, MesaSessao>();
                    foreach (Mesa mesaBloqueada in mesasBloqueadas)
                    {
                        if (!mesaBloqueada.IdMesaSessaoAtiva.HasValue)
                            continue;

                        MesaSessao? sessaoBloqueada = await _context.MesaSessoes
                            .FromSqlInterpolated(
                                $"SELECT * FROM `mesasessoes` WHERE `IDMesaSessao` = {mesaBloqueada.IdMesaSessaoAtiva.Value} FOR UPDATE")
                            .SingleOrDefaultAsync();
                        if (sessaoBloqueada is null || sessaoBloqueada.Status != MesaSessaoStatus.Ativa)
                            throw new DbUpdateConcurrencyException("SESSAO_ATIVA_INCONSISTENTE");

                        sessoesAtivas[mesaBloqueada.Idmesa] = sessaoBloqueada;
                    }

                    PersonagemJogador? locked = await _context.PersonagemJogadores
                        .FromSqlInterpolated(
                            $"SELECT * FROM `personagensJogador` WHERE `IDPersonagemJogador` = {personagem.IdpersonagemJogador} FOR UPDATE")
                        .SingleOrDefaultAsync();
                    if (locked is null)
                        throw new KeyNotFoundException("PERSONAGEM_NAO_ENCONTRADO");

                    if (locked.Idmesa != idMesaAtual.Value)
                        throw new DbUpdateConcurrencyException("PERSONAGEM_MOVIMENTADO");

                    bool mudouDeMesa = locked.Idmesa != personagem.Idmesa;
                    if (mudouDeMesa && sessoesAtivas.Count > 0)
                        throw new InvalidOperationException("MESA_EM_SESSAO_NAO_PODE_MOVER_PERSONAGEM");

                    MesaSessao? sessao = mudouDeMesa
                        ? null
                        : sessoesAtivas.GetValueOrDefault(mesaAtual.Idmesa);

                    if (sessao is not null)
                    {
                        MesaComando? existing = await _context.MesaComandos.AsNoTracking().FirstOrDefaultAsync(item =>
                            item.IdMesa == mesaAtual.Idmesa &&
                            item.IdUsuarioAtor == audit.IdUsuarioAtor &&
                            item.ChaveIdempotencia == audit.ChaveIdempotencia.ToString("D"));
                        if (existing is not null)
                        {
                            if (!string.Equals(existing.HashPayload, audit.HashPayload, StringComparison.Ordinal))
                                throw new DbUpdateConcurrencyException("CHAVE_IDEMPOTENCIA_REUTILIZADA");

                            await transaction.CommitAsync();
                            return locked;
                        }
                    }

                    if (locked.RevisaoRuntime != revisaoEsperada)
                        throw new DbUpdateConcurrencyException("REVISAO_PERSONAGEM_DESATUALIZADA");

                    _context.Entry(locked).CurrentValues.SetValues(personagem);
                    locked.RevisaoRuntime = checked(revisaoEsperada + 1);

                    if (sessao is not null)
                    {
                        DateTime now = DateTime.UtcNow;
                        var command = new MesaComando
                        {
                            IdMesa = mesaAtual.Idmesa,
                            IdMesaSessao = sessao.IdMesaSessao,
                            ChaveIdempotencia = audit.ChaveIdempotencia.ToString("D"),
                            HashPayload = audit.HashPayload,
                            IdUsuarioAtor = audit.IdUsuarioAtor,
                            IdPersonagemJogador = locked.IdpersonagemJogador,
                            Tipo = audit.TipoComando,
                            RevisaoSessaoEsperada = sessao.RevisaoEstado,
                            RevisaoPersonagemEsperada = revisaoEsperada,
                            RevisoesAlvosJson = $$"""{"personagem":{{revisaoEsperada}}}""",
                            Status = MesaComandoStatus.Concluido,
                            RespostaJson = "{}",
                            CriadoEmUtc = now,
                            ConcluidoEmUtc = now,
                        };
                        _context.MesaComandos.Add(command);
                        await _context.SaveChangesAsync();

                        sessao.UltimaSequenciaEvento++;
                        sessao.RevisaoEstado++;
                        _context.MesaEventos.Add(new MesaEvento
                        {
                            IdMesaSessao = sessao.IdMesaSessao,
                            IdMesaComando = command.IdMesaComando,
                            Sequencia = sessao.UltimaSequenciaEvento,
                            Tipo = "FICHA_ATUALIZADA",
                            Origem = GameplayEventOrigin.Automatica,
                            Visibilidade = GameplayEventVisibility.PublicaMesa,
                            IdUsuarioAtor = audit.IdUsuarioAtor,
                            IdPersonagemJogador = locked.IdpersonagemJogador,
                            IdSistemaVersaoEfetiva = sessao.IdSistemaVersao,
                            IdSistemaVersaoPersonagem = locked.IdSistemaVersao,
                            CodigoRegra = "FICHA_ATUALIZAR",
                            SchemaVersion = 1,
                            DadosJson = audit.DadosEventoJson,
                            OcorreuEmUtc = now,
                        });
                        command.RespostaJson = $$"""{"idPersonagemJogador":{{locked.IdpersonagemJogador}},"revisaoRuntime":{{locked.RevisaoRuntime}},"sequenciaEvento":{{sessao.UltimaSequenciaEvento}}}""";
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return locked;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    _context.ChangeTracker.Clear();
                    throw;
                }
            });
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await DeleteManyAsync(new[] { id }) == 1;
        }

        public async Task<int?> GetTableIdAsync(int id)
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Where(personagem => personagem.IdpersonagemJogador == id)
                .Select(personagem => (int?)personagem.Idmesa)
                .FirstOrDefaultAsync();

        public async Task<List<PersonagemComparacaoRegistro>> SearchTableForComparisonAsync(
            int tableId,
            string term,
            int? excludedId,
            int limit)
        {
            string pattern = $"%{term.Trim()}%";

            return await _context.PersonagemJogadores
                .AsNoTracking()
                .Where(personagem => personagem.Idmesa == tableId)
                .Where(personagem => !excludedId.HasValue || personagem.IdpersonagemJogador != excludedId.Value)
                .Where(personagem => EF.Functions.Like(personagem.Nome, pattern))
                .OrderBy(personagem => personagem.Nome)
                .Take(limit)
                .Select(personagem => new PersonagemComparacaoRegistro
                {
                    Id = personagem.IdpersonagemJogador,
                    Jogador = true,
                    Visivel = personagem.Visivel,
                    Idusuario = personagem.Idusuario,
                    Nome = personagem.Nome,
                    Imagem = personagem.Imagem,
                    IdRaca = personagem.Idraca,
                    IdMesa = personagem.Idmesa,
                    MesaNome = personagem.Mesa.Nome,
                    StatusJson = personagem.StatusJson,
                    SkillsJson = personagem.Skills,
                    ConfiguracaoVisibilidade = personagem.ConfiguracaoVisibilidade,
                })
                .ToListAsync();
        }

        public async Task<PersonagemComparacaoRegistro?> GetForComparisonAsync(int id)
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Where(personagem => personagem.IdpersonagemJogador == id)
                .Select(personagem => new PersonagemComparacaoRegistro
                {
                    Id = personagem.IdpersonagemJogador,
                    Jogador = true,
                    Visivel = personagem.Visivel,
                    Idusuario = personagem.Idusuario,
                    Nome = personagem.Nome,
                    Imagem = personagem.Imagem,
                    IdRaca = personagem.Idraca,
                    IdMesa = personagem.Idmesa,
                    MesaNome = personagem.Mesa.Nome,
                    StatusJson = personagem.StatusJson,
                    SkillsJson = personagem.Skills,
                    ConfiguracaoVisibilidade = personagem.ConfiguracaoVisibilidade,
                })
                .FirstOrDefaultAsync();

        public async Task<int> DeleteManyAsync(IEnumerable<int> ids)
        {
            int[] normalizedIds = ids.Distinct().ToArray();
            if (normalizedIds.Length == 0)
                return 0;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            List<PersonagemJogador> personagens = await _context.PersonagemJogadores
                .Where(p => normalizedIds.Contains(p.IdpersonagemJogador))
                .ToListAsync();

            if (personagens.Count != normalizedIds.Length)
                return 0;

            List<PersonagemProficiencia> proficiencyLinks = await _context.PersonagemProficiencias
                .Where(link =>
                    (link.IdpersonagemJogador.HasValue && normalizedIds.Contains(link.IdpersonagemJogador.Value)) ||
                    (EF.Property<int?>(link, "PersonagemJogadorIdpersonagemJogador").HasValue &&
                     normalizedIds.Contains(EF.Property<int?>(link, "PersonagemJogadorIdpersonagemJogador")!.Value)))
                .ToListAsync();

            _context.PersonagemProficiencias.RemoveRange(proficiencyLinks);
            _context.PersonagemJogadores.RemoveRange(personagens);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return personagens.Count;
        }
    }
}
