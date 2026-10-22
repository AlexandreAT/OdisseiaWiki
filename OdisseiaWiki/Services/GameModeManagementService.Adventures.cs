using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameModeManagementService
{
    private async Task<(Mesa? Mesa, int? SystemVersion)> ResolveAdventureScopeAsync(
        int? idMesa, int? requestedVersion, int userId, bool admin, CancellationToken token)
    {
        if (_context is null) return (null, null);
        if (idMesa is null)
        {
            if (!admin) return (null, null);
            int? version = requestedVersion ?? await _management.GetCurrentSystemVersionIdAsync(token);
            return (null, version);
        }
        Mesa? mesa = await _context.Mesas.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Idmesa == idMesa.Value, token);
        if (mesa is null || (!admin && mesa.IdusuarioCriacao != userId)) return (null, null);
        int? currentVersion = mesa.IdSistemaVersao;
        if (currentVersion is null && !string.IsNullOrWhiteSpace(mesa.CodigoSistema))
            currentVersion = await _context.SistemasRpg.AsNoTracking()
                .Where(item => item.Codigo == mesa.CodigoSistema && item.Ativo)
                .Select(item => item.IdVersaoPublicada).FirstOrDefaultAsync(token);
        if (requestedVersion is int selected && selected != currentVersion)
            return (null, null);
        return (mesa, currentVersion);
    }

    public async Task<bool> CanManageAdventureAsync(
        int? idMesa, int userId, bool admin, CancellationToken token)
    {
        var scope = await ResolveAdventureScopeAsync(idMesa, null, userId, admin, token);
        return scope.SystemVersion.HasValue;
    }

    public async Task<int?> GetAdventureSystemVersionAsync(
        int? idMesa, int userId, bool admin, CancellationToken token)
    {
        var scope = await ResolveAdventureScopeAsync(idMesa, null, userId, admin, token);
        return scope.SystemVersion;
    }

    public async Task<bool> CanUseAdventureSystemVersionAsync(
        int? idMesa, int? versionId, int userId, bool admin, CancellationToken token)
    {
        if (!await CanManageAdventureAsync(idMesa, userId, admin, token)) return false;
        if (idMesa is null) return true;
        if (versionId is null) return false;
        int? current = await GetAdventureSystemVersionAsync(idMesa, userId, admin, token);
        return current == versionId || await _context!.GameModeVersions.AsNoTracking().AnyAsync(
            mode => mode.IdMesa == idMesa && mode.IdSistemaVersao == versionId, token);
    }

    public async Task<IReadOnlyList<GameModeSystemVersionDto>> GetAdventureSystemVersionsAsync(
        int? idMesa, int userId, bool admin, CancellationToken token)
    {
        int? id = await GetAdventureSystemVersionAsync(idMesa, userId, admin, token);
        if (id is null) return [];
        if (idMesa is null) return await _management.GetSystemVersionsAsync(token);
        int[] pinned = await _context!.GameModeVersions.AsNoTracking()
            .Where(item => item.IdMesa == idMesa)
            .Select(item => item.IdSistemaVersao).Distinct().ToArrayAsync(token);
        int[] available = pinned.Append(id.Value).Distinct().ToArray();
        var versions = await _context.SistemaVersoes.AsNoTracking()
            .Where(item => available.Contains(item.IdSistemaVersao))
            .Select(item => new { item.IdSistemaVersao, item.NumeroVersao, item.Status })
            .ToArrayAsync(token);
        return versions.Select(version => new GameModeSystemVersionDto(
            version.IdSistemaVersao, version.NumeroVersao, version.Status.ToString(),
            version.IdSistemaVersao == id)).ToArray();
    }

    public async Task<IReadOnlyList<GameModeRestOptionDto>> GetRestOptionsForVersionAsync(
        int idSistemaVersao, CancellationToken token)
    {
        SistemaVersao? version = await _systems.GetVersionAsync(idSistemaVersao, includeConfiguration: true);
        return version?.Descansos.OrderBy(rest => rest.Ordem).Select(rest =>
            new GameModeRestOptionDto(rest.Tipo, rest.Nome, rest.RecuperacaoVida,
                rest.RecuperacaoMana, rest.RecuperacaoEstamina,
                rest.TipoRecuperacao == SistemaRecuperacaoTipo.Percentual,
                rest.ExigeGuarda, rest.TipoRecuperacao != SistemaRecuperacaoTipo.Formula)).ToArray() ?? [];
    }

    public async Task<bool> CanManageDraftAsync(
        int id, int? idMesa, int userId, bool admin, CancellationToken token)
    {
        if (_context is null) return false;
        GameModeVersion? draft = await _context.GameModeVersions.AsNoTracking()
            .FirstOrDefaultAsync(item => item.IdGameModeVersion == id &&
                item.Status == GameModeVersionStatus.Rascunho && item.IdMesa == idMesa, token);
        return draft is not null && await CanManageAdventureAsync(idMesa, userId, admin, token);
    }

    public async Task<IReadOnlyList<GameAdventureDto>> ListAdventuresAsync(
        int? idMesa, int userId, bool admin, CancellationToken token)
    {
        if (_context is null || !await CanManageAdventureAsync(idMesa, userId, admin, token)) return [];
        var versions = await _context.GameModeVersions.AsNoTracking()
            .Where(item => item.IdMesa == idMesa)
            .OrderByDescending(item => item.CriadaEmUtc).ToListAsync(token);
        return versions.GroupBy(item => item.Codigo).Select(group =>
        {
            GameModeVersion latest = group.First();
            return new GameAdventureDto(group.Key, idMesa, latest.IdSistemaVersao,
                latest.Nome ?? "Odisseia", latest.Descricao, latest.Banner,
                latest.Status.ToString(), latest.NumeroVersao);
        }).OrderBy(item => item.Nome).ToArray();
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> GetAdventureAsync(
        string code, int? idMesa, int? idSistemaVersao, int userId, bool admin, CancellationToken token)
    {
        if (_context is null || !await CanManageAdventureAsync(idMesa, userId, admin, token))
            return GameRunOperationResult<GameModeEditorDto>.Fail("ACESSO_NEGADO", "Você não gerencia esta mesa.");
        GameModeVersion? mode = await _context.GameModeVersions.AsNoTracking()
            .Where(item => item.Codigo == code && item.IdMesa == idMesa &&
                (idSistemaVersao == null || item.IdSistemaVersao == idSistemaVersao))
            .OrderByDescending(item => item.CriadaEmUtc)
            .ThenByDescending(item => item.Status == GameModeVersionStatus.Rascunho)
            .FirstOrDefaultAsync(token);
        if (mode is null) return MissingMode();
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(mode,
            await _management.GetAttackOutcomeCodesAsync(mode.IdSistemaVersao, token)));
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> CreateAdventureAsync(
        GameAdventureCreateDto request, int userId, bool admin, CancellationToken token)
    {
        if (_context is null) return MissingSystem();
        string name = request.Nome?.Trim() ?? string.Empty;
        if (name.Length is < 2 or > 100 || request.Descricao?.Length > 500 ||
            request.Banner?.Length > 255 || string.IsNullOrWhiteSpace(request.Banner))
            return GameRunOperationResult<GameModeEditorDto>.Fail("IDENTIDADE_INVALIDA",
                "Informe nome, descrição opcional e banner retangular do jogo.");
        var scope = await ResolveAdventureScopeAsync(request.IdMesa, request.IdSistemaVersao,
            userId, admin, token);
        if (scope.SystemVersion is not int versionId) return MissingSystem();
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(versionId, token);
        if (outcomes.Count == 0)
            return GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INCOMPATIVEL",
                "O Sistema precisa de ATAQUE_COMUM em 1D20 para este jogo.");

        // Um jogo novo nunca herda encontros, NPCs ou loot de outra mesa.
        JsonObject config = new()
        {
            ["schemaVersion"] = 1,
            ["map"] = new JsonObject { ["schemaVersion"] = 5 },
            ["areas"] = JsonSerializer.SerializeToNode(new[] { new GameModeAreaDto
            {
                Code = "FASE_1", Name = "Primeira área", NodeCount = 18,
                FinalOption = "ALEATORIO", Options = [new GameModeAreaOptionDto
                    { Type = "COMBATE", EncounterCode = "ENCONTRO_1" }],
            } }, JsonOptions),
            ["encounters"] = JsonSerializer.SerializeToNode(new Dictionary<string, GameBattleEncounterConfig>
            {
                ["ENCONTRO_1"] = new()
                {
                    MapName = "Encontro 1", Configured = false,
                    Enemy = new GameBattlePreviewEnemy { Name = "Inimigo", MaxVida = 100 },
                    DamageByResult = outcomes.ToDictionary(code => code, _ => 0),
                },
            }, JsonOptions),
            ["previewFallbackAction"] = JsonSerializer.SerializeToNode(
                new GameBattleFallbackAction { Name = "Ataque de treino", BaseDamage = 40 }, JsonOptions),
            ["previewPlayerDamageByResult"] = JsonSerializer.SerializeToNode(
                outcomes.ToDictionary(code => code, code => new GameBattleDamageModifier
                    { Multiplier = code is "ACERTO" or "ACERTO_PRECISO" ? 1 : code == "CRITICO" ? 2 : 0 }), JsonOptions),
        };
        var mode = new GameModeVersion
        {
            Codigo = "GAME_" + Guid.NewGuid().ToString("N")[..20],
            NumeroVersao = "0.4.0", IdMesa = request.IdMesa,
            IdUsuarioCriacao = userId, Nome = name,
            Descricao = request.Descricao?.Trim(), Banner = request.Banner,
            IdSistemaVersao = versionId, Status = GameModeVersionStatus.Rascunho,
            ConfiguracaoJson = config.ToJsonString(JsonOptions), CriadaEmUtc = DateTime.UtcNow,
        };
        _context.GameModeVersions.Add(mode);
        await _context.SaveChangesAsync(token);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(mode, outcomes));
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> CreateAdventureDraftAsync(
        string code, int? idMesa, int userId, bool admin, CancellationToken token)
    {
        if (_context is null || !await CanManageAdventureAsync(idMesa, userId, admin, token))
            return GameRunOperationResult<GameModeEditorDto>.Fail("ACESSO_NEGADO", "Você não gerencia esta mesa.");
        GameModeVersion? source = await _context.GameModeVersions.AsNoTracking()
            .Where(item => item.Codigo == code && item.IdMesa == idMesa)
            .OrderByDescending(item => item.CriadaEmUtc)
            .ThenByDescending(item => item.Status == GameModeVersionStatus.Rascunho)
            .FirstOrDefaultAsync(token);
        if (source is null) return MissingMode();
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(source.IdSistemaVersao, token);
        if (source.Status == GameModeVersionStatus.Rascunho)
            return GameRunOperationResult<GameModeEditorDto>.Ok(Map(source, outcomes));
        string[] numbers = await _context.GameModeVersions.AsNoTracking()
            .Where(item => item.Codigo == code && item.IdSistemaVersao == source.IdSistemaVersao)
            .Select(item => item.NumeroVersao).ToArrayAsync(token);
        int revision = numbers.Select(number => number.StartsWith("0.4.", StringComparison.Ordinal) &&
            int.TryParse(number.AsSpan(4), out int parsed) ? parsed : -1).DefaultIfEmpty(-1).Max() + 1;
        var draft = new GameModeVersion
        {
            Codigo = code, NumeroVersao = $"0.4.{revision}",
            IdMesa = idMesa, IdUsuarioCriacao = source.IdUsuarioCriacao,
            Nome = source.Nome, Descricao = source.Descricao, Banner = source.Banner,
            IdSistemaVersao = source.IdSistemaVersao,
            Status = GameModeVersionStatus.Rascunho,
            SchemaVersion = source.SchemaVersion,
            ConfiguracaoJson = source.ConfiguracaoJson,
            CriadaEmUtc = DateTime.UtcNow,
        };
        _context.GameModeVersions.Add(draft);
        await _context.SaveChangesAsync(token);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, outcomes));
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> AdaptAdventureAsync(
        string code, int? idMesa, int userId, bool admin, CancellationToken token)
    {
        var scope = await ResolveAdventureScopeAsync(idMesa, null, userId, admin, token);
        if (_context is null || scope.SystemVersion is not int targetId)
            return GameRunOperationResult<GameModeEditorDto>.Fail("ACESSO_NEGADO", "Você não gerencia esta Mesa.");
        GameModeVersion? current = await _context.GameModeVersions.AsNoTracking()
            .Where(mode => mode.Codigo == code && mode.IdMesa == idMesa &&
                mode.IdSistemaVersao == targetId)
            .OrderByDescending(mode => mode.Status == GameModeVersionStatus.Rascunho)
            .ThenByDescending(mode => mode.CriadaEmUtc).FirstOrDefaultAsync(token);
        if (current is not null)
            return GameRunOperationResult<GameModeEditorDto>.Ok(Map(current,
                await _management.GetAttackOutcomeCodesAsync(targetId, token)));
        GameModeVersion? source = await _context.GameModeVersions.AsNoTracking()
            .Where(mode => mode.Codigo == code && mode.IdMesa == idMesa)
            .OrderByDescending(mode => mode.CriadaEmUtc).FirstOrDefaultAsync(token);
        if (source is null) return MissingMode();
        bool sameSystem = await _context.SistemaVersoes.AsNoTracking()
            .Where(version => version.IdSistemaVersao == source.IdSistemaVersao)
            .Select(version => version.IdSistemaRpg).SingleAsync(token) ==
            await _context.SistemaVersoes.AsNoTracking()
                .Where(version => version.IdSistemaVersao == targetId)
                .Select(version => version.IdSistemaRpg).SingleAsync(token);
        if (!sameSystem)
            return GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INCOMPATIVEL",
                "A Mesa usa outro Sistema. Crie um novo jogo para ele.");
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(targetId, token);
        if (outcomes.Count == 0)
            return GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INCOMPATIVEL",
                "Configure ATAQUE_COMUM em 1D20 na versão atual do Sistema.");
        SistemaVersao? target = await _systems.GetVersionAsync(targetId, includeConfiguration: true);
        if (target is null) return MissingSystem();
        JsonObject config = JsonNode.Parse(source.ConfiguracaoJson)?.AsObject()
            ?? throw new JsonException("Configuração do jogo de origem inválida.");
        AddMissingDamageOutcomes(config, outcomes);
        KeepTargetDamageOutcomes(config, outcomes);
        string? restType = target.Descansos.FirstOrDefault(rest =>
            rest.TipoRecuperacao != SistemaRecuperacaoTipo.Formula)?.Tipo;
        if (config["areas"] is JsonArray areas)
            foreach (JsonNode? area in areas)
            {
                if (area is not JsonObject entry) continue;
                string? configured = entry["baseRestType"]?.ToString();
                if (!target.Descansos.Any(rest => rest.Tipo == configured &&
                    rest.TipoRecuperacao != SistemaRecuperacaoTipo.Formula))
                    entry["baseRestType"] = restType;
            }
        config["map"] ??= new JsonObject();
        config["map"]!["schemaVersion"] = 5;
        var draft = new GameModeVersion
        {
            Codigo = code, NumeroVersao = "0.4.0", IdMesa = idMesa,
            IdUsuarioCriacao = source.IdUsuarioCriacao, Nome = source.Nome,
            Descricao = source.Descricao, Banner = source.Banner,
            IdSistemaVersao = targetId, Status = GameModeVersionStatus.Rascunho,
            SchemaVersion = source.SchemaVersion,
            ConfiguracaoJson = config.ToJsonString(JsonOptions), CriadaEmUtc = DateTime.UtcNow,
        };
        _context.GameModeVersions.Add(draft);
        await _context.SaveChangesAsync(token);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, outcomes));
    }
}
