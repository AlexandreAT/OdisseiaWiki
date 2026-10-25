using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Data;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.GameRuns.Map;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed partial class GameModeManagementService : IGameModeManagementService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IGameModeManagementRepository _management;
    private readonly IGameRunRepository _runs;
    private readonly ISistemaRpgRepository _systems;
    private readonly GameplayActionResolver _actionResolver;
    private readonly OdisseiaContext? _context;

    public GameModeManagementService(
        IGameModeManagementRepository management, IGameRunRepository runs,
        ISistemaRpgRepository systems, GameplayActionResolver actionResolver,
        OdisseiaContext? context = null)
    {
        _management = management;
        _runs = runs;
        _systems = systems;
        _actionResolver = actionResolver;
        _context = context;
    }

    public Task<IReadOnlyList<GameModeSystemVersionDto>> GetSystemVersionsAsync(CancellationToken cancellationToken) =>
        _management.GetSystemVersionsAsync(cancellationToken);

    public async Task<IReadOnlyList<GameModeLootOptionDto>> GetLootOptionsAsync(CancellationToken cancellationToken,
        int? idMesa = null, int? idSistemaVersao = null) =>
        (idMesa.HasValue && idSistemaVersao.HasValue
            ? await _management.GetLootItemsAsync(idMesa, idSistemaVersao.Value, cancellationToken)
            : await _management.GetLootItemsAsync(cancellationToken)).Where(item => item.Visivel).Select(item =>
            new GameModeLootOptionDto(item.Iditem, item.Nome, item.Tipo.ToString().ToLowerInvariant(), item.Imagem, item.Valor)).ToArray();

    private async Task<string?> FreezeLootAsync(IEnumerable<GameBattleEncounterConfig> encounters,
        CancellationToken token, int? idMesa = null, int? idSistemaVersao = null)
    {
        GameBattleEncounterConfig[] configured = encounters.Where(encounter => encounter.LootCount > 0 || encounter.Loot?.Count > 0).ToArray();
        if (configured.Length == 0) return null;
        IReadOnlyList<Item> items = (idMesa.HasValue && idSistemaVersao.HasValue
            ? await _management.GetLootItemsAsync(idMesa, idSistemaVersao.Value, token)
            : await _management.GetLootItemsAsync(token))
            .Where(item => item.Visivel).ToArray();
        foreach (GameBattleEncounterConfig encounter in configured)
        {
            if (encounter.Loot is null || encounter.LootCount is < 0 or > 100 || encounter.Loot.Count > 100 ||
                (encounter.LootCount > 0 && encounter.Loot.Count == 0) ||
                (encounter.LootCount == 0 && encounter.Loot.Count > 0) ||
                encounter.Loot.Any(entry => entry.Weight is < 1 or > 1000000) ||
                encounter.Loot.Select(entry => entry.ItemId).Distinct().Count() != encounter.Loot.Count)
                return "Configure de 0 a 100 recompensas por combate; uma pool com itens exige ao menos uma recompensa, com itens distintos e pesos de 1 a 1.000.000.";
            foreach (var entry in encounter.Loot)
            {
                Item? item = items.FirstOrDefault(candidate => candidate.Iditem == entry.ItemId);
                if (item is null) return "Um item de loot não está mais disponível no catálogo da Wiki.";
                try
                {
                    entry.Snapshot = FreezeCatalogItem(item);
                }
                catch (JsonException) { return $"O item {item.Nome} possui atributos inválidos para o loot."; }
            }
        }
        return null;
    }

    private async Task<string?> FreezeVendorOffersAsync(IEnumerable<GameModeAreaDto> areas,
        CancellationToken token, int? idMesa, int idSistemaVersao)
    {
        GameModeVendorOfferDto[] offers = areas.SelectMany(area => area.Options)
            .Where(option => option.Type == "VENDEDOR").SelectMany(option => option.Offers).ToArray();
        if (offers.Length == 0) return null;
        IReadOnlyList<Item> items = (idMesa.HasValue
            ? await _management.GetLootItemsAsync(idMesa, idSistemaVersao, token)
            : await _management.GetLootItemsAsync(token)).Where(item => item.Visivel).ToArray();
        foreach (GameModeVendorOfferDto offer in offers)
        {
            Item? item = items.FirstOrDefault(candidate => candidate.Iditem == offer.ItemId);
            if (item is null) return "Uma oferta do vendedor aponta para um item oculto ou indisponível.";
            try
            {
                offer.Snapshot = FreezeCatalogItem(item);
            }
            catch (JsonException) { return $"O item {item.Nome} possui atributos inválidos para a loja."; }
        }
        return null;
    }

    private static JsonObject FreezeCatalogItem(Item item) => new()
    {
        ["nome"] = item.Nome, ["tipo"] = item.Tipo.ToString().ToLowerInvariant(),
        ["imagem"] = item.Imagem, ["peso"] = item.Peso, ["valor"] = item.Valor,
        ["discricao"] = item.Discricao, ["descricao"] = item.Descricao, ["efeito"] = item.Efeito,
        ["atributos"] = string.IsNullOrWhiteSpace(item.AtributosJson) ? new JsonObject() : JsonNode.Parse(item.AtributosJson),
    };

    public async Task<IReadOnlyList<GameModeRestOptionDto>> GetRestOptionsAsync(
        int? idSistemaVersao, CancellationToken cancellationToken)
    {
        int? versionId = await ResolveSystemVersionIdAsync(idSistemaVersao, cancellationToken);
        SistemaVersao? version = versionId is int id
            ? await _systems.GetVersionAsync(id, includeConfiguration: true) : null;
        return version?.Descansos.OrderBy(rest => rest.Ordem).Select(rest =>
            new GameModeRestOptionDto(rest.Tipo, rest.Nome, rest.RecuperacaoVida,
                rest.RecuperacaoMana, rest.RecuperacaoEstamina,
                rest.TipoRecuperacao == SistemaRecuperacaoTipo.Percentual,
                rest.ExigeGuarda, rest.TipoRecuperacao != SistemaRecuperacaoTipo.Formula)).ToArray() ?? [];
    }

    private async Task<int?> ResolveSystemVersionIdAsync(int? requested, CancellationToken cancellationToken)
    {
        if (requested is null) return await _management.GetCurrentSystemVersionIdAsync(cancellationToken);
        IReadOnlyList<GameModeSystemVersionDto> versions = await _management.GetSystemVersionsAsync(cancellationToken);
        return versions.Any(item => item.Id == requested.Value) ? requested : null;
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> GetAsync(
        int? idSistemaVersao, CancellationToken cancellationToken)
    {
        int? systemVersion = await ResolveSystemVersionIdAsync(idSistemaVersao, cancellationToken);
        if (systemVersion is null) return MissingSystem();
        GameModeVersion? mode = await _management.GetDraftAsync(systemVersion.Value, cancellationToken)
            ?? await _runs.GetOrCreateModeVersionAsync(systemVersion.Value, cancellationToken);
        if (mode is null) return MissingMode();
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(systemVersion.Value, cancellationToken);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(mode, outcomes));
    }

    public async Task<IReadOnlyList<GameModeNpcOptionDto>> GetNpcOptionsAsync(
        int? idSistemaVersao, CancellationToken cancellationToken, int? idMesa = null)
    {
        int? versionId = idMesa.HasValue ? idSistemaVersao :
            await ResolveSystemVersionIdAsync(idSistemaVersao, cancellationToken);
        SistemaVersao? version = versionId is int resolvedVersionId
            ? await _systems.GetVersionAsync(resolvedVersionId, includeConfiguration: true) : null;
        IReadOnlyList<string> outcomes = versionId is int selectedVersionId
            ? await _management.GetAttackOutcomeCodesAsync(selectedVersionId, cancellationToken) : [];
        IReadOnlyList<Personagen> candidates = idMesa.HasValue && versionId.HasValue
            ? await _management.GetNpcCandidatesAsync(idMesa, versionId.Value, cancellationToken)
            : await _management.GetNpcCandidatesAsync(cancellationToken);
        var options = new List<GameModeNpcOptionDto>();
        foreach (Personagen npc in candidates)
        {
            if (!npc.Visivel) continue;
            JsonNode? status;
            try { status = JsonNode.Parse(npc.StatusJson); }
            catch (JsonException) { continue; }
            if (bool.TryParse(status?["generico"]?.ToString(), out bool generic) && generic &&
                status?["variantes"] is JsonArray variants)
            {
                foreach (JsonNode? variant in variants)
                {
                    string? id = variant?["id"]?.ToString();
                    string? name = variant?["nome"]?.ToString();
                    if (!string.IsNullOrWhiteSpace(id) && !string.IsNullOrWhiteSpace(name))
                        TryAddOption(id);
                }
            }
            else TryAddOption(null);

            void TryAddOption(string? variantId)
            {
                try
                {
                    var enemy = new GameBattlePreviewEnemy { VariantId = variantId };
                    CopyNpcSnapshot(enemy, npc);
                    options.Add(new GameModeNpcOptionDto(npc.Idpersonagem, enemy.Name, variantId, enemy.Image)
                    {
                        Vida = enemy.MaxVida, Mana = enemy.MaxMana, Estamina = enemy.MaxEstamina,
                        Defesa = enemy.Defesa, Actions = ReadNpcActions(enemy)
                            .Select(action => DescribeNpcAction(npc.Idpersonagem, enemy, action, version, outcomes))
                            .ToArray(),
                    });
                }
                catch (Exception error) when (error is JsonException or InvalidOperationException) { }
            }
        }
        return options;
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> CloneDraftAsync(
        int sourceSystemVersionId, int targetSystemVersionId, CancellationToken cancellationToken)
    {
        IReadOnlyList<GameModeSystemVersionDto> versions = await _management.GetSystemVersionsAsync(cancellationToken);
        if (sourceSystemVersionId == targetSystemVersionId ||
            !versions.Any(version => version.Id == sourceSystemVersionId) ||
            !versions.Any(version => version.Id == targetSystemVersionId))
            return GameRunOperationResult<GameModeEditorDto>.Fail("VERSAO_INVALIDA",
                "Escolha versões publicadas diferentes do Sistema para migrar o jogo.");
        if (await _management.GetDraftAsync(targetSystemVersionId, cancellationToken) is not null)
            return GameRunOperationResult<GameModeEditorDto>.Fail("RASCUNHO_EXISTENTE",
                "Já existe um rascunho nesta versão. Publique ou edite-o antes de migrar novamente.");
        GameModeVersion? source = await _management.GetLatestModeAsync(sourceSystemVersionId, cancellationToken);
        if (source is null)
            return GameRunOperationResult<GameModeEditorDto>.Fail("MODO_ORIGEM_INDISPONIVEL",
                "A versão de origem não possui um jogo para copiar.");
        SistemaVersao? targetVersion = await _systems.GetVersionAsync(targetSystemVersionId, includeConfiguration: true);
        if (targetVersion is null) return MissingSystem();
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(
            targetSystemVersionId, cancellationToken);
        if (outcomes.Count == 0)
            return GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INCOMPATIVEL",
                "A versão de destino precisa de ATAQUE_COMUM em 1D20 para o jogo.");

        JsonObject config = JsonNode.Parse(source.ConfiguracaoJson)?.AsObject()
            ?? throw new JsonException("A configuração do jogo de origem é inválida.");
        if (config["areas"] is null)
        {
            string[] codes = config["map"]?["branchEncounterCodes"]?.AsArray()
                .Select(item => item?.GetValue<string>() ?? "").Where(item => item.Length > 0).ToArray() ?? [];
            if (codes.Length == 0)
                return GameRunOperationResult<GameModeEditorDto>.Fail("MODO_ORIGEM_INCOMPATIVEL",
                    "O jogo de origem não possui áreas nem encontros de mapa migráveis.");
            config["areas"] = JsonSerializer.SerializeToNode(new[]
            {
                new GameModeAreaDto { Code = "FASE_1", Name = "Primeira área", BaseName = "Base",
                    FinalOption = "ALEATORIO", Options = codes.Select(code => new GameModeAreaOptionDto
                        { Type = "COMBATE", EncounterCode = code }).ToList() },
                new GameModeAreaDto { Code = "FASE_2", Name = "Área final", BaseName = "Base",
                    FinalOption = "ROTA:0", Options = codes.Select(code => new GameModeAreaOptionDto
                        { Type = "BOSS", EncounterCode = code }).ToList() },
            }, JsonOptions);
        }
        AddMissingDamageOutcomes(config, outcomes);
        KeepTargetDamageOutcomes(config, outcomes);
        string? executableRest = targetVersion.Descansos
            .FirstOrDefault(rest => rest.TipoRecuperacao != SistemaRecuperacaoTipo.Formula)?.Tipo;
        if (config["areas"] is JsonArray { Count: > 0 } && executableRest is null)
            return GameRunOperationResult<GameModeEditorDto>.Fail("DESCANSO_INCOMPATIVEL",
                "Configure e publique ao menos um descanso executável na versão de destino antes de migrar o jogo.");
        if (config["areas"] is JsonArray areas)
            foreach (JsonNode? area in areas)
            {
                if (area is not JsonObject entry) continue;
                string? restType = entry["baseRestType"]?.ToString();
                if (string.IsNullOrWhiteSpace(restType) || !targetVersion.Descansos.Any(rest =>
                    rest.TipoRecuperacao != SistemaRecuperacaoTipo.Formula &&
                    string.Equals(rest.Tipo, restType, StringComparison.OrdinalIgnoreCase)))
                    entry["baseRestType"] = executableRest;
                entry["finalOption"] ??= "ALEATORIO";
            }
        config["map"] ??= new JsonObject();
        config["map"]!["schemaVersion"] = 5;
        int revision = await _management.GetNextRevisionAsync(targetSystemVersionId, cancellationToken);
        var draft = new GameModeVersion
        {
            Codigo = "ROGUELIKE_MVP", NumeroVersao = $"0.4.{revision}",
            IdSistemaVersao = targetSystemVersionId, Status = GameModeVersionStatus.Rascunho,
            SchemaVersion = source.SchemaVersion,
            ConfiguracaoJson = config.ToJsonString(JsonOptions), CriadaEmUtc = DateTime.UtcNow,
        };
        await _management.AddAsync(draft, cancellationToken);
        await _management.SaveAsync(cancellationToken);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, outcomes));
    }

    private static void KeepTargetDamageOutcomes(JsonObject config, IReadOnlyList<string> outcomes)
    {
        var targetCodes = outcomes.ToHashSet(StringComparer.OrdinalIgnoreCase);
        static void Prune(JsonNode? node, HashSet<string> codes)
        {
            if (node is not JsonObject values) return;
            foreach (string key in values.Select(pair => pair.Key).Where(key => !codes.Contains(key)).ToArray())
                values.Remove(key);
        }
        Prune(config["previewPlayerDamageByResult"], targetCodes);
        Prune(config["previewDamageByResult"], targetCodes);
        if (config["encounters"] is JsonObject encounters)
            foreach ((_, JsonNode? encounter) in encounters)
                Prune(encounter?["damageByResult"], targetCodes);
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> CreateDraftAsync(
        int? idSistemaVersao, CancellationToken cancellationToken)
    {
        int? systemVersion = await ResolveSystemVersionIdAsync(idSistemaVersao, cancellationToken);
        if (systemVersion is null) return MissingSystem();
        GameModeVersion? draft = await _management.GetDraftAsync(systemVersion.Value, cancellationToken);
        if (draft is not null)
        {
            IReadOnlyList<string> existingOutcomes = await _management.GetAttackOutcomeCodesAsync(
                systemVersion.Value, cancellationToken);
            return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, existingOutcomes));
        }
        GameModeVersion? current = await _runs.GetOrCreateModeVersionAsync(systemVersion.Value, cancellationToken);
        string template = current?.ConfiguracaoJson ??
            await _management.GetDraftTemplateJsonAsync(cancellationToken);
        JsonObject config = JsonNode.Parse(template)?.AsObject()
            ?? throw new JsonException("A configuração atual do jogo é inválida.");
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(
            systemVersion.Value, cancellationToken);
        if (outcomes.Count == 0)
            return GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INCOMPATIVEL",
                "O combate automático precisa de ATAQUE_COMUM em 1D20 na versão publicada do Sistema.");
        AddMissingDamageOutcomes(config, outcomes);
        if (config["areas"] is null)
        {
            string[] codes = config["map"]?["branchEncounterCodes"]?.AsArray()
                .Select(item => item?.GetValue<string>() ?? "").Where(item => item.Length > 0).ToArray() ?? [];
            config["areas"] = JsonSerializer.SerializeToNode(new[]
            {
                new GameModeAreaDto
                {
                    Code = "FASE_1", Name = "Primeira área", BaseName = "Base",
                    Options = codes.Select(code => new GameModeAreaOptionDto
                    {
                        Type = "COMBATE", EncounterCode = code,
                    }).ToList(),
                },
                new GameModeAreaDto
                {
                    Code = "FASE_2", Name = "Área final", BaseName = "Base",
                    Options = codes.Select(code => new GameModeAreaOptionDto
                    {
                        Type = "BOSS", EncounterCode = code,
                    }).ToList(),
                },
            }, JsonOptions);
        }
        int previousMapSchema = int.TryParse(config["map"]?["schemaVersion"]?.ToString(), out int schema)
            ? schema : 0;
        if (config["areas"] is JsonArray draftAreas)
        {
            foreach (JsonNode? area in draftAreas)
                if (area is JsonObject areaObject && areaObject["finalOption"] is null)
                    areaObject["finalOption"] = "ALEATORIO";
            if (previousMapSchema < 5 && draftAreas.LastOrDefault() is JsonObject lastArea &&
                lastArea["options"] is JsonArray lastOptions && lastOptions.Count > 0 &&
                lastOptions.All(option => option?["type"]?.ToString() == "BOSS"))
                lastArea["finalOption"] = "ROTA:0";
        }
        config["map"]!["schemaVersion"] = 5;
        int revision = await _management.GetNextRevisionAsync(systemVersion.Value, cancellationToken);
        draft = new GameModeVersion
        {
            Codigo = "ROGUELIKE_MVP",
            NumeroVersao = $"0.4.{revision}",
            IdSistemaVersao = systemVersion.Value,
            Status = GameModeVersionStatus.Rascunho,
            SchemaVersion = 1,
            ConfiguracaoJson = config.ToJsonString(JsonOptions),
            CriadaEmUtc = DateTime.UtcNow,
        };
        await _management.AddAsync(draft, cancellationToken);
        await _management.SaveAsync(cancellationToken);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, outcomes));
    }

    private static void AddMissingDamageOutcomes(JsonObject config, IReadOnlyList<string> outcomes)
    {
        JsonObject player = config["previewPlayerDamageByResult"] as JsonObject ?? new JsonObject();
        JsonObject previewEnemy = config["previewDamageByResult"] as JsonObject ?? new JsonObject();
        foreach (string code in outcomes)
        {
            player[code] ??= new JsonObject { ["multiplier"] = 0, ["bonus"] = 0 };
            previewEnemy[code] ??= 0;
        }
        if (player.Parent is null) config["previewPlayerDamageByResult"] = player;
        if (previewEnemy.Parent is null) config["previewDamageByResult"] = previewEnemy;
        if (config["encounters"] is JsonObject encounters)
            foreach ((_, JsonNode? encounter) in encounters)
            {
                if (encounter is not JsonObject entry) continue;
                JsonObject damage = entry["damageByResult"] as JsonObject ?? new JsonObject();
                foreach (string code in outcomes) damage[code] ??= 0;
                if (damage.Parent is null) entry["damageByResult"] = damage;
            }
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> SaveDraftAsync(
        int id, GameModeEditorUpdateDto update, CancellationToken cancellationToken, int? idMesa = null)
    {
        GameModeVersion? draft = await _management.GetDraftByIdAsync(id, cancellationToken);
        if (draft is null || draft.IdMesa != idMesa) return DraftUnavailable();
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(draft.IdSistemaVersao, cancellationToken);
        string? error = Validate(update, outcomes);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("CONFIGURACAO_INVALIDA", error);
        foreach (int npcId in update.Encounters.Values.Select(encounter => encounter.Enemy?.NpcId)
            .OfType<int>().Distinct())
        {
            Personagen? npc = idMesa.HasValue
                ? await _management.GetNpcAsync(npcId, idMesa, draft.IdSistemaVersao, cancellationToken)
                : await _management.GetNpcAsync(npcId, cancellationToken);
            if (npc is null || !npc.Visivel)
                return GameRunOperationResult<GameModeEditorDto>.Fail("NPC_INVISIVEL",
                    "Um personagem do jogo está oculto ou não está mais disponível para esta Mesa.");
        }
        error = await ValidateBaseRestsAsync(draft.IdSistemaVersao, update.Areas);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("DESCANSO_INVALIDO", error);
        error = await FreezeLootAsync(update.Encounters.Values, cancellationToken, idMesa, draft.IdSistemaVersao);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("LOOT_INVALIDO", error);
        error = await FreezeVendorOffersAsync(update.Areas, cancellationToken, idMesa, draft.IdSistemaVersao);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("OFERTA_INVALIDA", error);

        JsonObject config = JsonNode.Parse(draft.ConfiguracaoJson)?.AsObject()
            ?? throw new JsonException("A configuração do rascunho é inválida.");
        config["areas"] = JsonSerializer.SerializeToNode(update.Areas, JsonOptions);
        config["map"] ??= new JsonObject();
        config["map"]!["schemaVersion"] = 5;
        config["encounters"] = JsonSerializer.SerializeToNode(update.Encounters, JsonOptions);
        config["previewFallbackAction"] = JsonSerializer.SerializeToNode(update.FallbackAction, JsonOptions);
        config["previewPlayerDamageByResult"] = JsonSerializer.SerializeToNode(update.PlayerDamageByResult, JsonOptions);
        config["saleDiscountPercent"] = update.SaleDiscountPercent;
        config["startingCurrency"] = update.StartingCurrency;
        config["repairProtectionAtBase"] = update.RepairProtectionAtBase;
        if (update.PowerCatalog is not null)
            config["powerCatalog"] = JsonSerializer.SerializeToNode(update.PowerCatalog, JsonOptions);
        draft.ConfiguracaoJson = config.ToJsonString(JsonOptions);
        await _management.SaveAsync(cancellationToken);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, outcomes));
    }

    public async Task<GameRunOperationResult<GameModeEditorDto>> PublishAsync(
        int id, CancellationToken cancellationToken, int? idMesa = null)
    {
        GameModeVersion? draft = await _management.GetDraftByIdAsync(id, cancellationToken);
        if (draft is null || draft.IdMesa != idMesa) return DraftUnavailable();
        IReadOnlyList<string> outcomes = await _management.GetAttackOutcomeCodesAsync(draft.IdSistemaVersao, cancellationToken);
        GameModeEditorDto editor = Map(draft, outcomes);
        string? error = Validate(new GameModeEditorUpdateDto
        {
            Areas = editor.Areas, Encounters = editor.Encounters,
            FallbackAction = editor.FallbackAction, PlayerDamageByResult = editor.PlayerDamageByResult,
            SaleDiscountPercent = editor.SaleDiscountPercent,
            StartingCurrency = editor.StartingCurrency,
            RepairProtectionAtBase = editor.RepairProtectionAtBase,
            PowerCatalog = editor.PowerCatalog,
        }, outcomes);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("CONFIGURACAO_INVALIDA", error);
        SistemaVersao? systemVersion = await _systems.GetVersionAsync(
            draft.IdSistemaVersao, includeConfiguration: true);
        if (systemVersion is null)
            return GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INDISPONIVEL",
                "A versão publicada do Sistema não está disponível.");
        error = ValidateBaseRests(systemVersion, editor.Areas);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("DESCANSO_INVALIDO", error);
        if (editor.Encounters.Values.Any(encounter => encounter.LootCount > 0) &&
            Helpers.SistemaRpgConfiguration.LerRegras<Helpers.SistemaRpgConfiguration.RegrasProgressao>(
                systemVersion, SistemaModuloTipo.Progressao).DadoLootFaces is not (4 or 6 or 8 or 10 or 12 or 20))
            return GameRunOperationResult<GameModeEditorDto>.Fail("DADO_LOOT_NAO_CONFIGURADO",
                "Configure e publique o dado de loot em Sistema > Progressão antes de publicar encontros com loot.");
        error = await FreezeLootAsync(editor.Encounters.Values, cancellationToken, idMesa, draft.IdSistemaVersao);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("LOOT_INVALIDO", error);
        error = await FreezeVendorOffersAsync(editor.Areas, cancellationToken, idMesa, draft.IdSistemaVersao);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("OFERTA_INVALIDA", error);
        foreach (GameBattleEncounterConfig encounter in editor.Encounters.Values)
        {
            if (encounter.Enemy?.NpcId is not int npcId) continue;
            Personagen? npc = idMesa.HasValue
                ? await _management.GetNpcAsync(npcId, idMesa, draft.IdSistemaVersao, cancellationToken)
                : await _management.GetNpcAsync(npcId, cancellationToken);
            if (npc is null || !npc.Visivel)
                return GameRunOperationResult<GameModeEditorDto>.Fail("NPC_INDISPONIVEL", "Um NPC selecionado não está disponível para esta Mesa.");
            try { CopyNpcSnapshot(encounter.Enemy, npc); }
            catch (Exception exception) when (exception is JsonException or InvalidOperationException)
            {
                return GameRunOperationResult<GameModeEditorDto>.Fail("NPC_INVALIDO", exception.Message);
            }
            IReadOnlyList<GameModeNpcActionOptionDto> actions = ReadNpcActions(encounter.Enemy)
                .Select(action => DescribeNpcAction(npcId, encounter.Enemy, action,
                    systemVersion, outcomes)).ToArray();
            if (encounter.Enemy.Actions.Any(selected => !actions.Any(action =>
                action.Executable && action.Tipo == selected.Tipo &&
                action.IdInstancia == selected.IdInstancia)))
                return GameRunOperationResult<GameModeEditorDto>.Fail("ACAO_NPC_INVALIDA",
                    $"Uma ação de {encounter.Enemy.Name} não possui ataque D20 executável nesta versão do Sistema.");
        }
        error = Validate(new GameModeEditorUpdateDto
        {
            Areas = editor.Areas, Encounters = editor.Encounters,
            FallbackAction = editor.FallbackAction, PlayerDamageByResult = editor.PlayerDamageByResult,
            SaleDiscountPercent = editor.SaleDiscountPercent,
            StartingCurrency = editor.StartingCurrency,
            RepairProtectionAtBase = editor.RepairProtectionAtBase,
            PowerCatalog = editor.PowerCatalog,
        }, outcomes);
        if (error is not null) return GameRunOperationResult<GameModeEditorDto>.Fail("CONFIGURACAO_INVALIDA", error);
        JsonObject config = JsonNode.Parse(draft.ConfiguracaoJson)?.AsObject()
            ?? throw new JsonException("A configuração do rascunho é inválida.");
        config["encounters"] = JsonSerializer.SerializeToNode(editor.Encounters, JsonOptions);
        config["areas"] = JsonSerializer.SerializeToNode(editor.Areas, JsonOptions);
        config["map"] ??= new JsonObject();
        config["map"]!["schemaVersion"] = 5;
        draft.ConfiguracaoJson = config.ToJsonString(JsonOptions);
        draft.Status = GameModeVersionStatus.Publicado;
        draft.PublicadaEmUtc = DateTime.UtcNow;
        await _management.SaveAsync(cancellationToken);
        return GameRunOperationResult<GameModeEditorDto>.Ok(Map(draft, outcomes));
    }

    private async Task<string?> ValidateBaseRestsAsync(int systemVersionId, IReadOnlyList<GameModeAreaDto> areas)
    {
        SistemaVersao? version = await _systems.GetVersionAsync(systemVersionId, includeConfiguration: true);
        return version is null ? "A versão publicada do Sistema não está disponível." :
            ValidateBaseRests(version, areas);
    }

    private static string? ValidateBaseRests(SistemaVersao version, IReadOnlyList<GameModeAreaDto> areas)
    {
        foreach (GameModeAreaDto area in areas)
        {
            if (!area.UseBase || string.IsNullOrWhiteSpace(area.BaseRestType)) continue; // Versões antigas usam base.restType.
            SistemaDescansoConfig? rest = version.Descansos.FirstOrDefault(item =>
                string.Equals(item.Tipo, area.BaseRestType, StringComparison.OrdinalIgnoreCase));
            if (rest is null || rest.TipoRecuperacao == SistemaRecuperacaoTipo.Formula)
                return $"Escolha para a Base de {area.Name} um descanso executável da versão publicada do Sistema.";
        }
        return null;
    }

    private static void CopyNpcSnapshot(GameBattlePreviewEnemy enemy, Personagen npc)
    {
        JsonNode root = JsonNode.Parse(npc.StatusJson)
            ?? throw new JsonException("A ficha do NPC está vazia.");
        JsonNode sheet = root;
        string name = npc.Nome;
        if (!string.IsNullOrWhiteSpace(enemy.VariantId))
        {
            JsonNode? variant = (root["variantes"] as JsonArray)?.FirstOrDefault(item =>
                string.Equals(item?["id"]?.ToString(), enemy.VariantId, StringComparison.Ordinal));
            sheet = variant?["statusJson"] ?? throw new InvalidOperationException("A variante do NPC não existe mais.");
            name = $"{npc.Nome} · {variant["nome"]?.ToString()}";
        }
        JsonNode? resources = sheet["status"];
        int life = ReadNumber(resources, "vidaMaxima");
        if (life <= 0) life = ReadNumber(resources, "vida");
        if (life <= 0) throw new InvalidOperationException($"O NPC {name} precisa de vida válida.");
        var attributes = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (string group in new[] { "principais", "secundarios" })
            if (sheet["atributos"]?[group] is JsonObject values)
                foreach ((string code, JsonNode? value) in values)
                    if (int.TryParse(value?.ToString(), out int number)) attributes[code] = number;
        if (!string.IsNullOrWhiteSpace(enemy.AttackAttributeCode) &&
            !attributes.ContainsKey(enemy.AttackAttributeCode))
            throw new InvalidOperationException($"O NPC {name} não possui o atributo de ataque selecionado.");
        enemy.Name = name;
        enemy.Image = npc.Imagem;
        enemy.MaxVida = life;
        enemy.MaxMana = Math.Max(0, Math.Max(ReadNumber(resources, "manaMaxima"),
            ReadNumber(resources, "mana")));
        enemy.MaxEstamina = Math.Max(0, Math.Max(ReadNumber(resources, "estaminaMaxima"),
            ReadNumber(resources, "estamina")));
        enemy.Defesa = Math.Max(0, ReadNumber(sheet["defesas"], "armadura"));
        enemy.Attributes = attributes;
        enemy.StatusJson = sheet.ToJsonString(JsonOptions);
        JsonNode? variantNode = string.IsNullOrWhiteSpace(enemy.VariantId) ? null :
            (root["variantes"] as JsonArray)?.FirstOrDefault(item =>
                string.Equals(item?["id"]?.ToString(), enemy.VariantId, StringComparison.Ordinal));
        enemy.InventarioJson = variantNode?["inventarioJson"]?.ToJsonString(JsonOptions) ?? npc.InventarioJson;
        enemy.ImplantesJson = npc.Implantes;
        enemy.SkillsJson = variantNode?["skills"]?.ToJsonString(JsonOptions) ?? npc.Skills;
        enemy.MagiaJson = variantNode?["magia"]?.ToJsonString(JsonOptions) ?? npc.Magia;
        if (enemy.CustoManaAtaque > enemy.MaxMana ||
            enemy.CustoEstaminaAtaque > enemy.MaxEstamina)
            throw new InvalidOperationException($"O ataque de {name} custa mais recursos do que sua ficha possui.");
    }

    private static int ReadNumber(JsonNode? source, string key) =>
        int.TryParse(source?[key]?.ToString(), out int value) ? value : 0;

    private static IReadOnlyList<GameModeNpcActionOptionDto> ReadNpcActions(GameBattlePreviewEnemy enemy)
    {
        var actions = new List<GameModeNpcActionOptionDto>();
        Add("ITEM", enemy.InventarioJson);
        Add("PROTESE", enemy.ImplantesJson);
        Add("MAGIA", enemy.MagiaJson);
        Add("SKILL", enemy.SkillsJson);
        return actions;

        void Add(string type, string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return;
            JsonNode? value = JsonNode.Parse(json);
            JsonArray? entries = value as JsonArray ?? value?["itens"] as JsonArray ??
                value?["implantes"] as JsonArray ?? value?["skills"] as JsonArray ??
                value?["magias"] as JsonArray;
            if (entries is null) return;
            foreach (JsonNode? entry in entries)
            {
                if (entry is not JsonObject item) continue;
                string? id = item["id"]?.ToString();
                string? name = item["nome"]?.ToString();
                if (!string.IsNullOrWhiteSpace(id) && !string.IsNullOrWhiteSpace(name))
                    actions.Add(new GameModeNpcActionOptionDto(type, id, name,
                        item["imagem"]?.ToString())
                    {
                        DeclaredRoll = item["atributos"] is JsonObject attributes
                            ? attributes["acerto"]?.ToString() ?? item["acerto"]?.ToString()
                            : item["acerto"]?.ToString(),
                    });
            }
        }
    }

    private GameModeNpcActionOptionDto DescribeNpcAction(int npcId, GameBattlePreviewEnemy enemy,
        GameModeNpcActionOptionDto action, SistemaVersao? version, IReadOnlyList<string> outcomes)
    {
        if (version is null) return action with
        {
            UnavailableReason = "Selecione uma versão publicada do Sistema para validar esta ação.",
        };
        var character = new PersonagemJogador
        {
            IdpersonagemJogador = npcId, Nome = enemy.Name,
            StatusJson = enemy.StatusJson ?? "{}", InventarioJson = enemy.InventarioJson,
            Implantes = enemy.ImplantesJson, Skills = enemy.SkillsJson, Magia = enemy.MagiaJson,
        };
        string?[] ranges = action.Tipo is "ITEM" or "PROTESE"
            ? ["CURTA", "MEDIA", "LONGA", null] : [null];
        string? unavailableReason = null;
        foreach (string? range in ranges)
        {
            var request = new GameplayRollRequestDto
            {
                CodigoAcao = "ACAO_FICHA", IdPersonagemJogador = npcId,
                Modo = GameplayRollMode.Normal,
                ReferenciaAcao = new GameplayActionReferenceDto
                {
                    Tipo = action.Tipo, IdInstancia = action.IdInstancia,
                },
                ParametrosAcao = new GameplayActionParametersDto
                {
                    Operacao = "ATACAR", Alcance = range,
                    ModoDisparo = range is null ? null : "TIRO", Quantidade = 1,
                },
            };
            var result = _actionResolver.Resolve(request, character, version);
            if (!result.Sucesso || result.Dados is not { } resolved)
            {
                unavailableReason ??= result.Codigo == "PODER_SEM_TESTE" &&
                    !string.IsNullOrWhiteSpace(action.DeclaredRoll)
                    ? $"O acerto {action.DeclaredRoll} não tem uma regra de ataque executável nesta versão do Sistema. O combate automático exige D20."
                    : result.Mensagem ?? "Não foi possível resolver o teste desta ação.";
                continue;
            }
            if (resolved.Groups.Count != 1 || resolved.Groups[0] != new GameplayDiceGroupSpec(1, 20))
            {
                unavailableReason ??= "O combate automático desta versão aceita apenas ataques com um D20.";
                continue;
            }
            if (resolved.Ranges.Count == 0 || resolved.Ranges.Any(rangeResult =>
                !outcomes.Contains(rangeResult.Code, StringComparer.OrdinalIgnoreCase)))
            {
                unavailableReason ??= "O teste desta ação não usa as faixas de ataque publicadas no Sistema.";
                continue;
            }
            var values = resolved.Snapshot.Valores;
            string damageKey = action.Tipo is "ITEM" or "PROTESE"
                ? "danoPorAcertoProposto" : "danoProposto";
            int damage = ReadActionValue(values, damageKey);
            bool hasCondition = values.TryGetValue("condicoesPropostasJson", out string? conditionsJson) &&
                !string.IsNullOrWhiteSpace(conditionsJson) && conditionsJson != "[]";
            bool removesCondition = values.TryGetValue("condicoesRemovidasPorMagiaJson", out string? removalsJson) &&
                !string.IsNullOrWhiteSpace(removalsJson) && removalsJson != "[]";
            if (damage <= 0 && !hasCondition && !removesCondition)
            {
                unavailableReason ??= "Esta ação precisa de dano ou condição executável na ficha.";
                continue;
            }
            return action with
            {
                Executable = true, Damage = damage, UnavailableReason = null,
                ManaCost = ReadActionValue(values, "custoManaProposto"),
                StaminaCost = ReadActionValue(values, "estaminaPorUsoProposta", "custoEstaminaProposto"),
                CooldownTurns = ReadActionValue(values, "cooldownTurnosProposto"),
                AmmoPerUse = ReadActionValue(values, "consumoMunicaoProposto"),
            };
        }
        return action with { UnavailableReason = unavailableReason ??
            "Esta ação não possui um ataque executável nesta versão do Sistema." };
    }

    private static int ReadActionValue(IReadOnlyDictionary<string, string> values, params string[] keys)
    {
        foreach (string key in keys)
            if (values.TryGetValue(key, out string? text) &&
                int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int number))
                return Math.Max(0, number);
        return 0;
    }

    private static string? Validate(GameModeEditorUpdateDto update, IReadOnlyList<string> outcomes)
    {
        if (outcomes.Count == 0 || outcomes.Any(string.IsNullOrWhiteSpace))
            return "O combate automático precisa de ATAQUE_COMUM em 1D20 na versão publicada do Sistema.";
        if (update.PlayerDamageByResult is null || outcomes.Any(code =>
                !update.PlayerDamageByResult.TryGetValue(code, out GameBattleDamageModifier? modifier) ||
                modifier is null || modifier.Multiplier < 0 || modifier.Bonus < 0))
            return "Configure o dano do personagem para cada resultado de ATAQUE_COMUM do Sistema.";
        if (update.SaleDiscountPercent is < 0 or > 100)
            return "O desconto de venda deve ser um percentual inteiro entre 0 e 100.";
        if (update.StartingCurrency is < 0 or > 1000000000)
            return "A moeda inicial deve ficar entre 0 e 1.000.000.000.";
        if (update.PowerCatalog is { } powers &&
            (powers.Count > 40 || powers.Any(power => power is null ||
                !Guid.TryParse(power.Id, out _) ||
                power.Type is not ("SKILL" or "ULTIMATE") ||
                string.IsNullOrWhiteSpace(power.Name) || power.Name.Length > 100 ||
                power.Description?.Length > 2000 || power.Image?.Length > 500 ||
                power.Requirements?.Length > 500 || power.MinLevel is < 1 or > 1000) ||
             powers.Select(power => power.Id).Distinct(StringComparer.OrdinalIgnoreCase).Count() != powers.Count))
            return "Cadastre até 40 skills e ultimates com identificadores únicos, nome e nível mínimo válidos.";
        if (update.Areas is null || update.Areas.Count is < 1 or > 9 ||
            update.Encounters is null || update.Encounters.Count is < 1 or > 80)
            return "Configure áreas e ao menos um encontro.";
        if (update.Areas.Count(area => !area.IsSecret) is < 1 or > GameRunMapGenerator.MaxNormalAreas ||
            update.Areas.Count(area => area.IsSecret) > 4)
            return "Configure de uma a cinco áreas normais e até quatro áreas secretas.";
        if (update.FallbackAction is null || string.IsNullOrWhiteSpace(update.FallbackAction.Name) ||
            update.FallbackAction.BaseDamage < 1 || update.FallbackAction.AttributeCode?.Length > 80)
            return "Configure o ataque de reserva e seu dano.";
        if (update.Areas.Any(area => string.IsNullOrWhiteSpace(area.Code) || area.Code.Length > 40 ||
            string.IsNullOrWhiteSpace(area.Name) || area.Name.Length > 100 ||
            area.Image?.Length > 500 || area.BaseImage?.Length > 500 ||
            (area.UseBase && string.IsNullOrWhiteSpace(area.BaseName)) || area.BaseName.Length > 100 ||
            area.Options.Count is < 1 or > 20) ||
            update.Areas.Select(area => area.Code).Distinct(StringComparer.OrdinalIgnoreCase).Count() != update.Areas.Count)
            return "Cada área precisa de nome, Base e ao menos uma rota (máximo 20 no pool).";
        if (update.Areas.Any(area => area.NodeCount is < GameRunMapGenerator.MinNodesPerArea or > GameRunMapGenerator.MaxNodesPerArea))
            return $"Cada área precisa ter de {GameRunMapGenerator.MinNodesPerArea} a {GameRunMapGenerator.MaxNodesPerArea} nós jogáveis.";
        if (update.Areas.Any(area => area.IsSecretFinal && !area.IsSecret))
            return "Somente áreas secretas podem ser finais alternativos.";
        Dictionary<string, GameModeAreaDto> secretAreas = update.Areas.Where(area => area.IsSecret)
            .ToDictionary(area => area.Code, StringComparer.OrdinalIgnoreCase);
        var visiting = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        bool HasSecretCycle(string code)
        {
            if (visiting.Contains(code)) return true;
            if (!visited.Add(code)) return false;
            visiting.Add(code);
            foreach (GameModeAreaOptionDto option in secretAreas[code].Options.Where(option => option.Type == "AREA_SECRETA"))
                if (option.SecretAreaCode is { } target && secretAreas.ContainsKey(target) && HasSecretCycle(target))
                    return true;
            visiting.Remove(code);
            return false;
        }
        if (secretAreas.Keys.Any(HasSecretCycle))
            return "Passagens secretas não podem formar um ciclo de áreas.";
        foreach (GameModeAreaDto area in update.Areas)
        {
            GameModeAreaOptionDto[] repeatable = area.Options.Where(option => !option.Unique).ToArray();
            if (repeatable.Length == 0 &&
                area.Options.Count + (area.UseBase ? 1 : 0) < area.NodeCount)
                return $"Para preencher {area.NodeCount} nós em {area.Name}, deixe uma rota repetível fora do fim ou cadastre {area.NodeCount - 1} rotas únicas.";
        }
        foreach (GameModeAreaDto area in update.Areas)
        {
            string finalOption = area.FinalOption ?? string.Empty;
            if ((finalOption == "BASE" && !area.UseBase) ||
                (finalOption is not ("BASE" or "ALEATORIO") &&
                (!finalOption.StartsWith("ROTA:", StringComparison.Ordinal) ||
                 !int.TryParse(finalOption.AsSpan(5), out int finalIndex) ||
                 finalIndex < 0 || finalIndex >= area.Options.Count)))
                return $"Escolha um fim válido para {area.Name}.";
            string? routeError = GameModeRouteValidation.Validate(area, update.Encounters.Keys, update.Areas);
            if (routeError is not null) return routeError;
        }
        foreach ((string code, GameBattleEncounterConfig encounter) in update.Encounters)
        {
            if (string.IsNullOrWhiteSpace(code) || code.Length > 50 ||
                string.IsNullOrWhiteSpace(encounter.MapName) || encounter.MapName.Length > 100 ||
                encounter.XpReward is < 0 or > 1000000 ||
                encounter.CurrencyReward is < 0 or > 1000000000 ||
                encounter.LootCount is < 0 or > 100 || encounter.Loot is null || encounter.Loot.Any(entry => entry is null) ||
                encounter.Enemy is null || string.IsNullOrWhiteSpace(encounter.Enemy.Name) ||
                encounter.Enemy.Image?.Length > 500 ||
                encounter.Enemy.MaxVida < 1 || encounter.Enemy.Defesa < 0 ||
                encounter.Enemy.MaxMana < 0 || encounter.Enemy.MaxEstamina < 0 ||
                encounter.Enemy.CustoManaAtaque < 0 || encounter.Enemy.CustoEstaminaAtaque < 0 ||
                encounter.Enemy.Quantity is < 1 or > 4 ||
                encounter.Enemy.Actions is null or { Count: > 3 } ||
                (encounter.Enemy.NpcId is not null && encounter.Enemy.Actions.Count == 0) ||
                (encounter.Enemy.NpcId is not null && encounter.Enemy.StatusJson is not null &&
                    encounter.Enemy.Actions.Any(action => !ReadNpcActions(encounter.Enemy).Any(option =>
                        option.Tipo == action.Tipo && option.IdInstancia == action.IdInstancia))) ||
                (encounter.Enemy.NpcId is null &&
                    (encounter.Enemy.CustoManaAtaque > encounter.Enemy.MaxMana ||
                     encounter.Enemy.CustoEstaminaAtaque > encounter.Enemy.MaxEstamina)) ||
                encounter.Enemy.Attributes is null ||
                (encounter.Enemy.NpcId is null &&
                    !string.IsNullOrWhiteSpace(encounter.Enemy.AttackAttributeCode) &&
                    !encounter.Enemy.Attributes.Keys.Contains(encounter.Enemy.AttackAttributeCode,
                        StringComparer.OrdinalIgnoreCase)) ||
                (encounter.Enemy.NpcId is null && (encounter.DamageByResult is null ||
                    outcomes.Any(outcome => !encounter.DamageByResult.ContainsKey(outcome)))) ||
                encounter.DamageByResult?.Any(pair => pair.Value < 0) == true)
                return $"O encontro {code} está incompleto.";
        }
        return null;
    }

    private static GameModeEditorDto Map(GameModeVersion mode, IReadOnlyList<string> outcomes)
    {
        using JsonDocument document = JsonDocument.Parse(mode.ConfiguracaoJson);
        JsonElement root = document.RootElement;
        List<GameModeAreaDto> areas = root.TryGetProperty("areas", out JsonElement areasJson)
            ? areasJson.Deserialize<List<GameModeAreaDto>>(JsonOptions) ?? [] : [];
        int mapSchema = root.TryGetProperty("map", out JsonElement map) &&
            map.TryGetProperty("schemaVersion", out JsonElement schemaVersion) &&
            schemaVersion.TryGetInt32(out int parsedSchema) ? parsedSchema : 0;
        if (mapSchema < 5 && areas.Count > 0 && areas[^1].Options.Count > 0 &&
            areas[^1].Options.All(option => option.Type == "BOSS"))
            areas[^1].FinalOption = "ROTA:0";
        Dictionary<string, GameBattleEncounterConfig> encounters = root.TryGetProperty("encounters", out JsonElement encountersJson)
            ? encountersJson.Deserialize<Dictionary<string, GameBattleEncounterConfig>>(JsonOptions) ?? [] : [];
        return new GameModeEditorDto
        {
            CodigoJogo = mode.Codigo,
            IdMesa = mode.IdMesa,
            NomeJogo = mode.Nome ?? "Odisseia",
            DescricaoJogo = mode.Descricao,
            BannerJogo = mode.Banner,
            IdSistemaVersao = mode.IdSistemaVersao,
            IdGameModeVersion = mode.IdGameModeVersion,
            MapSchemaVersion = mapSchema,
            NumeroVersao = mode.NumeroVersao,
            Status = mode.Status.ToString(),
            Areas = areas,
            Encounters = encounters,
            AttackOutcomeCodes = outcomes,
            SaleDiscountPercent = root.TryGetProperty("saleDiscountPercent", out JsonElement saleDiscount) &&
                saleDiscount.TryGetInt32(out int discount) ? discount : 0,
            StartingCurrency = root.TryGetProperty("startingCurrency", out JsonElement startingCurrency) &&
                startingCurrency.TryGetInt32(out int currency) ? currency : 0,
            RepairProtectionAtBase = !root.TryGetProperty("repairProtectionAtBase", out JsonElement repairProtection) ||
                repairProtection.ValueKind != JsonValueKind.False,
            PowerCatalog = root.TryGetProperty("powerCatalog", out JsonElement catalog) &&
                catalog.ValueKind == JsonValueKind.Array
                    ? catalog.Deserialize<List<GameModePowerOptionDto>>(JsonOptions) ?? [] : [],
            PlayerDamageByResult = root.TryGetProperty("previewPlayerDamageByResult", out JsonElement damage)
                ? damage.Deserialize<Dictionary<string, GameBattleDamageModifier>>(JsonOptions) ?? [] : [],
            FallbackAction = root.TryGetProperty("previewFallbackAction", out JsonElement fallback)
                ? fallback.Deserialize<GameBattleFallbackAction>(JsonOptions) ?? new() : new(),
        };
    }

    private static GameRunOperationResult<GameModeEditorDto> MissingSystem() =>
        GameRunOperationResult<GameModeEditorDto>.Fail("SISTEMA_INDISPONIVEL", "Publique uma versão do Sistema Odisseia antes de editar o jogo.");
    private static GameRunOperationResult<GameModeEditorDto> MissingMode() =>
        GameRunOperationResult<GameModeEditorDto>.Fail("MODO_INDISPONIVEL", "Esta versão do Sistema não possui modo roguelike compatível.");
    private static GameRunOperationResult<GameModeEditorDto> DraftUnavailable() =>
        GameRunOperationResult<GameModeEditorDto>.Fail("RASCUNHO_INDISPONIVEL", "O rascunho não está disponível para edição.");
}
