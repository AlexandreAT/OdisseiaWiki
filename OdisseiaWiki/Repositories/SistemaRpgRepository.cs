using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Repositories;

public sealed class SistemaRpgRepository : ISistemaRpgRepository
{
    private readonly OdisseiaContext _context;

    public SistemaRpgRepository(OdisseiaContext context) => _context = context;

    public Task<List<SistemaRpg>> GetAllAsync(bool includeInactive = false)
    {
        IQueryable<SistemaRpg> query = _context.SistemasRpg
            .AsNoTracking()
            .Include(s => s.VersaoPublicada)
            .Include(s => s.Versoes);

        if (!includeInactive)
            query = query.Where(s => s.Ativo);

        return query.OrderBy(s => s.Nome).AsSplitQuery().ToListAsync();
    }

    public Task<SistemaRpg?> GetByIdAsync(int id, bool tracked = false)
    {
        IQueryable<SistemaRpg> query = _context.SistemasRpg
            .Include(s => s.VersaoPublicada)
            .Include(s => s.Versoes);
        if (!tracked)
            query = query.AsNoTracking();
        return query.AsSplitQuery().FirstOrDefaultAsync(s => s.IdSistemaRpg == id);
    }

    public Task<SistemaRpg?> GetByCodeAsync(string code, bool tracked = false)
    {
        IQueryable<SistemaRpg> query = _context.SistemasRpg
            .Include(s => s.VersaoPublicada)
            .Include(s => s.Versoes);
        if (!tracked)
            query = query.AsNoTracking();
        return query.AsSplitQuery().FirstOrDefaultAsync(s => s.Codigo == code);
    }

    public Task<List<SistemaVersao>> GetVersionsAsync(int idSistemaRpg) =>
        _context.SistemaVersoes
            .AsNoTracking()
            .Where(v => v.IdSistemaRpg == idSistemaRpg)
            .OrderByDescending(v => v.DataCriacao)
            .ToListAsync();

    public Task<SistemaVersao?> GetVersionAsync(
        int idSistemaVersao,
        bool includeConfiguration = false,
        bool tracked = false)
    {
        IQueryable<SistemaVersao> query = _context.SistemaVersoes
            .Include(v => v.SistemaRpg)
            .ThenInclude(s => s.VersaoPublicada);

        if (includeConfiguration)
        {
            query = query
                .Include(v => v.Modulos)
                .Include(v => v.Niveis)
                .Include(v => v.MarcosNivel)
                .Include(v => v.FontesExperiencia)
                .Include(v => v.Racas).ThenInclude(r => r.Passivas)
                .Include(v => v.Atributos)
                .Include(v => v.Recursos)
                .Include(v => v.Movimento)
                .Include(v => v.PontosAcao)
                .Include(v => v.Acoes)
                .Include(v => v.ResultadosDado)
                .Include(v => v.TiposDano)
                .Include(v => v.TiposDefesa)
                .Include(v => v.TiposMagia)
                .Include(v => v.SkillConfig)
                .Include(v => v.Condicoes)
                .Include(v => v.Descansos)
                .Include(v => v.Morte)
                .Include(v => v.ItemEscopos).ThenInclude(item => item.Campos)
                .Include(v => v.ItemEscopos).ThenInclude(item => item.Faixas)
                .Include(v => v.ItemEscopos).ThenInclude(item => item.Referencias);
        }

        if (!tracked)
            query = query.AsNoTracking();

        return query.AsSplitQuery().FirstOrDefaultAsync(v => v.IdSistemaVersao == idSistemaVersao);
    }

    public Task<SistemaVersao?> GetVersionByNumberAsync(
        int idSistemaRpg,
        string numeroVersao,
        bool tracked = false)
    {
        IQueryable<SistemaVersao> query = _context.SistemaVersoes;
        if (!tracked)
            query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(v =>
            v.IdSistemaRpg == idSistemaRpg && v.NumeroVersao == numeroVersao);
    }

