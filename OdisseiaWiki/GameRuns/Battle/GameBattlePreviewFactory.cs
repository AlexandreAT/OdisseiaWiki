using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns.Battle;

/// <summary>
/// Builds the first playable battle preview from a saved run and its pinned rules.
/// No state from the original character is read after the run has been created.
/// </summary>
public sealed class GameBattlePreviewFactory
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly GameplayActionResolver _actionResolver;

    public GameBattlePreviewFactory(GameplayActionResolver actionResolver)
    {
        _actionResolver = actionResolver;
    }

    // Catalog validation goes through exactly the action builder used by combat.
    public void ValidateLearnableSpell(JsonObject spell, SistemaVersao version)
    {
        var copy = spell.DeepClone().AsObject();
        copy["id"] = "catalog-validation";
        // A catalog has no player sheet. Populate published attributes only to validate
        // the test contract; the actual character's values are resolved when equipped.
        var attributes = new JsonObject { ["principais"] = new JsonObject(), ["secundarios"] = new JsonObject() };
        foreach (var attribute in version.Atributos.Where(attribute => attribute.Ativo))
        {
            string group = attribute.Grupo == SistemaAtributoGrupo.Secundario ? "secundarios" : "principais";
            attributes[group]![attribute.CodigoAtributo] = 0;
        }
        var root = new JsonObject { ["idSistemaVersao"] = version.IdSistemaVersao,
            ["nome"] = "Catálogo", ["status"] = new JsonObject { ["status"] = new JsonObject {
                ["vida"] = 1000000, ["mana"] = 1000000, ["estamina"] = 1000000 }, ["atributos"] = attributes },
            ["inventario"] = new JsonArray(), ["magia"] = new JsonArray(copy) };
        var snapshot = root.Deserialize<GameRunCharacterSnapshotDto>(JsonOptions)!;
        var config = new GameBattlePreviewConfig { PreviewPlayerDamageByResult = version.ResultadosDado
            .Where(row => row.CodigoTeste.Equals("ATAQUE_COMUM", StringComparison.OrdinalIgnoreCase))
            .Select(row => row.CodigoResultado).Distinct().ToDictionary(code => code, _ => new GameBattleDamageModifier()) };
        var errors = new List<string>();
        if (BuildSelectedActions(snapshot, [new() { Tipo = "MAGIA", IdInstancia = "catalog-validation" }],
            version, config, [], errors).Count != 1)
            throw new InvalidOperationException(errors.FirstOrDefault() ??
                "Configure dano, recuperação ou uma condição executável. Para efeitos sem teste, use o gatilho Ao usar.");
    }

    public bool CanExecuteSelectedAction(GameRunDto run, SistemaVersao version, GameRunActionSelectionDto selection)
    {
        var config = run.ConfiguracaoModo.Deserialize<GameBattlePreviewConfig>(JsonOptions)
            ?? throw new InvalidOperationException("O modo de jogo não possui regras de ataque configuradas.");
        if (config.PreviewPlayerDamageByResult is null)
            throw new InvalidOperationException("O modo de jogo não possui o dano por resultado configurado.");
        return BuildSelectedActions(run.EstadoAtual, [selection], version, config, []).Any(action =>
            action.Id == $"{selection.Tipo.ToLowerInvariant()}:{selection.IdInstancia}");
    }

    public GameBattlePreviewSetup Build(GameRunDto run, SistemaVersao version, string? encounterCode = null,
        GameBattleEncounterConfig? trainingEncounter = null)
    {
        if (run.IdSistemaVersao != version.IdSistemaVersao ||
            run.EstadoAtual.IdSistemaVersao != version.IdSistemaVersao)
            throw new InvalidOperationException("A versão da run não corresponde às regras carregadas.");

        GameBattlePreviewConfig? config = run.ConfiguracaoModo.Deserialize<GameBattlePreviewConfig>(JsonOptions);
        if (config is null || config.SchemaVersion != 1 || config.PreviewEnemy is null ||
            config.PreviewFallbackAction is null || config.PreviewDamageByResult is null ||
            config.PreviewPlayerDamageByResult is null)
            throw new InvalidOperationException("O modo de jogo não possui uma prévia de combate configurada.");

        GameBattlePreviewEnemy enemyConfig = config.PreviewEnemy;
        IReadOnlyDictionary<string, int> enemyDamageConfig = config.PreviewDamageByResult;
        if (trainingEncounter is not null)
        {
            enemyConfig = trainingEncounter.Enemy ?? throw new InvalidOperationException("O treino não tem oponente.");
            enemyDamageConfig = trainingEncounter.DamageByResult ?? throw new InvalidOperationException("O treino não tem dano configurado.");
        }
        else if (encounterCode is not null)
        {
            if (config.Encounters is null || !config.Encounters.TryGetValue(encounterCode, out GameBattleEncounterConfig? encounter) ||
                encounter.Enemy is null || encounter.DamageByResult is null)
                throw new InvalidOperationException("O encontro não está configurado na versão fixada do modo.");
            enemyConfig = encounter.Enemy;
            enemyDamageConfig = encounter.DamageByResult;
        }

        if (enemyConfig.NpcId is not null && !string.IsNullOrWhiteSpace(enemyConfig.ImplantesJson) &&
            !string.IsNullOrWhiteSpace(enemyConfig.StatusJson))
        {
            enemyConfig = JsonSerializer.SerializeToElement(enemyConfig, JsonOptions).Deserialize<GameBattlePreviewEnemy>(JsonOptions)!;
            var npcRoot = new JsonObject { ["status"] = JsonNode.Parse(enemyConfig.StatusJson!),
                ["inventario"] = JsonNode.Parse(enemyConfig.InventarioJson ?? "[]"),
                ["implantes"] = JsonNode.Parse(enemyConfig.ImplantesJson!) };
            string prepared = npcRoot.ToJsonString();
            foreach (var action in enemyConfig.Actions.Where(action => action.Tipo == "PROTESE"))
                prepared = GameRunDefensiveEquipment.SetEquipped(prepared, action.IdInstancia, true);
            npcRoot = JsonNode.Parse(GameRunCarry.Reconcile(prepared, version))!.AsObject();
            enemyConfig.StatusJson = npcRoot["status"]!.ToJsonString();
            enemyConfig.ImplantesJson = npcRoot["implantes"]!.ToJsonString();
            enemyConfig.MaxVida = (int?)npcRoot["status"]?["status"]?["vidaMaxima"] ?? enemyConfig.MaxVida;
            enemyConfig.MaxMana = (int?)npcRoot["status"]?["status"]?["manaMaxima"] ?? enemyConfig.MaxMana;
            enemyConfig.MaxEstamina = (int?)npcRoot["status"]?["status"]?["estaminaMaxima"] ?? enemyConfig.MaxEstamina;
            enemyConfig.Attributes = ReadAttributes(ParseSnapshot(enemyConfig.StatusJson), enemyConfig.Attributes).ToDictionary();
        }

        SistemaResultadoDado[] rows = version.ResultadosDado
            .Where(row => string.Equals(row.CodigoTeste, "ATAQUE_COMUM", StringComparison.OrdinalIgnoreCase))
            .OrderBy(row => row.Ordem)
            .ToArray();
        if (rows.Length == 0 || rows.Any(row => row.QuantidadeDados != 1 ||
            !string.Equals(row.Dado, "D20", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("A versão do Sistema não possui ATAQUE_COMUM em 1D20.");

        GameplayResolvedResultRange[] ranges = rows.Select(row => new GameplayResolvedResultRange(
            row.CodigoResultado,
            row.NomeResultado,
            row.ResultadoMinimo,
            row.ResultadoMaximo,
            row.ExigeNatural || GameplayActionResolver.IsNaturalOnlyOutcome(row.CodigoResultado),
            row.CodigoResultado == "CRITICO",
            row.CodigoResultado == "FALHA_CRITICA",
            row.EfeitoJson)).ToArray();

        JsonElement? status = Property(run.EstadoAtual.Status, "status");
        IReadOnlyList<GameBattleActiveCondition> playerConditions = ReadActiveConditions(run.EstadoAtual, version);
        int hitPoints = ReadInt(status, "vida") ?? 0;
        int maximumHitPoints = ReadInt(Property(run.EstadoAtual.LimitesCondicoes, "vida"), "base") ??
            Math.Max(hitPoints, ReadInt(status, "vidaMaxima") ?? hitPoints);
        if (hitPoints <= 0 || maximumHitPoints <= 0)
            throw new InvalidOperationException("A ficha desta run precisa ter vida acima de zero para a prévia.");

        int mana = Math.Max(0, ReadInt(status, "mana") ?? 0);
        int stamina = Math.Max(0, ReadInt(status, "estamina") ?? 0);
        int maximumMana = ReadInt(Property(run.EstadoAtual.LimitesCondicoes, "mana"), "base") ??
            Math.Max(mana, ReadInt(status, "manaMaxima") ?? mana);
        int maximumStamina = ReadInt(Property(run.EstadoAtual.LimitesCondicoes, "estamina"), "base") ??
            Math.Max(stamina, ReadInt(status, "estaminaMaxima") ?? stamina);
        JsonElement? defenses = Property(run.EstadoAtual.Status, "defesas");
        var playerDefenses = new GameBattleDefenses(
            Math.Max(0, ReadInt(defenses, "escudo") ?? 0),
            Math.Max(0, ReadInt(defenses, "protecao") ?? 0),
            Math.Max(0, ReadInt(defenses, "armadura") ?? 0));
        JsonElement? npcDefenses = !string.IsNullOrWhiteSpace(enemyConfig.StatusJson)
            ? Property(ParseSnapshot(enemyConfig.StatusJson), "defesas") : null;
        var enemyDefenses = npcDefenses is { } npcValues
            ? new GameBattleDefenses(
                Math.Max(0, ReadInt(npcValues, "escudo") ?? 0),
                Math.Max(0, ReadInt(npcValues, "protecao") ?? 0),
                Math.Max(0, ReadInt(npcValues, "armadura") ?? 0))
            : new GameBattleDefenses(Armor: Math.Max(0, enemyConfig.Defesa));
        GameBattleDefenses npcEquipment = GameRunDefensiveEquipment.Bonuses(
            ParseOptionalSnapshot(enemyConfig.InventarioJson));
        GameBattleDefenses npcProstheses = GameRunDefensiveEquipment.Bonuses(ParseOptionalSnapshot(enemyConfig.ImplantesJson));
        enemyDefenses = new GameBattleDefenses(
            (int)Math.Min(int.MaxValue, (long)enemyDefenses.Shield + npcEquipment.Shield + npcProstheses.Shield),
            (int)Math.Min(int.MaxValue, (long)enemyDefenses.Protection + npcEquipment.Protection + npcProstheses.Protection),
            (int)Math.Min(int.MaxValue, (long)enemyDefenses.Armor + npcEquipment.Armor + npcProstheses.Armor));
        IReadOnlyList<GameBattleDefenseKind> defenseOrder = ResolveDefenseOrder(version, playerDefenses, enemyDefenses);

        List<GameBattleActionSpec> playerActions = run.AcoesEquipadas is null
            ? BuildWeaponActions(run.EstadoAtual, run.OrdemArmas, version, config, ranges)
            : BuildSelectedActions(run.EstadoAtual, run.AcoesEquipadas, version, config, ranges);
        GameBattleRestSpec? playerRest = null;
        if (run.AcoesEquipadas is { } selectedActions)
        {
            int restPosition = selectedActions.ToList().FindIndex(selection =>
                selection.Tipo.Equals("DESCANSO", StringComparison.OrdinalIgnoreCase));
            if (restPosition >= 0)
            {
                SistemaDescansoConfig? rule = version.Descansos.FirstOrDefault(rest =>
                    rest.Tipo.Equals("SIMPLES", StringComparison.OrdinalIgnoreCase));
                if (rule is null || rule.ExigeGuarda || rule.TipoRecuperacao == SistemaRecuperacaoTipo.Formula)
                    throw new InvalidOperationException("Esta versão do Sistema não possui descanso curto automático.");
                playerRest = new GameBattleRestSpec(restPosition, rule.RecuperacaoVida,
                    rule.RecuperacaoMana, rule.RecuperacaoEstamina,
                    rule.TipoRecuperacao == SistemaRecuperacaoTipo.Percentual);
            }
        }
        int fallbackDamage = config.PreviewFallbackAction.BaseDamage;
        if (fallbackDamage <= 0)
            throw new InvalidOperationException("O ataque de treino do modo não possui dano válido.");
        int fallbackModifier = ReadAttribute(run.EstadoAtual.Status,
            config.PreviewFallbackAction.AttributeCode);
        playerActions.Add(new GameBattleActionSpec(
            "treino-basico",
            config.PreviewFallbackAction.Name,
            new GameplayRollPlan("1D20", [new GameplayDiceGroupSpec(1, 20)], GameplayRollMode.Normal,
                fallbackModifier),
            ranges,
            config.PreviewUseTotalForRanges,
            ResolvePlayerDamage(ranges, fallbackDamage, config.PreviewPlayerDamageByResult)) { IsFallback = true });

        if (enemyConfig.MaxVida <= 0 || enemyConfig.Defesa < 0 ||
            enemyConfig.MaxMana < 0 || enemyConfig.MaxEstamina < 0 ||
            enemyConfig.CustoManaAtaque < 0 || enemyConfig.CustoManaAtaque > enemyConfig.MaxMana ||
            enemyConfig.CustoEstaminaAtaque < 0 || enemyConfig.CustoEstaminaAtaque > enemyConfig.MaxEstamina ||
            string.IsNullOrWhiteSpace(enemyConfig.Name))
            throw new InvalidOperationException("O oponente de treino do modo está incompleto.");
        var enemyActions = new List<GameBattleActionSpec>();
        if (enemyConfig.NpcId is not null && enemyConfig.Actions.Count > 0)
        {
            if (string.IsNullOrWhiteSpace(enemyConfig.StatusJson))
                throw new InvalidOperationException("O NPC não possui snapshot de ficha na versão do jogo.");
            GameRunCharacterSnapshotDto npcSnapshot = new()
            {
                IdPersonagemJogadorOrigem = -enemyConfig.NpcId.Value,
                Nome = enemyConfig.Name,
                Imagem = enemyConfig.Image,
                IdSistemaVersao = version.IdSistemaVersao,
                Status = ParseSnapshot(enemyConfig.StatusJson),
                Inventario = ParseOptionalSnapshot(enemyConfig.InventarioJson),
                Implantes = ParseOptionalSnapshot(enemyConfig.ImplantesJson),
                Skills = ParseOptionalSnapshot(enemyConfig.SkillsJson),
                Magia = ParseOptionalSnapshot(enemyConfig.MagiaJson),
            };
            enemyActions.AddRange(BuildSelectedActions(npcSnapshot, enemyConfig.Actions,
                version, config, ranges));
            if (enemyActions.Count != enemyConfig.Actions.Count)
                throw new InvalidOperationException("Uma ação equipada do NPC não tem teste D20 e dano executáveis nesta versão.");
        }
        else
        {
            Dictionary<string, int> enemyDamage = new(StringComparer.OrdinalIgnoreCase);
            foreach (GameplayResolvedResultRange range in ranges)
            {
                if (!enemyDamageConfig.TryGetValue(range.Code, out int damage) || damage < 0)
                    throw new InvalidOperationException($"O modo não define o dano de {range.Code} para o oponente.");
                enemyDamage[range.Code] = damage;
            }
            int enemyModifier = string.IsNullOrWhiteSpace(enemyConfig.AttackAttributeCode) ? 0 :
                enemyConfig.Attributes.FirstOrDefault(pair => string.Equals(pair.Key,
                    enemyConfig.AttackAttributeCode, StringComparison.OrdinalIgnoreCase)).Value;
            enemyActions.Add(new GameBattleActionSpec(
                "enemy-attack", $"Ataque de {enemyConfig.Name}",
                new GameplayRollPlan("1D20", [new GameplayDiceGroupSpec(1, 20)], GameplayRollMode.Normal,
                    enemyModifier),
                ranges, config.PreviewUseTotalForRanges, enemyDamage,
                ManaCost: enemyConfig.CustoManaAtaque,
                StaminaCost: enemyConfig.CustoEstaminaAtaque)
            { AttributeCode = enemyConfig.AttackAttributeCode });
        }

        var player = new GameBattleActorSpec(
            "player",
            run.EstadoAtual.Nome,
            hitPoints,
            maximumHitPoints,
            mana,
            maximumMana,
            stamina,
            maximumStamina,
            playerDefenses,
            playerActions,
            run.EstadoAtual.Imagem) { Rest = playerRest,
                Attributes = ReadAttributes(run.EstadoAtual.Status),
                TurnsToSkip = Math.Clamp(ReadInt(run.EstadoAtual.Status, "turnosPerdidos") ?? 0, 0, 100),
                ActiveConditions = playerConditions };
        JsonElement enemyStatus = string.IsNullOrWhiteSpace(enemyConfig.StatusJson)
            ? default : ParseSnapshot(enemyConfig.StatusJson);
        var enemy = new GameBattleActorSpec(
            "enemy",
            enemyConfig.Name,
            enemyConfig.MaxVida,
            enemyConfig.MaxVida,
            enemyConfig.MaxMana,
            enemyConfig.MaxMana,
            enemyConfig.MaxEstamina,
            enemyConfig.MaxEstamina,
            enemyDefenses,
            enemyActions,
            enemyConfig.Image) { Attributes = ReadAttributes(enemyStatus, enemyConfig.Attributes) };

        int enemyCount = Math.Clamp(enemyConfig.Quantity, 1, 4);
        if (enemyCount > 1) enemy = enemy with { Name = $"{enemyConfig.Name} 1" };
        var additionalEnemies = Enumerable.Range(2, enemyCount - 1)
            .Select(index => enemy with { Id = $"enemy-{index}", Name = $"{enemyConfig.Name} {index}" })
            .ToArray();
        var combatRules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCombate>(
            version, SistemaModuloTipo.Combate);
        bool useInitiative = combatRules.UsaIniciativa &&
            !string.IsNullOrWhiteSpace(combatRules.FormulaIniciativa);
        if (useInitiative)
        {
            string formula = combatRules.FormulaIniciativa!;
            player = player with { Initiative = Initiative(formula, run.EstadoAtual.Status) };
            enemy = enemy with { Initiative = Initiative(formula, enemyStatus, enemyConfig.Attributes) };
            additionalEnemies = additionalEnemies.Select(actor => actor with
                { Initiative = Initiative(formula, enemyStatus, enemyConfig.Attributes) }).ToArray();
        }
        return new GameBattlePreviewSetup(
            new GameBattleInput(player, enemy, defenseOrder)
            { AdditionalEnemies = additionalEnemies, UseInitiative = useInitiative,
              AutomaticConditions = version.Condicoes.Where(rule =>
                  rule.ValorGatilho.HasValue &&
                  rule.CodigoRecursoGatilho is "VIDA" or "MANA" or "ESTAMINA" &&
                  SistemaCondicaoEfeitos.Read(rule).Count > 0)
                .Select(rule => new GameBattleAutomaticCondition(
                    new GameBattleConditionRule(rule.Codigo, rule.Nome,
                        rule.OperacaoEfeito ?? "", rule.CodigoRecurso ?? "",
                        (int)(rule.ValorPadrao ?? rule.ValorEfeito ?? 0),
                        rule.MomentoEfeito ?? "", rule.Empilhavel,
                        rule.PermiteSobrescrever, rule.RegraRemocao ?? "MANUAL")
                    { Effects = SistemaCondicaoEfeitos.Read(rule), Image = SistemaCondicaoEfeitos.Image(rule) },
                    rule.CodigoRecursoGatilho!, rule.OperadorGatilho ?? "==",
                    rule.ValorGatilho!.Value, rule.DuracaoPadrao,
                    rule.UnidadeDuracao.ToString())).ToArray() },
            playerActions.Take(playerActions.Count - 1).Select(action => action.Name).ToArray(),
            config.PreviewFallbackAction.Name);
    }

    private static JsonElement ParseSnapshot(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private static GameBattleInitiativeSpec Initiative(string formula, JsonElement status,
        IReadOnlyDictionary<string, int>? fallbackAttributes = null)
    {
        Match dice = Regex.Match(formula,
            @"^\s*(?<quantity>\d*)\s*[dD]\s*(?<faces>\d+)(?<terms>(?:\s*[+-]\s*(?:[\p{L}_][\p{L}\p{N}_]*|\d+))*)\s*$",
            RegexOptions.CultureInvariant);
        int quantity = dice.Groups["quantity"].Length == 0 ? 1 :
            int.TryParse(dice.Groups["quantity"].Value, out int parsed) ? parsed : 0;
        if (!dice.Success || !int.TryParse(dice.Groups["faces"].Value, out int faces) ||
            quantity is < 1 or > 100 || faces is < 2 or > 1000)
            throw new InvalidOperationException("A fórmula de iniciativa publicada não pode ser executada.");
        int modifier = 0;
        foreach (Match term in Regex.Matches(dice.Groups["terms"].Value,
            @"(?<sign>[+-])\s*(?<value>[\p{L}_][\p{L}\p{N}_]*|\d+)",
            RegexOptions.CultureInvariant))
        {
            string code = term.Groups["value"].Value;
            if (code.Equals("modificadores", StringComparison.OrdinalIgnoreCase)) continue;
            int value;
            if (!int.TryParse(code, NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            {
                value = status.ValueKind == JsonValueKind.Object ? ReadAttribute(status, code) : 0;
                if (value == 0 && fallbackAttributes is not null)
                    value = fallbackAttributes.FirstOrDefault(pair => pair.Key.Equals(code,
                        StringComparison.OrdinalIgnoreCase)).Value;
            }
            modifier = checked(modifier + (term.Groups["sign"].Value == "-" ? -value : value));
        }
        return new GameBattleInitiativeSpec(formula, quantity, faces, modifier);
    }

    private static JsonElement? ParseOptionalSnapshot(string? json) =>
        string.IsNullOrWhiteSpace(json) ? null : ParseSnapshot(json);

    // Resolving the rule of an empty weapon must not remove it from a battle.
    // Only this temporary copy is filled; the magazine below keeps the run's real ammo.
    private static string? InventoryForRuleResolution(JsonElement? source)
    {
        if (source is null) return null;
        JsonNode? root = JsonNode.Parse(source.Value.GetRawText());
        Fill(root);
        return root?.ToJsonString();

        static void Fill(JsonNode? node)
        {
            if (node is JsonArray array)
            {
                foreach (JsonNode? child in array) Fill(child);
                return;
            }
            if (node is not JsonObject obj) return;
            JsonObject? attributes = obj.FirstOrDefault(pair =>
                pair.Key.Equals("atributos", StringComparison.OrdinalIgnoreCase)).Value as JsonObject;
            if (attributes is not null)
            {
                using JsonDocument document = JsonDocument.Parse(attributes.ToJsonString());
                JsonElement element = document.RootElement;
                int? capacity = ReadInt(element, "capacidadeMunicao")
                    ?? ReadInt(Property(element, "municao"), "capacidade");
                if (capacity is > 0)
                {
                    attributes["municaoAtual"] = capacity.Value;
                    // Fichas antigas podem ter carregador, mas deixar o switch
                    // de controle desligado pelo valor padrão do formulário.
                    attributes["controlaMunicao"] = true;
                }
            }
            foreach (KeyValuePair<string, JsonNode?> child in obj.ToArray()) Fill(child.Value);
        }
    }

    private List<GameBattleActionSpec> BuildWeaponActions(
        GameRunCharacterSnapshotDto snapshot,
        IReadOnlyList<string> weaponOrder,
        SistemaVersao version,
        GameBattlePreviewConfig config,
        IReadOnlyList<GameplayResolvedResultRange> ranges)
    {
        var actions = new List<GameBattleActionSpec>();
        if (snapshot.Inventario is not { } inventory)
            return actions;

        var character = new PersonagemJogador
        {
            IdpersonagemJogador = snapshot.IdPersonagemJogadorOrigem,
            Nome = snapshot.Nome,
            Idraca = snapshot.IdRaca,
            StatusJson = snapshot.Status.GetRawText(),
            InventarioJson = InventoryForRuleResolution(inventory),
        };

        IReadOnlyList<string> orderedIds = weaponOrder.Count > 0
            ? weaponOrder : GameRunWeaponOrder.WeaponIds(inventory);
        Dictionary<string, int> priority = orderedIds.Distinct(StringComparer.Ordinal)
            .Select((id, index) => (id, index))
            .ToDictionary(entry => entry.id, entry => entry.index, StringComparer.Ordinal);
        foreach (JsonElement item in GameRunWeaponOrder.InventoryEntries(inventory)
            .OrderBy(entry => priority.GetValueOrDefault(ReadString(entry, "id") ?? "", int.MaxValue)))
        {
            if (actions.Count == 7)
                break;
            if (item.ValueKind != JsonValueKind.Object ||
                !string.Equals(ReadString(item, "tipo"), "arma", StringComparison.OrdinalIgnoreCase))
                continue;
            string? id = ReadString(item, "id");
            if (string.IsNullOrWhiteSpace(id))
                continue;
            string fireMode = FixedFireMode(Property(item, "atributos"));

            GameplayResolvedAction? resolved = null;
            foreach (string? range in new string?[] { "CURTA", "MEDIA", "LONGA", null })
            {
                var request = new GameplayRollRequestDto
                {
                    CodigoAcao = "ACAO_FICHA",
                    IdPersonagemJogador = snapshot.IdPersonagemJogadorOrigem,
                    Modo = GameplayRollMode.Normal,
                    ReferenciaAcao = new GameplayActionReferenceDto { Tipo = "ITEM", IdInstancia = id },
                    ParametrosAcao = new GameplayActionParametersDto
                    {
                        Operacao = "ATACAR",
                        Alcance = range,
                        ModoDisparo = range is null ? null : fireMode,
                        Quantidade = 1,
                    },
                };
                var result = _actionResolver.Resolve(request, character, version);
                if (result.Sucesso && result.Dados is { } action &&
                    action.Groups.Count == 1 && action.Groups[0] == new GameplayDiceGroupSpec(1, 20) &&
                    action.Snapshot.Valores.TryGetValue("danoPorAcertoProposto", out string? damageText) &&
                    int.TryParse(damageText, NumberStyles.Integer, CultureInfo.InvariantCulture, out int damage) && damage > 0)
                {
                    resolved = action;
                    break;
                }
            }
            if (resolved is null)
                continue;

            // The provisional damage table only covers the published Odisseia
            // attack outcomes. A custom weapon must not disable the fallback.
            if (resolved.Ranges.Any(range => !config.PreviewPlayerDamageByResult!.ContainsKey(range.Code)))
                continue;

            int baseDamage = int.Parse(resolved.Snapshot.Valores["danoPorAcertoProposto"], CultureInfo.InvariantCulture);
            GameBattleMagazineSpec? magazine = ResolveMagazine(item, resolved);
            if (ReadInt(resolved.Snapshot.Valores, "consumoMunicaoProposto") is > 0 && magazine is null)
                continue;
            int staminaCost = ReadInt(resolved.Snapshot.Valores, "estaminaPorUsoProposta") ?? 0;
            string? weaponType = ReadString(Property(item, "atributos") ?? item, "tipoArma");
            actions.Add(new GameBattleActionSpec(
                $"item:{id}",
                resolved.Name,
                new GameplayRollPlan("1D20", resolved.Groups, resolved.Mode, resolved.Modifier,
                    ModifierDetails: resolved.Modifiers),
                resolved.Ranges,
                resolved.UseTotalForRanges,
                ResolvePlayerDamage(resolved.Ranges, baseDamage,
                    config.PreviewPlayerDamageByResult ?? throw new InvalidOperationException("O modo não define dano do personagem.")),
                StaminaCost: IsFirearmType(weaponType) ? 0 : Math.Max(0, staminaCost),
                Magazine: magazine)
            {
                UsesUntilRest = Math.Clamp(ReadInt(Property(item, "atributos"), "capacidadeUso") ?? 0, 0, 100000),
                InitialUsesRemaining = ReadInt(Property(item, "atributos"), "capacidadeUsoRestante"),
                Conditions = ResolveConditions(resolved, version),
                AttributeCode = resolved.Snapshot.Valores.TryGetValue("atributo", out string? itemAttribute)
                    ? itemAttribute : null,
            });
        }
        return actions;
    }

    private List<GameBattleActionSpec> BuildSelectedActions(
        GameRunCharacterSnapshotDto snapshot,
        IReadOnlyList<GameRunActionSelectionDto> selections,
        SistemaVersao version,
        GameBattlePreviewConfig config,
        IReadOnlyList<GameplayResolvedResultRange> ranges,
        ICollection<string>? validationErrors = null)
    {
        var character = new PersonagemJogador
        {
            IdpersonagemJogador = snapshot.IdPersonagemJogadorOrigem,
            Nome = snapshot.Nome,
            Idraca = snapshot.IdRaca,
            StatusJson = snapshot.Status.GetRawText(),
            InventarioJson = InventoryForRuleResolution(snapshot.Inventario),
            Implantes = InventoryForRuleResolution(snapshot.Implantes),
            Skills = snapshot.Skills?.GetRawText(),
            Magia = snapshot.Magia?.GetRawText(),
        };
        var actions = new List<GameBattleActionSpec>();
        foreach (GameRunActionSelectionDto selection in selections)
        {
            string type = selection.Tipo.ToUpperInvariant();
            if (type is not ("ITEM" or "PROTESE" or "MAGIA" or "SKILL")) continue;
            JsonElement? snapshotSource = type switch
            {
                "ITEM" => snapshot.Inventario, "PROTESE" => snapshot.Implantes,
                "MAGIA" => snapshot.Magia, _ => snapshot.Skills,
            };
            JsonElement? item = SnapshotEntries(snapshotSource).FirstOrDefault(entry =>
                string.Equals(ReadString(entry, "id"), selection.IdInstancia, StringComparison.Ordinal));
            if (item is not { ValueKind: JsonValueKind.Object }) continue;
            if (type == "PROTESE" && !GameRunProstheses.HasTest(item.Value))
            {
                validationErrors?.Add("Próteses sem teste são instaladas como equipamento, não como ações.");
                continue;
            }
            GameBattleActionSpec? utility = BuildUtilityAction(snapshot, selection, item.Value, version);
            if (utility is not null)
            {
                actions.Add(utility);
                continue;
            }
            int count = selection.QuantidadeAtaques;
            if (count is < 1 or > 100)
                throw new InvalidOperationException("A quantidade de ataques da ação está fora do limite.");
            JsonElement? attributes = Property(item, "atributos");
            string fireMode = FixedFireMode(attributes);
            string? weaponMode = attributes is { } weaponAttributes ? ReadString(weaponAttributes, "modoModificadores") : null;
            string? weaponType = attributes is { } typedAttributes ? ReadString(typedAttributes, "tipoArma") : null;
            if (string.IsNullOrWhiteSpace(weaponMode)) weaponMode = null;
            bool ranged = string.Equals(weaponMode, "DISTANCIA", StringComparison.OrdinalIgnoreCase) ||
                (weaponMode is null && IsRangedWeaponType(weaponType));
            int maximum = type is "ITEM" or "PROTESE"
                ? 100
                : type == "MAGIA" ? Math.Clamp(ReadInt(attributes, "limiteAtaquesPorTurno") ?? 1, 1, 100) : 1;
            int cadence = Math.Clamp(ReadInt(attributes, "cadencia") ?? ReadInt(attributes, "ataquesPorTurno") ?? 1, 1, 100);
            int configuredAmmoCost = ReadInt(attributes,
                fireMode == "RAJADA" ? "custoMunicaoRajada" : "custoMunicaoTiro") ?? 0;
            int ammoPerUse = configuredAmmoCost > 0 ? configuredAmmoCost
                : fireMode == "RAJADA" ? cadence : 1;
            int magazineCapacity = ReadInt(attributes, "capacidadeMunicao")
                ?? ReadInt(Property(attributes, "municao"), "capacidade") ?? 0;
            if (ranged && magazineCapacity > 0)
                maximum = Math.Min(maximum, magazineCapacity / ammoPerUse);
            int? actionLimit = ReadInt(attributes, "limiteAtaquesPorTurno");
            int? modeLimit = ReadInt(attributes, fireMode == "RAJADA" ? "limiteRajadasPorTurno" : "limiteTirosPorTurno");
            int? usesUntilRest = ReadInt(attributes, "capacidadeUso");
            if (actionLimit > 0) maximum = Math.Min(maximum, actionLimit.Value);
            if (ranged && modeLimit > 0) maximum = Math.Min(maximum, modeLimit.Value);
            if (usesUntilRest > 0) maximum = Math.Min(maximum, usesUntilRest.Value);
            int itemMaximum = maximum;
            var combatRules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCombate>(
                version, SistemaModuloTipo.Combate);
            SistemaLimiteAcoesArmaDto? systemLimit = combatRules.LimitesAcoesPorArma?.FirstOrDefault(rule =>
                NormalizeWeaponType(rule.TipoArma) == NormalizeWeaponType(weaponType));
            if (systemLimit is null && IsFirearmType(weaponType))
                systemLimit = combatRules.LimitesAcoesPorArma?.FirstOrDefault(rule =>
                    NormalizeWeaponType(rule.TipoArma) == "arma_de_fogo");
            int configuredMaximum = ranged
                ? fireMode == "RAJADA" ? systemLimit?.MaximoRajadas ?? 0 : systemLimit?.MaximoTiros ?? 0
                : systemLimit?.MaximoGolpes ?? 0;
            if (configuredMaximum > 0) maximum = Math.Min(maximum, configuredMaximum);
            if (count > maximum)
            {
                string source = type is "MAGIA" or "SKILL" ? "Sistema"
                    : configuredMaximum > 0 && configuredMaximum == itemMaximum ? "Item/Sistema"
                    : configuredMaximum > 0 && configuredMaximum < itemMaximum ? "Sistema" : "Item";
                throw new InvalidOperationException(
                    $"{source}: " +
                    $"a quantidade escolhida supera o limite de {maximum} por ação.");
            }
            GameplayResolvedAction? resolved = null;
            foreach (string? range in type is "ITEM" or "PROTESE"
                ? selection.Alcance is not null ? [selection.Alcance] :
                    new string?[] { "CURTA", "MEDIA", "LONGA", null } : [null])
            {
                var request = new GameplayRollRequestDto
                {
                    CodigoAcao = "ACAO_FICHA",
                    IdPersonagemJogador = snapshot.IdPersonagemJogadorOrigem,
                    Modo = GameplayRollMode.Normal,
                    ReferenciaAcao = new GameplayActionReferenceDto
                    {
                        Tipo = type, IdInstancia = selection.IdInstancia,
                    },
                    ParametrosAcao = new GameplayActionParametersDto
                    {
                        Operacao = "ATACAR", Alcance = range,
                        ModoDisparo = range is null ? null : fireMode, Quantidade = 1,
                    },
                };
                GameplayOperationResult<GameplayResolvedAction> result = _actionResolver.Resolve(
                    request, character, version);
                string damageKey = type is "ITEM" or "PROTESE"
                    ? "danoPorAcertoProposto" : "danoProposto";
                if (result.Sucesso && result.Dados is { } candidate &&
                    candidate.Groups.Count == 1 && candidate.Groups[0] == new GameplayDiceGroupSpec(1, 20) &&
                    ((candidate.Snapshot.Valores.TryGetValue(damageKey, out string? damageText) &&
                      int.TryParse(damageText, NumberStyles.Integer, CultureInfo.InvariantCulture,
                          out int damage) && damage > 0) ||
                     ResolveConditions(candidate, version).Count > 0 ||
                     type == "MAGIA" && ResolveConditionRemovals(candidate, version).Count > 0) &&
                    candidate.Ranges.Count > 0 &&
                    candidate.Ranges.All(resultRange =>
                        config.PreviewPlayerDamageByResult!.ContainsKey(resultRange.Code)))
                {
                    resolved = candidate;
                    break;
                }
                if (validationErrors is not null)
                {
                    string reason = !result.Sucesso ? result.Codigo == "PODER_SEM_TESTE"
                            ? "Ative um teste de acerto em D20 ou, para condições sem teste, use o gatilho Ao usar."
                            : result.Mensagem ?? "O teste não pôde ser validado."
                        : result.Dados is not { } action ? "O teste não pôde ser validado."
                        : action.Groups.Count != 1 || action.Groups[0] != new GameplayDiceGroupSpec(1, 20)
                            ? "O teste de acerto precisa usar 1D20."
                        : action.Ranges.Count == 0 ? "O teste não tem faixas de resultado configuradas."
                        : action.Ranges.Any(range => !config.PreviewPlayerDamageByResult!.ContainsKey(range.Code))
                            ? "As faixas deste teste não correspondem aos resultados de ataque configurados no jogo."
                        : "Configure dano maior que zero ou uma condição com efeitos executáveis nesta versão do Sistema.";
                    validationErrors.Add(reason);
                }
            }
            if (resolved is null) continue;
            int baseDamage = ReadInt(resolved.Snapshot.Valores,
                type is "ITEM" or "PROTESE" ? "danoPorAcertoProposto" : "danoProposto") ?? 0;
            GameBattleMagazineSpec? magazine = item is { ValueKind: JsonValueKind.Object }
                ? ResolveMagazine(item.Value, resolved) : null;
            if (ReadInt(resolved.Snapshot.Valores, "consumoMunicaoProposto") is > 0 && magazine is null)
                continue;
            if (magazine is not null && (long)magazine.AmmoPerUse * count > magazine.Capacity)
                throw new InvalidOperationException("A quantidade escolhida exige mais munição que o carregador comporta.");
            actions.Add(new GameBattleActionSpec(
                $"{type.ToLowerInvariant()}:{selection.IdInstancia}", resolved.Name,
                new GameplayRollPlan("1D20", resolved.Groups, resolved.Mode, resolved.Modifier,
                    ModifierDetails: resolved.Modifiers),
                resolved.Ranges, resolved.UseTotalForRanges,
                baseDamage > 0
                    ? ResolvePlayerDamage(resolved.Ranges, baseDamage,
                        config.PreviewPlayerDamageByResult!)
                    : resolved.Ranges.ToDictionary(range => range.Code, _ => 0,
                        StringComparer.OrdinalIgnoreCase),
                ManaCost: Math.Max(0, ReadInt(resolved.Snapshot.Valores, "custoManaProposto") ?? 0),
                StaminaCost: ranged && IsFirearmType(weaponType) ? 0 : Math.Max(0,
                    ReadInt(resolved.Snapshot.Valores,
                        type is "ITEM" or "PROTESE" ? "estaminaPorUsoProposta" : "custoEstaminaProposto") ?? 0),
                CooldownTurns: Math.Max(0, ReadInt(resolved.Snapshot.Valores, "cooldownTurnosProposto") ?? 0),
                Magazine: magazine)
            {
                Conditions = ResolveConditions(resolved, version),
                RemovesConditions = ResolveConditionRemovals(resolved, version),
                AttributeCode = resolved.Snapshot.Valores.TryGetValue("atributo", out string? selectedAttribute)
                    ? selectedAttribute : null,
                AttacksPerTurn = count,
                UsesUntilRest = Math.Clamp(usesUntilRest ?? 0, 0, 100000),
                InitialUsesRemaining = ReadInt(attributes, "capacidadeUsoRestante"),
                AdditionalAttackStaminaCost = ranged
                    ? IsFirearmType(weaponType)
                        ? Math.Max(Math.Max(0, ReadInt(resolved.Snapshot.Valores, "estaminaPorUsoProposta") ?? 0),
                            combatRules.EstaminaPorAtaqueAdicional)
                        : combatRules.EstaminaPorAtaqueAdicional
                    : 0,
            });
        }
        return actions;
    }

    private static IReadOnlyList<GameBattleConditionApplication> ResolveConditions(
        GameplayResolvedAction action, SistemaVersao version)
    {
        if (!action.Snapshot.Valores.TryGetValue("condicoesPropostasJson", out string? json) ||
            string.IsNullOrWhiteSpace(json)) return [];
        return ResolveConditions(json, version);
    }

    private static IReadOnlyList<GameBattleConditionApplication> ResolveConditions(
        string json, SistemaVersao version)
    {
        ConditionOriginSnapshot[] origins = JsonSerializer.Deserialize<ConditionOriginSnapshot[]>(json, JsonOptions) ?? [];
        return ResolveConditions(origins, version);
    }

    private static IReadOnlyList<GameBattleConditionApplication> ResolveConfiguredConditions(
        JsonElement? attributes, SistemaVersao version, string defaultTarget = "ALVO")
    {
        if (Property(attributes, "condicoes") is not { ValueKind: JsonValueKind.Array } configured) return [];
        var origins = new List<ConditionOriginSnapshot>();
        foreach (JsonElement origin in configured.EnumerateArray())
        {
            if (origin.ValueKind != JsonValueKind.Object) continue;
            var values = new Dictionary<int, int>();
            if (Property(origin, "valoresEfeitos") is { ValueKind: JsonValueKind.Object } effectValues)
                foreach (JsonProperty value in effectValues.EnumerateObject())
                    if (int.TryParse(value.Name, out int index) && ReadInt(effectValues, value.Name) is int number)
                        values[index] = number;
            JsonElement? natural = Property(origin, "resultadosNaturais");
            JsonElement? resistance = Property(origin, "testeResistencia");
            origins.Add(new ConditionOriginSnapshot(
                ReadString(origin, "codigo") ?? "", ReadString(origin, "nome") ?? "",
                ReadInt(origin, "valor"), ReadInt(origin, "duracao"),
                ReadString(origin, "unidadeDuracao") ?? "", ReadString(origin, "gatilho") ?? "ACERTO",
                natural is { ValueKind: JsonValueKind.Array } array
                    ? array.EnumerateArray().Where(value => value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out _))
                        .Select(value => value.GetInt32()).ToArray() : [],
                ReadInt(origin, "resultadoNaturalMinimo"), ReadInt(origin, "resultadoNaturalMaximo"),
                ReadString(origin, "alvo") ?? defaultTarget, ReadString(origin, "codigoResultado"), values,
                resistance is { ValueKind: JsonValueKind.Object } test
                    ? test.Deserialize<GameplayResistanceTestDto>(JsonOptions) : null));
        }
        return ResolveConditions(origins, version);
    }

    private static IReadOnlyList<GameBattleConditionApplication> ResolveConditions(
        IReadOnlyList<ConditionOriginSnapshot> origins, SistemaVersao version)
    {
        var published = version.Condicoes.ToDictionary(rule => rule.Codigo, StringComparer.OrdinalIgnoreCase);
        var result = new List<GameBattleConditionApplication>();
        foreach (ConditionOriginSnapshot origin in origins)
        {
            if (string.IsNullOrWhiteSpace(origin.Code) || !published.TryGetValue(origin.Code, out SistemaCondicao? rule)) continue;
            IReadOnlyList<SistemaCondicaoEfeito> effects = SistemaCondicaoEfeitos.Read(rule);
            if (effects.Count == 0 || effects.Any(effect => !SistemaCondicaoEfeitos.Valid(
                    effect.Operacao, effect.Recurso, effect.Valor, effect.Momento))) continue;
            if (origin.Value is < -1000000 or > 1000000 || origin.Duration is <= 0 or > 1000000 ||
                !GameplayConditionResistance.Valid(origin.ResistanceTest, version) ||
                origin.EffectValues?.Any(pair => pair.Key < 0 || pair.Key >= effects.Count ||
                    !SistemaCondicaoEfeitos.Valid(effects[pair.Key].Operacao, effects[pair.Key].Recurso,
                        pair.Value, effects[pair.Key].Momento)) == true ||
                origin.NaturalResults?.Any(number => number is < 1 or > 20) == true ||
                origin.NaturalMinimum is < 1 or > 20 || origin.NaturalMaximum is < 1 or > 20 ||
                origin.NaturalMinimum > origin.NaturalMaximum) continue;
            string unit = string.IsNullOrWhiteSpace(origin.Unit) ? rule.UnidadeDuracao.ToString() : origin.Unit;
            if (!unit.Equals("Turno", StringComparison.OrdinalIgnoreCase) &&
                !unit.Equals("Hora", StringComparison.OrdinalIgnoreCase)) continue;
            if ((origin.Trigger ?? "ACERTO").Equals("RESULTADO_NATURAL", StringComparison.OrdinalIgnoreCase) &&
                origin.NaturalResults is not { Count: > 0 } &&
                !origin.NaturalMinimum.HasValue && !origin.NaturalMaximum.HasValue) continue;
            if ((origin.Trigger ?? "ACERTO").Equals("RESULTADO_CLASSIFICADO", StringComparison.OrdinalIgnoreCase) &&
                (string.IsNullOrWhiteSpace(origin.ResultCode) || !version.ResultadosDado.Any(row =>
                    row.CodigoResultado.Equals(origin.ResultCode, StringComparison.OrdinalIgnoreCase)))) continue;
            int configuredValue = (int)Math.Clamp(decimal.Truncate(rule.ValorEfeito ?? rule.ValorPadrao ?? 0), 0, 1000000);
            if ((origin.Duration ?? rule.DuracaoPadrao) is <= 0 or > 1000000) continue;
            result.Add(new GameBattleConditionApplication(
                new GameBattleConditionRule(rule.Codigo, rule.Nome, rule.OperacaoEfeito ?? "",
                    rule.CodigoRecurso ?? "", configuredValue, rule.MomentoEfeito ?? "", rule.Empilhavel,
                    rule.PermiteSobrescrever, rule.RegraRemocao ?? "MANUAL")
                    { Effects = effects, Image = SistemaCondicaoEfeitos.Image(rule) },
                origin.Value, origin.Duration ?? rule.DuracaoPadrao, unit,
                string.IsNullOrWhiteSpace(origin.Trigger) ? "ACERTO" : origin.Trigger,
                origin.NaturalResults ?? [])
            { NaturalMinimum = origin.NaturalMinimum, NaturalMaximum = origin.NaturalMaximum,
              Target = origin.Target ?? "ALVO", OutcomeCode = origin.ResultCode,
              EffectValues = origin.EffectValues ?? new Dictionary<int, int>(),
              ResistanceTest = origin.ResistanceTest is null ? null : new GameBattleResistanceTest(
                  origin.ResistanceTest.Dados, origin.ResistanceTest.Faces,
                  SistemaRpgConfiguration.NormalizarCodigo(origin.ResistanceTest.Atributo, string.Empty),
                  origin.ResistanceTest.Dificuldade) });
        }
        return result;
    }

    private static IReadOnlyList<JsonElement> SnapshotEntries(JsonElement? source)
    {
        if (source is null) return [];
        JsonElement value = source.Value;
        if (value.ValueKind == JsonValueKind.String && value.GetString() is string serialized)
        {
            using JsonDocument document = JsonDocument.Parse(serialized);
            return SnapshotEntries(document.RootElement.Clone());
        }
        if (value.ValueKind == JsonValueKind.Array) return value.EnumerateArray().ToArray();
        foreach (string key in new[] { "itens", "inventario", "items", "implantes", "proteses", "magia", "magias", "skills", "poderes" })
            if (Property(value, key) is { ValueKind: JsonValueKind.Array } entries)
                return entries.EnumerateArray().ToArray();
        return [];
    }

    private static GameBattleActionSpec? BuildUtilityAction(GameRunCharacterSnapshotDto snapshot,
        GameRunActionSelectionDto selection, JsonElement item, SistemaVersao version)
    {
        JsonElement? attributes = Property(item, "atributos");
        string type = selection.Tipo.ToUpperInvariant();
        string subtype = ReadString(item, "tipo")?.ToLowerInvariant() ?? "";
        bool itemUtility = type == "ITEM" && subtype is "consumiveis" or "outro";
        JsonElement? test = Property(attributes, "teste") ?? Property(item, "teste") ??
            Property(attributes, "especificacaoTeste") ?? Property(item, "especificacaoTeste");
        bool declaredTest = !string.IsNullOrWhiteSpace(ReadString(test ?? item, "codigoTeste")) ||
            !string.IsNullOrWhiteSpace(ReadString(attributes ?? item, "acerto"));
        if (declaredTest) return null;
        JsonElement? restore = Property(attributes, "restaura");
        int life = Math.Max(0, ReadInt(attributes, "recuperacaoVida") ?? ReadInt(restore, "vida") ?? 0);
        int mana = Math.Max(0, ReadInt(attributes, "recuperacaoMana") ?? ReadInt(restore, "mana") ?? 0);
        int stamina = Math.Max(0, ReadInt(attributes, "recuperacaoEstamina") ?? ReadInt(restore, "estamina") ?? 0);
        IReadOnlyList<GameBattleConditionApplication> conditions = ResolveConfiguredConditions(attributes, version,
                itemUtility ? "USUARIO" : "ALVO")
            .Where(origin => origin.Trigger.Equals("AO_USAR", StringComparison.OrdinalIgnoreCase)).ToArray();
        if (life + (long)mana + stamina == 0 && conditions.Count == 0) return null;
        if (type == "ITEM" && !itemUtility) return null;
        if (selection.QuantidadeAtaques != 1 || selection.Alcance is not null || selection.ModoDisparo is not null)
            throw new InvalidOperationException("Utilitários usam uma unidade por ação, sem alcance ou modo de disparo.");
        int? quantity = type == "ITEM"
            ? GameRunConsumable.AvailableQuantity(snapshot.Inventario, selection.IdInstancia) : null;
        if (quantity is <= 0)
            throw new InvalidOperationException("Este utilitário não possui unidades no inventário da run.");
        int manaCost = Math.Max(0, ReadInt(attributes, "custoMana") ?? ReadInt(attributes, "gastoMana") ??
            ReadInt(item, "custoMana") ?? ReadInt(item, "gastoMana") ?? 0);
        int staminaCost = Math.Max(0, ReadInt(attributes, "custoEstamina") ?? ReadInt(attributes, "gastoEstamina") ??
            ReadInt(item, "custoEstamina") ?? ReadInt(item, "gastoEstamina") ?? 0);
        int cooldown = type is "MAGIA" or "SKILL" && version.SkillConfig?.UsaCooldown != true ? 0 :
            Math.Clamp(ReadInt(attributes, "cooldownTurnos") ?? ReadInt(item, "cooldownTurnos") ?? 0, 0, 100);
        return new GameBattleActionSpec($"{type.ToLowerInvariant()}:{selection.IdInstancia}",
            ReadString(item, "nome") ?? "Utilitário",
            new GameplayRollPlan("SEM_TESTE", [], GameplayRollMode.Normal, 0), [], false,
            new Dictionary<string, int>(), ManaCost: manaCost, StaminaCost: staminaCost,
            CooldownTurns: cooldown)
        {
            Utility = new GameBattleUtilitySpec(quantity, life, mana, stamina),
            Conditions = conditions,
            UsesUntilRest = Math.Clamp(ReadInt(attributes, "capacidadeUso") ?? 0, 0, 100000),
            InitialUsesRemaining = ReadInt(attributes, "capacidadeUsoRestante"),
        };
    }

    private static IReadOnlyList<string> ResolveConditionRemovals(
        GameplayResolvedAction action, SistemaVersao version)
    {
        if (!action.Snapshot.Valores.TryGetValue("condicoesRemovidasPorMagiaJson", out string? json) ||
            string.IsNullOrWhiteSpace(json)) return [];
        string[] codes = JsonSerializer.Deserialize<string[]>(json, JsonOptions) ?? [];
        return codes.Where(code => version.Condicoes.Any(rule =>
            rule.Codigo.Equals(code, StringComparison.OrdinalIgnoreCase) &&
            SistemaCondicaoRemocao.AoUsarMagiaDeRemocao(rule)))
            .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private sealed record ConditionOriginSnapshot(
        string Code, string Name, int? Value, int? Duration,
        string Unit, string Trigger, IReadOnlyList<int>? NaturalResults,
        int? NaturalMinimum = null, int? NaturalMaximum = null, string? Target = null,
        string? ResultCode = null, IReadOnlyDictionary<int, int>? EffectValues = null,
        GameplayResistanceTestDto? ResistanceTest = null);

    private static IReadOnlyList<GameBattleActiveCondition> ReadActiveConditions(
        GameRunCharacterSnapshotDto snapshot, SistemaVersao version)
    {
        JsonElement? source = Property(snapshot.Status, "condicoesJogo");
        GameBattleActiveCondition[] saved = source is { ValueKind: JsonValueKind.Array }
            ? JsonSerializer.Deserialize<GameBattleActiveCondition[]>(source.Value.GetRawText(), JsonOptions) ?? []
            : [];
        var published = version.Condicoes.ToDictionary(rule => rule.Codigo, StringComparer.OrdinalIgnoreCase);
        var result = saved.Where(item => item?.Rule is not null && published.ContainsKey(item.Rule.Code))
            .Select(item =>
            {
                SistemaCondicao rule = published[item.Rule.Code];
                return item with { Rule = new GameBattleConditionRule(rule.Codigo, rule.Nome,
                    rule.OperacaoEfeito ?? "", rule.CodigoRecurso ?? "", item.Rule.Value,
                    rule.MomentoEfeito ?? "", rule.Empilhavel, rule.PermiteSobrescrever,
                    rule.RegraRemocao ?? "MANUAL")
                    { Effects = SistemaCondicaoEfeitos.Read(rule), Image = SistemaCondicaoEfeitos.Image(rule) } };
            }).ToList();
        if (snapshot.CondicoesAtivas is { ValueKind: JsonValueKind.Object } flags)
            foreach (JsonProperty flag in flags.EnumerateObject())
            {
                if (flag.Value.ValueKind != JsonValueKind.True || !published.TryGetValue(flag.Name, out SistemaCondicao? rule) ||
                    result.Any(item => item.Rule.Code.Equals(rule.Codigo, StringComparison.OrdinalIgnoreCase)) ||
                    SistemaCondicaoEfeitos.Read(rule).Count == 0) continue;
                int value = (int)Math.Clamp(decimal.Truncate(rule.ValorPadrao ?? rule.ValorEfeito ?? 0), 0, 1000000);
                result.Add(new GameBattleActiveCondition(new GameBattleConditionRule(rule.Codigo, rule.Nome,
                    rule.OperacaoEfeito ?? "", rule.CodigoRecurso ?? "", value, rule.MomentoEfeito ?? "ENQUANTO_ATIVA",
                    rule.Empilhavel, rule.PermiteSobrescrever, rule.RegraRemocao ?? "MANUAL")
                    { Effects = SistemaCondicaoEfeitos.Read(rule) }, value, null));
            }
        return result;
    }

    private static GameBattleMagazineSpec? ResolveMagazine(JsonElement item, GameplayResolvedAction action)
    {
        int? ammoCost = ReadInt(action.Snapshot.Valores, "consumoMunicaoProposto");
        if (ammoCost is not > 0)
            return null;
        JsonElement? attributes = Property(item, "atributos");
        JsonElement? ammunition = Property(attributes, "municao");
        int loaded = ReadInt(attributes, "municaoAtual") ?? ReadInt(ammunition, "atual")
            ?? ReadInt(action.Snapshot.Valores, "municaoAtual") ?? 0;
        int capacity = ReadInt(attributes, "capacidadeMunicao") ?? 0;
        if (capacity <= 0) capacity = ReadInt(ammunition, "capacidade") ?? 0;
        if (capacity <= 0) capacity = loaded;
        int? configuredReserve = ReadInt(attributes, "municaoReserva")
            ?? ReadInt(ammunition, "reserva");
        int reserve = Math.Max(0, configuredReserve ?? 0);
        if (capacity < ammoCost || loaded < 0 || loaded > capacity)
            return null;
        // O carregador pertence ao encontro, não ao snapshot persistido da ficha.
        // Mesmo a primeira batalha de uma run criada a partir de uma ficha com
        // munição zerada deve começar com o pente cheio.
        return new GameBattleMagazineSpec(capacity, capacity, reserve, ammoCost.Value,
            configuredReserve is null || reserve > 0)
        { UnlimitedReserve = configuredReserve is null };
    }

    private static string FixedFireMode(JsonElement? attributes)
    {
        string? mode = attributes is { ValueKind: JsonValueKind.Object }
            ? ReadString(attributes.Value, "modoDisparo") : null;
        if (mode is not null && (mode.Equals("TIRO", StringComparison.OrdinalIgnoreCase) ||
            mode.Equals("RAJADA", StringComparison.OrdinalIgnoreCase)))
            return mode.ToUpperInvariant();

        JsonElement? configured = Property(Property(attributes, "teste"), "modosDisparo");
        if (configured is { ValueKind: JsonValueKind.Array })
        {
            string[] modes = configured.Value.EnumerateArray()
                .Where(entry => entry.ValueKind == JsonValueKind.String)
                .Select(entry => entry.GetString()?.ToUpperInvariant() ?? string.Empty)
                .Where(entry => entry is "TIRO" or "RAJADA")
                .Distinct(StringComparer.Ordinal).ToArray();
            if (modes.Length == 1) return modes[0];
        }

        int shotCost = ReadInt(attributes, "custoMunicaoTiro") ?? 0;
        int burstCost = ReadInt(attributes, "custoMunicaoRajada") ?? 0;
        if (burstCost > 0 && shotCost <= 0) return "RAJADA";
        return (ReadInt(attributes, "cadencia") ?? 0) >= 10 ? "RAJADA" : "TIRO";
    }

    private static string NormalizeWeaponType(string? type) =>
        (type ?? string.Empty).Trim().ToLowerInvariant().Replace(' ', '_').Replace('-', '_');

    private static bool IsRangedWeaponType(string? type) => NormalizeWeaponType(type) is
        "pistola_revolver" or "smg" or "rifle_assalto" or "shotgun" or
        "rifle_atirador" or "rifle_precisao" or "arma_energizada" or "arma_fotons" or
        "arco" or "crossbow" or "arma_pesada" or "arma_pesada_area" or "dano_continuo";

    private static bool IsFirearmType(string? type) => NormalizeWeaponType(type) is
        "pistola_revolver" or "smg" or "rifle_assalto" or "shotgun" or
        "rifle_atirador" or "rifle_precisao" or "arma_pesada" or "arma_pesada_area";

    private static Dictionary<string, int> ResolvePlayerDamage(
        IReadOnlyList<GameplayResolvedResultRange> ranges,
        int baseDamage,
        IReadOnlyDictionary<string, GameBattleDamageModifier> modifiers)
    {
        var damageByResult = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (GameplayResolvedResultRange range in ranges)
        {
            if (!modifiers.TryGetValue(range.Code, out GameBattleDamageModifier? modifier) ||
                modifier.Multiplier < 0 || modifier.Bonus < 0)
                throw new InvalidOperationException($"O modo não define o dano de {range.Code} para o personagem.");
            decimal damage = baseDamage * modifier.Multiplier + modifier.Bonus;
            if (damage > int.MaxValue)
                throw new InvalidOperationException("O dano configurado para a prévia excede o limite permitido.");
            damageByResult[range.Code] = Math.Max(0, (int)decimal.Round(damage, 0, MidpointRounding.AwayFromZero));
        }
        return damageByResult;
    }

    private static IReadOnlyList<GameBattleDefenseKind> ResolveDefenseOrder(
        SistemaVersao version, GameBattleDefenses player, GameBattleDefenses enemy)
    {
        var required = new HashSet<GameBattleDefenseKind>();
        if (player.Shield > 0 || enemy.Shield > 0) required.Add(GameBattleDefenseKind.Shield);
        if (player.Protection > 0 || enemy.Protection > 0) required.Add(GameBattleDefenseKind.Protection);
        if (player.Armor > 0 || enemy.Armor > 0) required.Add(GameBattleDefenseKind.Armor);
        if (required.Count == 0)
            return Array.Empty<GameBattleDefenseKind>();

        var order = new List<GameBattleDefenseKind>();
        foreach (SistemaTipoDefesa rule in version.TiposDefesa.OrderBy(rule => rule.OrdemAplicacao))
        {
            GameBattleDefenseKind? kind = rule.Codigo.ToUpperInvariant() switch
            {
                "ESCUDO" when rule.TipoComportamento == "BloqueiaUmDano" => GameBattleDefenseKind.Shield,
                "PROTECAO" when rule.TipoComportamento == "AbsorveEDesgasta" => GameBattleDefenseKind.Protection,
                "ARMADURA" when rule.TipoComportamento == "AbsorcaoConstante" => GameBattleDefenseKind.Armor,
                _ => null,
            };
            if (kind.HasValue && required.Contains(kind.Value) && !order.Contains(kind.Value))
                order.Add(kind.Value);
        }
        if (order.Count != required.Count)
            throw new InvalidOperationException("A versão do Sistema não define a ordem e o comportamento de todas as defesas ativas.");
        return order;
    }

    private static JsonElement? Property(JsonElement? source, string name)
    {
        if (source is not { ValueKind: JsonValueKind.Object } value)
            return null;
        foreach (JsonProperty property in value.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                return property.Value;
        }
        return null;
    }

    private static int ReadAttribute(JsonElement status, string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return 0;
        JsonElement? attributes = Property(status, "atributos");
        JsonElement? primary = Property(attributes, "principais");
        JsonElement? secondary = Property(attributes, "secundarios");
        static int? NormalizedValue(JsonElement? group, string requested)
        {
            if (group is not { ValueKind: JsonValueKind.Object } values) return null;
            string normalized = SistemaRpgConfiguration.NormalizarCodigo(requested, string.Empty);
            foreach (JsonProperty entry in values.EnumerateObject())
                if (SistemaRpgConfiguration.NormalizarCodigo(entry.Name, string.Empty) == normalized &&
                    entry.Value.TryGetInt32(out int value)) return value;
            return null;
        }
        return NormalizedValue(primary, code) ?? NormalizedValue(secondary, code) ?? 0;
    }

    private static IReadOnlyDictionary<string, int> ReadAttributes(JsonElement status,
        IReadOnlyDictionary<string, int>? fallback = null)
    {
        var values = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        JsonElement? attributes = Property(status, "atributos");
        foreach (string groupName in new[] { "principais", "secundarios" })
        {
            JsonElement? group = Property(attributes, groupName);
            if (group is not { ValueKind: JsonValueKind.Object } entries) continue;
            foreach (JsonProperty entry in entries.EnumerateObject())
                if (entry.Value.ValueKind == JsonValueKind.Number && entry.Value.TryGetInt32(out int value))
                    values[SistemaRpgConfiguration.NormalizarCodigo(entry.Name, string.Empty)] = value;
        }
        if (fallback is not null)
            foreach ((string code, int value) in fallback)
                values.TryAdd(SistemaRpgConfiguration.NormalizarCodigo(code, string.Empty), value);
        return values;
    }

    private static string? ReadString(JsonElement source, string name)
    {
        JsonElement? property = Property(source, name);
        return property?.ValueKind switch
        {
            JsonValueKind.String => property.Value.GetString(),
            JsonValueKind.Number => property.Value.GetRawText(),
            _ => null,
        };
    }

    private static int? ReadInt(JsonElement? source, string name)
    {
        JsonElement? property = Property(source, name);
        if (property?.ValueKind == JsonValueKind.Number && property.Value.TryGetInt32(out int number))
            return number;
        return property?.ValueKind == JsonValueKind.String &&
            int.TryParse(property.Value.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out number)
                ? number : null;
    }

    private static int? ReadInt(IReadOnlyDictionary<string, string> source, string name) =>
        source.TryGetValue(name, out string? text) &&
        int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int number)
            ? number : null;
}

public sealed record GameBattlePreviewSetup(
    GameBattleInput Input,
    IReadOnlyList<string> WeaponNames,
    string FallbackActionName);

public sealed class GameBattlePreviewConfig
{
    public int SchemaVersion { get; set; }
    public int SaleDiscountPercent { get; set; }
    public GameBattlePreviewEnemy? PreviewEnemy { get; set; }
    public Dictionary<string, int>? PreviewDamageByResult { get; set; }
    public Dictionary<string, GameBattleDamageModifier>? PreviewPlayerDamageByResult { get; set; }
    public GameBattleFallbackAction? PreviewFallbackAction { get; set; }
    public bool PreviewUseTotalForRanges { get; set; }
    public Dictionary<string, GameBattleEncounterConfig>? Encounters { get; set; }
}

public sealed class GameBattleEncounterConfig
{
    public int CurrencyReward { get; set; }
    public int LootCount { get; set; }
    public List<OdisseiaWiki.GameRuns.GameLootEntry> Loot { get; set; } = [];
    public string MapName { get; set; } = string.Empty;
    public bool? Configured { get; set; }
    public int XpReward { get; set; }
    public GameBattlePreviewEnemy? Enemy { get; set; }
    public Dictionary<string, int>? DamageByResult { get; set; }
}

public sealed class GameBattlePreviewEnemy
{
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public int? NpcId { get; set; }
    public string? VariantId { get; set; }
    public Dictionary<string, int> Attributes { get; set; } = [];
    public string? AttackAttributeCode { get; set; }
    public int MaxVida { get; set; }
    public int Defesa { get; set; }
    public int MaxMana { get; set; }
    public int MaxEstamina { get; set; }
    public int CustoManaAtaque { get; set; }
    public int CustoEstaminaAtaque { get; set; }
    public int Quantity { get; set; } = 1;
    public string? StatusJson { get; set; }
    public string? InventarioJson { get; set; }
    public string? ImplantesJson { get; set; }
    public string? SkillsJson { get; set; }
    public string? MagiaJson { get; set; }
    public List<GameRunActionSelectionDto> Actions { get; set; } = [];
}

public sealed class GameBattleDamageModifier
{
    public decimal Multiplier { get; set; }
    public int Bonus { get; set; }
}

public sealed class GameBattleFallbackAction
{
    public string Name { get; set; } = string.Empty;
    public int BaseDamage { get; set; }
    public string? AttributeCode { get; set; }
}