    public Task<bool> SystemCodeExistsAsync(string code, int? exceptId = null) =>
        _context.SistemasRpg.AnyAsync(s => s.Codigo == code && (!exceptId.HasValue || s.IdSistemaRpg != exceptId));

    public Task<bool> VersionNumberExistsAsync(
        int idSistemaRpg,
        string numeroVersao,
        int? exceptId = null) =>
        _context.SistemaVersoes.AnyAsync(v =>
            v.IdSistemaRpg == idSistemaRpg &&
            v.NumeroVersao == numeroVersao &&
            (!exceptId.HasValue || v.IdSistemaVersao != exceptId));

    public Task<int> CountMesasBySystemAsync(int idSistemaRpg) =>
        _context.Mesas.CountAsync(m =>
            m.IdSistemaVersao.HasValue &&
            _context.SistemaVersoes.Any(v =>
                v.IdSistemaVersao == m.IdSistemaVersao.Value &&
                v.IdSistemaRpg == idSistemaRpg));

    public Task<int> CountMesasByVersionAsync(int idSistemaVersao) =>
        _context.Mesas.CountAsync(m => m.IdSistemaVersao == idSistemaVersao);

    public Task<bool> HasDerivedVersionsAsync(int idSistemaVersao) =>
        _context.SistemaVersoes.AnyAsync(v => v.IdVersaoBase == idSistemaVersao);

    public Task<Mesa?> GetMesaAsync(int idMesa, bool tracked = false)
    {
        IQueryable<Mesa> query = _context.Mesas
            .Include(m => m.SistemaVersao)
            .ThenInclude(v => v!.SistemaRpg);
        if (!tracked)
            query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(m => m.Idmesa == idMesa);
    }

    public Task<PersonagemJogador?> GetPlayerCharacterAsync(
        int idPersonagemJogador,
        bool tracked = false)
    {
        IQueryable<PersonagemJogador> query = _context.PersonagemJogadores
            .Include(personagem => personagem.Mesa)
                .ThenInclude(mesa => mesa.SistemaVersao)
                    .ThenInclude(versao => versao!.SistemaRpg)
            .Include(personagem => personagem.SistemaVersao)
                .ThenInclude(versao => versao!.SistemaRpg);
        if (!tracked)
            query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(personagem =>
            personagem.IdpersonagemJogador == idPersonagemJogador);
    }

    public Task<Mesa?> GetMesaForMigrationPreviewAsync(int idMesa) =>
        _context.Mesas
            .AsNoTracking()
            .Include(m => m.SistemaVersao)
                .ThenInclude(v => v!.SistemaRpg)
            .Include(m => m.PersonagensJogadores)
            .Include(m => m.MesaEntidadeConfigs)
            .AsSplitQuery()
            .FirstOrDefaultAsync(m => m.Idmesa == idMesa);

    public Task<SistemaPatchNote?> GetPatchNoteByVersionAsync(int idSistemaVersao) =>
        _context.SistemaPatchNotes
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IdSistemaVersao == idSistemaVersao);

    public Task<List<Mesa>> GetMesasWithoutVersionAsync() =>
        _context.Mesas.Where(m => m.IdSistemaVersao == null).ToListAsync();

    public async Task SynchronizeDefaultMesaVersionAsync(int idSistemaVersao)
    {
        await _context.Mesas
            .Where(mesa => mesa.CodigoSistema == SystemMesaConstants.CodigoMesaPadrao)
            .ExecuteUpdateAsync(atualizacao => atualizacao
                .SetProperty(mesa => mesa.IdSistemaVersao, idSistemaVersao)
                .SetProperty(mesa => mesa.PadraoSistema, true)
                .SetProperty(mesa => mesa.Nome, SystemMesaConstants.NomeMesaPadrao));
    }

    public Task<List<Raca>> GetRacesAsync() =>
        _context.Racas.AsNoTracking().ToListAsync();

    public Task<List<Passiva>> GetPassivasAsync() =>
        _context.Passivas.AsNoTracking().ToListAsync();

    public Task<SistemaEntidadeGlobalVinculoSnapshot?> GetGlobalEntityBindingAsync(
        SistemaEntidadeGlobalTipo tipoEntidade,
        string idEntidade)
    {
        return tipoEntidade switch
        {
            SistemaEntidadeGlobalTipo.Npc when int.TryParse(idEntidade, out int idNpc) =>
                _context.Personagens.AsNoTracking()
                    .Where(entity => entity.Idpersonagem == idNpc)
                    .Select(entity => new SistemaEntidadeGlobalVinculoSnapshot
                    {
                        TipoEntidade = tipoEntidade,
                        IdEntidade = idEntidade,
                        IdSistemaRpg = entity.IdSistemaRpg,
                        IdSistemaVersao = entity.IdSistemaVersao,
                        AcompanharPublicacaoAtual = entity.AcompanharPublicacaoAtual,
                        EstadoJson = entity.StatusJson,
                        SkillsJson = entity.Skills,
                        MagiasJson = entity.Magia,
                    })
                    .FirstOrDefaultAsync(),
            SistemaEntidadeGlobalTipo.Raca when int.TryParse(idEntidade, out int idRaca) =>
                _context.Racas.AsNoTracking()
                    .Where(entity => entity.Idraca == idRaca)
                    .Select(entity => new SistemaEntidadeGlobalVinculoSnapshot
                    {
                        TipoEntidade = tipoEntidade,
                        IdEntidade = idEntidade,
                        IdSistemaRpg = entity.IdSistemaRpg,
                        IdSistemaVersao = entity.IdSistemaVersao,
                        AcompanharPublicacaoAtual = entity.AcompanharPublicacaoAtual,
                        EstadoJson = entity.StatusJson,
                    })
                    .FirstOrDefaultAsync(),
            SistemaEntidadeGlobalTipo.Item =>
                _context.Itens.AsNoTracking()
                    .Where(entity => entity.Iditem == idEntidade)
                    .Select(entity => new SistemaEntidadeGlobalVinculoSnapshot
                    {
                        TipoEntidade = tipoEntidade,
                        IdEntidade = idEntidade,
                        IdSistemaRpg = entity.IdSistemaRpg,
                        IdSistemaVersao = entity.IdSistemaVersao,
                        AcompanharPublicacaoAtual = entity.AcompanharPublicacaoAtual,
                        TipoItem = entity.Tipo,
                        EstadoJson = entity.AtributosJson,
                    })
                    .FirstOrDefaultAsync(),
            _ => Task.FromResult<SistemaEntidadeGlobalVinculoSnapshot?>(null),
        };
    }

    public Task<Raca?> GetRaceRuntimeAsync(int idRaca) =>
        _context.Racas.AsNoTracking().FirstOrDefaultAsync(raca => raca.Idraca == idRaca);

    public Task<MesaEntidadeConfig?> GetMesaEntityConfigAsync(
        int idMesa,
        MesaEntidadeTipo tipoEntidade,
        string idEntidade) =>
        _context.MesaEntidadeConfigs.AsNoTracking().FirstOrDefaultAsync(configuracao =>
            configuracao.Idmesa == idMesa &&
            configuracao.TipoEntidade == tipoEntidade &&
            configuracao.Identidade == idEntidade);

    public async Task AddSystemAsync(SistemaRpg sistema)
    {
        await _context.SistemasRpg.AddAsync(sistema);
    }

    public async Task AddVersionAsync(SistemaVersao versao)
    {
        await _context.SistemaVersoes.AddAsync(versao);
    }

    public async Task AddPatchNoteAsync(SistemaPatchNote patchNote)
    {
        await _context.SistemaPatchNotes.AddAsync(patchNote);
    }

    public void RemoveSystem(SistemaRpg sistema) => _context.SistemasRpg.Remove(sistema);

    public void RemoveVersion(SistemaVersao versao) => _context.SistemaVersoes.Remove(versao);

    public void RemoveRange(IEnumerable<object> entities) => _context.RemoveRange(entities);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();

    public async Task ExecuteInTransactionAsync(Func<Task> operation)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            await operation();
            await transaction.CommitAsync();
        });
    }
}
