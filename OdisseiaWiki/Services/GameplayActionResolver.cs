using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

/// <summary>
/// Resolves actions that originate in a character sheet. Client supplied ids,
/// modifiers and dice are never executable rules: this class reads the stored
/// character snapshot and the System version pinned to the Mesa instead.
/// </summary>
public sealed class GameplayActionResolver
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
    };

    private static readonly HashSet<string> RangedWeaponTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "pistola_revolver", "smg", "rifle_assalto", "shotgun", "rifle_atirador",
        "rifle_precisao", "arma_energizada", "arma_fotons", "arco", "crossbow",
        "arma_pesada", "arma_pesada_area", "dano_continuo",
    };

    private static readonly IReadOnlyDictionary<string, string> LegacyXpActions =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["XP_COMBATE"] = "COMBATE_NORMAL",
            ["XP_MINIBOSS"] = "MINI_BOSS",
            ["XP_BOSS"] = "BOSS",
            ["XP_SESSAO"] = "SESSAO_SEM_COMBATE",
            ["XP_MVP"] = "MVP_SESSAO",
            ["XP_MISSAO_SECUNDARIA"] = "MISSAO_SECUNDARIA",
            ["XP_CONTRATO"] = "MISSAO_CONTRATO",
            ["XP_MISSAO_PRINCIPAL"] = "MISSAO_PRINCIPAL",
        };

    public GameplayActionCatalogDto BuildCatalog(SistemaVersao version)
    {
        SistemaRpgConfiguration.RegrasGerais general =
            SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasGerais>(
                version,
                SistemaModuloTipo.RegrasBase);
        var actions = new List<GameplayActionCatalogItemDto>
        {
            new()
            {
                Codigo = "TESTE_GENERICO",
                Nome = "Teste geral",
                Tipo = "GERAL",
                Expressao = general.DadoTesteGeral,
                ModoPadrao = GameplayRollMode.Normal,
                Executavel = SistemaRpgConfiguration.ObterFacesDado(general.DadoTesteGeral).HasValue,
                MotivoIndisponivel = SistemaRpgConfiguration.ObterFacesDado(general.DadoTesteGeral).HasValue
                    ? null
                    : "O dado geral da versão publicada é inválido.",
            },
        };

        actions.AddRange(version.Atributos
            .Where(attribute => attribute.Ativo)
            .OrderBy(attribute => attribute.Ordem)
            .Select(attribute => new GameplayActionCatalogItemDto
            {
                Codigo = attribute.Grupo == SistemaAtributoGrupo.Principal
                    ? "ATRIBUTO_PRINCIPAL"
                    : "ATRIBUTO_SECUNDARIO",
                Nome = attribute.Nome,
                Tipo = "ATRIBUTO",
                CodigoAtributo = attribute.CodigoAtributo,
                GrupoAtributo = attribute.Grupo.ToString(),
                Expressao = attribute.FormulaTeste ?? string.Empty,
                ModoPadrao = GameplayRollMode.Normal,
                Executavel = TryReadConfiguredDice(attribute.ConfiguracaoJson, attribute.FormulaTeste, out _, out _),
                MotivoIndisponivel = TryReadConfiguredDice(attribute.ConfiguracaoJson, attribute.FormulaTeste, out _, out _)
                    ? null
                    : "O atributo não possui uma fórmula de teste executável.",
            }));

        actions.AddRange(version.FontesExperiencia
            .OrderBy(source => source.Ordem)
            .Select(source =>
            {
                GameplayXpRule rule = ReadXpRule(source);
                return new GameplayActionCatalogItemDto
                {
                    Codigo = $"XP_{NormalizeCode(source.Codigo)}",
                    Nome = source.Nome,
                    Tipo = "XP",
                    Expressao = source.Formula ?? string.Empty,
                    ModoPadrao = rule.Mode,
                    Executavel = rule.Executable,
                    MotivoIndisponivel = rule.Executable
                        ? null
                        : "A fonte de XP não possui uma fórmula executável.",
                };
            }));

        return new GameplayActionCatalogDto
        {
            IdSistemaVersao = version.IdSistemaVersao,
            DadoTesteGeral = general.DadoTesteGeral,
            Acoes = actions,
        };
    }

    public GameplayOperationResult<GameplayResolvedAction> ResolveSystemAction(
        GameplayRollRequestDto request,
        PersonagemJogador? character,
        SistemaVersao version)
    {
        string action = NormalizeCode(request.CodigoAcao);
        if (action == "TESTE_GENERICO")
            return ResolveGeneric(request, version);
        if (action is "ATRIBUTO_PRINCIPAL" or "ATRIBUTO_SECUNDARIO")
            return ResolveAttribute(request, character, version, action);
        if (action.StartsWith("XP_", StringComparison.Ordinal))
            return ResolveExperience(version, action);
        return Failure("ACAO_DESCONHECIDA", "A ação informada não existe na versão publicada do Sistema.");
    }

    private static GameplayOperationResult<GameplayResolvedAction> ResolveGeneric(
        GameplayRollRequestDto request,
        SistemaVersao version)
    {
        SistemaRpgConfiguration.RegrasGerais general =
            SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasGerais>(
                version,
                SistemaModuloTipo.RegrasBase);
        int? configuredFaces = SistemaRpgConfiguration.ObterFacesDado(general.DadoTesteGeral);
        if (!configuredFaces.HasValue)
            return Failure("DADO_GERAL_INVALIDO", "O dado geral da versão publicada do Sistema é inválido.");
        if (request.Modo == GameplayRollMode.Vantagem && !general.UsaVantagem)
            return Failure("VANTAGEM_NAO_PERMITIDA", "Este Sistema não permite vantagem em testes gerais.");
        if (request.Modo == GameplayRollMode.Desvantagem && !general.UsaDesvantagem)
            return Failure("DESVANTAGEM_NAO_PERMITIDA", "Este Sistema não permite desvantagem em testes gerais.");

        IReadOnlyList<GameplayDiceGroupSpec> groups = request.Grupos.Count == 0
            ? new[] { new GameplayDiceGroupSpec(1, configuredFaces.Value) }
            : request.Grupos.Select(group => new GameplayDiceGroupSpec(group.Quantidade, group.Faces)).ToArray();
        int totalDice = groups.Sum(group => group.Quantity);
        if (groups.Count > 8 || totalDice is < 1 or > 100 ||
            groups.Any(group => group.Quantity is < 1 or > 100 || group.Faces is < 2 or > 1000))
        {
            return Failure("DADO_INVALIDO", "A rolagem livre excede os limites permitidos.");
        }

        List<SistemaResultadoDado> rows = FindResultRows(version, "TESTE_GERAL", "TESTE_GENERICO");
        bool matchesConfiguredTest = groups.Count == 1 && groups[0].Quantity == 1 &&
            groups[0].Faces == configuredFaces.Value;
        var notices = new List<GameplayExecutionNoticeDto>();
        if (!matchesConfiguredTest)
        {
            rows.Clear();
            notices.Add(new GameplayExecutionNoticeDto
            {
                Codigo = "ROLAGEM_LIVRE",
                Mensagem = "Dado escolhido livremente; nenhuma classificação do Sistema foi aplicada.",
                Fallback = false,
            });
        }
        else if (rows.Count == 0)
        {
            if (IsOdisseia(version))
            {
                rows.Add(new SistemaResultadoDado { CodigoResultado = "FALHA", NomeResultado = "Falha", ResultadoMinimo = int.MinValue, ResultadoMaximo = 3 });
                rows.Add(new SistemaResultadoDado { CodigoResultado = "SUCESSO", NomeResultado = "Sucesso", ResultadoMinimo = 4, ResultadoMaximo = int.MaxValue });
                notices.Add(Fallback("A versão antiga do Odisseia usa sucesso a partir de 4 no teste geral."));
            }
            else
            {
                notices.Add(new GameplayExecutionNoticeDto
                {
                    Codigo = "TESTE_SEM_FAIXAS",
                    Mensagem = "O Sistema não publicou faixas para o teste geral; o total foi mantido sem classificação.",
                    Fallback = false,
                });
            }
        }

        return GameplayOperationResult<GameplayResolvedAction>.Ok(new GameplayResolvedAction(
            "TESTE_GENERICO",
            matchesConfiguredTest ? "Teste geral" : "Rolagem livre",
            groups,
            request.Modo,
            0,
            Array.Empty<GameplayModifierDto>(),
            MapRanges(rows),
            true,
            new GameplayActionSnapshotDto
            {
                Tipo = matchesConfiguredTest ? "ROLAGEM_GENERICA" : "ROLAGEM_LIVRE",
                IdSistemaVersao = version.IdSistemaVersao,
                Codigo = matchesConfiguredTest ? "TESTE_GERAL" : "ROLAGEM_LIVRE",
                Nome = matchesConfiguredTest ? "Teste geral" : "Rolagem livre",
                Valores = new Dictionary<string, string>
                {
                    ["dadoTesteGeral"] = general.DadoTesteGeral,
                    ["regraEspecificaPrevalece"] = general.RegraEspecificaPrevalece.ToString(),
                    ["alvo"] = IsOdisseia(version) && rows.Count > 0 ? "4" : string.Empty,
                    ["comparador"] = IsOdisseia(version) && rows.Count > 0 ? ">=" : string.Empty,
                },
            },
            notices));
    }

    private static GameplayOperationResult<GameplayResolvedAction> ResolveAttribute(
        GameplayRollRequestDto request,
        PersonagemJogador? character,
        SistemaVersao version,
        string action)
    {
        if (character is null)
            return Failure("PERSONAGEM_OBRIGATORIO", "Selecione um personagem para o teste.");
        string? attributeCode = NormalizeOptionalCode(request.CodigoAtributo);
        if (attributeCode is null)
            return Failure("ATRIBUTO_OBRIGATORIO", "Selecione um atributo configurado no Sistema.");
        SistemaAtributoGrupo expectedGroup = action == "ATRIBUTO_PRINCIPAL"
            ? SistemaAtributoGrupo.Principal
            : SistemaAtributoGrupo.Secundario;
        SistemaAtributoConfig? attribute = version.Atributos.FirstOrDefault(item =>
            item.Ativo && item.Grupo == expectedGroup && NormalizeCode(item.CodigoAtributo) == attributeCode);
        if (attribute is null)
        {
            if (!IsOdisseia(version))
                return Failure("REGRA_NAO_ESTRUTURADA", "Este atributo não possui regra executável neste Sistema.");
            attribute = new SistemaAtributoConfig
            {
                CodigoAtributo = attributeCode,
                Nome = attributeCode,
                Grupo = expectedGroup,
                ValorMinimo = 1,
                ValorMaximoNatural = 1000,
                ValorMaximoAbsoluto = 1000,
                FormulaTeste = "1D6 + atributo >= 7",
                Ativo = true,
            };
        }
        if (!TryGetAttributeValue(character.StatusJson, expectedGroup.ToString(), attributeCode, out int value))
            return Failure("ATRIBUTO_NAO_ENCONTRADO", "O atributo não foi encontrado nesta ficha.");
        if (value < attribute.ValorMinimo ||
            (attribute.ValorMaximoAbsoluto.HasValue && value > attribute.ValorMaximoAbsoluto.Value))
        {
            return Failure("ATRIBUTO_FORA_LIMITE", "O valor do atributo está fora dos limites publicados pelo Sistema.");
        }
        if (!TryReadConfiguredDice(attribute.ConfiguracaoJson, attribute.FormulaTeste, out int quantity, out int faces))
            return Failure("FORMULA_ATRIBUTO_INVALIDA", "A fórmula de teste deste atributo não é executável.");

        GameplayConfiguredTestRule configured = ReadConfiguredTest(attribute.ConfiguracaoJson);
        (int? configuredTarget, string? configuredComparator) = ReadFormulaDifficulty(
            attribute.FormulaTeste,
            configured);
        string testCode = NormalizeOptionalCode(configured.CodigoTeste) ?? "TESTE_ATRIBUTO";
        bool includeAttribute = configured.IncluiAtributo ??
            (attribute.FormulaTeste?.Contains("atributo", StringComparison.OrdinalIgnoreCase) == true ||
             attribute.FormulaTeste?.Contains(attribute.CodigoAtributo, StringComparison.OrdinalIgnoreCase) == true);
        int modifier = includeAttribute ? value : 0;
        IReadOnlyList<GameplayModifierDto> modifiers = includeAttribute
            ? new[]
            {
                new GameplayModifierDto
                {
                    Codigo = attribute.CodigoAtributo,
                    Nome = attribute.Nome,
                    Valor = value,
                    Origem = "PERSONAGEM",
                },
            }
            : Array.Empty<GameplayModifierDto>();
        List<SistemaResultadoDado> rows = FindResultRows(version, testCode);
        IReadOnlyList<GameplayResolvedResultRange> ranges = rows.Count > 0
            ? MapRanges(rows)
            : BuildFormulaRanges(attribute.FormulaTeste, configured);
        var notices = new List<GameplayExecutionNoticeDto>();
        if (ranges.Count == 0)
        {
            notices.Add(new GameplayExecutionNoticeDto
            {
                Codigo = "TESTE_SEM_FAIXAS",
                Mensagem = "A fórmula foi rolada, mas o Sistema não definiu uma classificação para o resultado.",
                Fallback = false,
            });
        }

        GameplayRollMode mode = configured.Modo ?? request.Modo;
        return GameplayOperationResult<GameplayResolvedAction>.Ok(new GameplayResolvedAction(
            action,
            $"Teste de {attribute.Nome}",
            new[] { new GameplayDiceGroupSpec(quantity, faces) },
            mode,
            modifier,
            modifiers,
            ranges,
            configured.UsaTotalParaFaixas ?? true,
            new GameplayActionSnapshotDto
            {
                Tipo = "ATRIBUTO",
                IdPersonagemJogador = character.IdpersonagemJogador,
                RevisaoPersonagem = character.RevisaoRuntime,
                IdInstancia = attribute.IdSistemaAtributoConfig.ToString(CultureInfo.InvariantCulture),
                IdSistemaVersao = version.IdSistemaVersao,
                Codigo = attribute.CodigoAtributo,
                Nome = attribute.Nome,
                Valores = new Dictionary<string, string>
                {
                    ["codigoTeste"] = testCode,
                    ["grupo"] = expectedGroup.ToString(),
                    ["formula"] = attribute.FormulaTeste ?? string.Empty,
                    ["valorAtributo"] = value.ToString(CultureInfo.InvariantCulture),
                    ["valor"] = value.ToString(CultureInfo.InvariantCulture),
                    ["alvo"] = configuredTarget?.ToString(CultureInfo.InvariantCulture) ??
                        (IsOdisseia(version) ? "7" : string.Empty),
                    ["comparador"] = configuredComparator ?? (IsOdisseia(version) ? ">=" : string.Empty),
                },
            },
            attribute.IdSistemaAtributoConfig == 0 && IsOdisseia(version)
                ? notices.Concat(new[] { Fallback("A versão antiga do Odisseia usa 1D6 + atributo, com sucesso a partir de 7.") }).ToArray()
                : notices));
    }

    private static GameplayOperationResult<GameplayResolvedAction> ResolveExperience(
        SistemaVersao version,
        string action)
    {
        string requestedCode = action[3..];
        string sourceCode = LegacyXpActions.GetValueOrDefault(action) ?? requestedCode;
        SistemaFonteExperiencia? source = version.FontesExperiencia.FirstOrDefault(item =>
            NormalizeCode(item.Codigo) == sourceCode);
        if (source is null)
            return Failure("FONTE_XP_NAO_PUBLICADA", "A fonte de XP não existe na versão publicada do Sistema.");
        GameplayXpRule rule = ReadXpRule(source);
        if (!rule.Executable)
            return Failure("FONTE_XP_NAO_EXECUTAVEL", "A fonte de XP não possui uma fórmula executável.");

        return GameplayOperationResult<GameplayResolvedAction>.Ok(new GameplayResolvedAction(
            $"XP_{NormalizeCode(source.Codigo)}",
            source.Nome,
            rule.FixedValue.HasValue
                ? Array.Empty<GameplayDiceGroupSpec>()
                : new[] { new GameplayDiceGroupSpec(rule.Quantity, rule.Faces) },
            rule.Mode,
            rule.FixedValue ?? 0,
            Array.Empty<GameplayModifierDto>(),
            Array.Empty<GameplayResolvedResultRange>(),
            true,
            new GameplayActionSnapshotDto
            {
                Tipo = "FONTE_XP",
                IdInstancia = source.IdSistemaFonteExperiencia.ToString(CultureInfo.InvariantCulture),
                IdSistemaVersao = version.IdSistemaVersao,
                Codigo = source.Codigo,
                Nome = source.Nome,
                Valores = new Dictionary<string, string>
                {
                    ["formula"] = source.Formula ?? string.Empty,
                    ["tipoTeste"] = source.TipoTeste ?? string.Empty,
                    ["valorMinimo"] = source.ValorMinimo?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                    ["valorMaximo"] = source.ValorMaximo?.ToString(CultureInfo.InvariantCulture) ?? string.Empty,
                },
            },
            Array.Empty<GameplayExecutionNoticeDto>(),
            rule.Transform,
            rule.FixedValue,
            source.ValorMinimo,
            source.ValorMaximo));
    }

    public GameplayOperationResult<GameplayResolvedAction> Resolve(
        GameplayRollRequestDto request,
        PersonagemJogador character,
        SistemaVersao version)
    {
        GameplayActionReferenceDto? reference = request.ReferenciaAcao;
        if (reference is null || string.IsNullOrWhiteSpace(reference.Tipo) ||
            string.IsNullOrWhiteSpace(reference.IdInstancia))
        {
            return Failure("REFERENCIA_ACAO_INVALIDA", "Informe a referência estável da ação da ficha.");
        }

        string type = NormalizeCode(reference.Tipo);
        return type switch
        {
            "ITEM" => ResolveItem(request, character, version, reference),
            "PROTESE" or "PROTESES" => ResolveItem(request, character, version, reference),
            "SKILL" or "SKILLS" => ResolvePower(request, character, version, reference, "SKILL", character.Skills),
            "MAGIA" or "MAGIAS" => ResolvePower(request, character, version, reference, "MAGIA", character.Magia),
            _ => Failure("TIPO_ACAO_NAO_SUPORTADO", "Este tipo de ação da ficha não possui regra executável."),
        };
    }

    private static GameplayOperationResult<GameplayResolvedAction> ResolveItem(
        GameplayRollRequestDto request,
        PersonagemJogador character,
        SistemaVersao version,
        GameplayActionReferenceDto reference)
    {
        JsonObject? item = FindEntry(character.InventarioJson, reference.IdInstancia!)
            ?? FindEntry(character.Implantes, reference.IdInstancia!);
        if (item is null)
            return Failure("ITEM_NAO_ENCONTRADO", "O item não foi encontrado nesta ficha.");

        string itemType = NormalizeCode(ReadString(item, "tipo"));
        bool isWeapon = itemType == "ARMA";
        JsonObject? attributes = GetObject(item, "atributos");
        GameplayStoredTestSpec? test = ReadTestSpec(item, attributes);
        bool appliesTest = ReadBool(item, "aplicaTeste")
            ?? ReadBool(attributes, "aplicaTeste")
            ?? (isWeapon || test is not null);
        if (!appliesTest)
        {
            return Failure("ITEM_NAO_APLICA_TESTE", "Este item não está configurado para aplicar testes.");
        }

        bool isOdisseia = IsOdisseia(version);
        if (test is null && !isWeapon)
        {
            return Failure("ITEM_SEM_TESTE", "Este item precisa de uma especificação de teste para ser rolado.");
        }

        var notices = new List<GameplayExecutionNoticeDto>();
        if (test is null)
        {
            if (!isOdisseia)
            {
                return Failure(
                    "ARMA_SEM_TESTE_CONFIGURADO",
                    "Esta arma precisa de uma especificação de teste definida pelo Sistema ou pelo mestre.");
            }
            test = new GameplayStoredTestSpec
            {
                CodigoTeste = "ATAQUE_COMUM",
                UsaTotalParaFaixas = true,
            };
            notices.Add(Fallback("A arma usa o teste de ataque legado publicado do Odisseia."));
        }

        var modifiers = new List<GameplayModifierDto>();
        var values = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["tipoItem"] = itemType,
            ["quantidadeInventario"] = (ReadInt(item, "quantidade") ?? 1).ToString(CultureInfo.InvariantCulture),
        };
        string actionCode = "USAR_ITEM";
        string displayName = ReadString(item, "nome") ?? "Item";

        if (isWeapon)
        {
            GameplayOperationResult<WeaponContext> weaponResult = ResolveWeaponContext(
                request.ParametrosAcao,
                attributes,
                test,
                displayName);
            if (!weaponResult.Sucesso || weaponResult.Dados is null)
                return ConvertFailure<WeaponContext, GameplayResolvedAction>(weaponResult);

            WeaponContext weapon = weaponResult.Dados;
            actionCode = weapon.ActionCode;
            values["operacao"] = weapon.Operation;
            values["modoArma"] = weapon.Mode;
            values["quantidadeSolicitada"] = weapon.Quantity.ToString(CultureInfo.InvariantCulture);
            if (weapon.Range is not null) values["alcance"] = weapon.Range;
            if (weapon.FireMode is not null) values["modoDisparo"] = weapon.FireMode;
            if (weapon.DamagePerHit.HasValue)
                values["danoPorAcertoProposto"] = weapon.DamagePerHit.Value.ToString(CultureInfo.InvariantCulture);
            if (weapon.StaminaPerUse.HasValue)
                values["estaminaPorUsoProposta"] = weapon.StaminaPerUse.Value.ToString(CultureInfo.InvariantCulture);
            if (weapon.Effects.Count > 0)
                values["efeitosModificadores"] = string.Join(" | ", weapon.Effects);
            if (weapon.AppliedAccessories.Count > 0)
                values["acessoriosAplicados"] = string.Join(" | ", weapon.AppliedAccessories);
            modifiers.AddRange(weapon.Modifiers);
            notices.Add(new GameplayExecutionNoticeDto
            {
                Codigo = "EFEITOS_NAO_APLICADOS",
                Mensagem = "Dano, munição, estamina e efeitos foram registrados como proposta; nenhum estado da ficha foi alterado por esta rolagem.",
                Fallback = false,
            });
        }

        return BuildResolved(
            request,
            character,
            version,
            reference,
            test,
            actionCode,
            displayName,
            NormalizeCode(reference.Tipo) is "PROTESE" or "PROTESES" ? "PROTESE" : "ITEM",
            ReadString(item, "idItemBase"),
            modifiers,
            values,
            notices);
    }

    private static GameplayOperationResult<GameplayResolvedAction> ResolvePower(
        GameplayRollRequestDto request,
        PersonagemJogador character,
        SistemaVersao version,
        GameplayActionReferenceDto reference,
        string type,
        string? sourceJson)
    {
        JsonObject? power = FindEntry(sourceJson, reference.IdInstancia!);
        if (power is null)
            return Failure("PODER_NAO_ENCONTRADO", "A skill ou magia não foi encontrada nesta ficha.");

        JsonObject? attributes = GetObject(power, "atributos");
        GameplayStoredTestSpec? test = ReadTestSpec(power, attributes);
        if (test is null || string.IsNullOrWhiteSpace(test.CodigoTeste))
        {
            return Failure(
                "PODER_SEM_TESTE",
                "Esta skill ou magia não possui uma especificação de teste. Efeitos sem teste continuam narrativos.");
        }

        var values = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["tipoPoder"] = type,
        };
        string? cost = ReadString(power, "custo");
        if (!string.IsNullOrWhiteSpace(cost)) values["custoDeclarado"] = cost;
        int? declaredDamage = ReadInt(attributes, "dano");
        if (declaredDamage.HasValue)
            values["danoProposto"] = declaredDamage.Value.ToString(CultureInfo.InvariantCulture);
        foreach ((string sourceField, string snapshotField) in new[]
        {
            ("custoMana", "custoManaProposto"),
            ("gastoMana", "custoManaProposto"),
            ("custoEstamina", "custoEstaminaProposto"),
            ("gastoEstamina", "custoEstaminaProposto"),
            ("custoVida", "custoVidaProposto"),
        })
        {
            int? configuredCost = ReadInt(attributes, sourceField) ?? ReadInt(power, sourceField);
            if (configuredCost.HasValue && configuredCost.Value > 0 && !values.ContainsKey(snapshotField))
                values[snapshotField] = configuredCost.Value.ToString(CultureInfo.InvariantCulture);
        }
        string? powerBaseId = ReadString(power, "idSkillBase")
            ?? ReadString(power, "idMagiaBase")
            ?? ReadString(power, "idPoderBase");
        if (!string.IsNullOrWhiteSpace(powerBaseId)) values["idPoderBase"] = powerBaseId;

        return BuildResolved(
            request,
            character,
            version,
            reference,
            test,
            type == "SKILL" ? "USAR_SKILL" : "USAR_MAGIA",
            ReadString(power, "nome") ?? type,
            type,
            powerBaseId,
            Array.Empty<GameplayModifierDto>(),
            values,
            new[]
            {
                new GameplayExecutionNoticeDto
                {
                    Codigo = "EFEITO_NAO_APLICADO",
                    Mensagem = "O teste foi executado; custos e efeitos da skill ou magia ainda dependem da aplicação confirmada pelo mestre.",
                    Fallback = false,
                },
            });
    }

    private static GameplayOperationResult<GameplayResolvedAction> BuildResolved(
        GameplayRollRequestDto request,
        PersonagemJogador character,
        SistemaVersao version,
        GameplayActionReferenceDto reference,
        GameplayStoredTestSpec test,
        string actionCode,
        string displayName,
        string sourceType,
        string? itemBaseId,
        IReadOnlyCollection<GameplayModifierDto> actionModifiers,
        IDictionary<string, string> values,
        IReadOnlyCollection<GameplayExecutionNoticeDto> initialNotices)
    {
        string? testCode = NormalizeOptionalCode(test.CodigoTeste);
        if (testCode is null)
            return Failure("TESTE_SEM_CODIGO", "A ação não possui um código de teste configurado.");

        List<SistemaResultadoDado> resultRows = version.ResultadosDado
            .Where(row => NormalizeCode(row.CodigoTeste) == testCode)
            .OrderBy(row => row.Ordem)
            .ToList();
        if (resultRows.Count == 0)
        {
            return Failure(
                "TESTE_NAO_PUBLICADO",
                "O código de teste desta ação não existe na versão publicada da Mesa.");
        }
        if (!TryParseDice(resultRows[0].Dado, out int faces) || resultRows[0].QuantidadeDados is < 1 or > 100 ||
            resultRows.Any(row => !string.Equals(row.Dado, resultRows[0].Dado, StringComparison.OrdinalIgnoreCase) ||
                                  row.QuantidadeDados != resultRows[0].QuantidadeDados))
        {
            return Failure("TESTE_INCONSISTENTE", "A tabela de resultados do teste está inconsistente nesta versão do Sistema.");
        }

        bool isOdisseia = IsOdisseia(version);
        bool? useTotalSetting = test.UsaTotalParaFaixas;
        if (!useTotalSetting.HasValue && !isOdisseia)
        {
            return Failure(
                "RESULTADO_SEM_CRITERIO",
                "A especificação de teste precisa informar se as faixas usam o total ou o dado natural.");
        }
        bool useTotal = useTotalSetting ?? true;
        var notices = initialNotices.ToList();
        if (!useTotalSetting.HasValue)
            notices.Add(Fallback("As faixas deste teste usam o total pelo padrão legado do Odisseia."));

        string? attributeCode = NormalizeOptionalCode(test.CodigoAtributo) ?? NormalizeOptionalCode(request.CodigoAtributo);
        var modifiers = actionModifiers.ToList();
        if (attributeCode is not null)
        {
            if (!TryGetAttributeValue(character.StatusJson, test.GrupoAtributo, attributeCode, out int attributeValue))
            {
                return Failure("ATRIBUTO_NAO_ENCONTRADO", "O atributo escolhido não foi encontrado nesta ficha.");
            }
            modifiers.Add(new GameplayModifierDto
            {
                Codigo = attributeCode,
                Nome = attributeCode,
                Valor = attributeValue,
                Origem = "PERSONAGEM",
            });
            values["atributo"] = attributeCode;
            values["valorAtributo"] = attributeValue.ToString(CultureInfo.InvariantCulture);
        }

        int modifier;
        try
        {
            modifier = checked(modifiers.Sum(item => item.Valor));
        }
        catch (OverflowException)
        {
            return Failure("MODIFICADOR_FORA_LIMITE", "Os modificadores desta ação excedem o limite permitido.");
        }

        GameplayRollMode mode = test.Modo ?? request.Modo;
        if (!Enum.IsDefined(mode))
            return Failure("MODO_INVALIDO", "O modo de rolagem configurado para a ação é inválido.");

        var ranges = resultRows.Select(row => new GameplayResolvedResultRange(
            row.CodigoResultado,
            row.NomeResultado,
            row.ResultadoMinimo,
            row.ResultadoMaximo,
            row.ExigeNatural || IsNaturalOnlyOutcome(row.CodigoResultado),
            IsCritical(row.CodigoResultado),
            IsCriticalFailure(row.CodigoResultado),
            row.EfeitoJson)).ToList();
        values["codigoTeste"] = testCode;
        values["codigoAcao"] = actionCode;
        values["resultadoPor"] = useTotal ? "TOTAL" : "NATURAL";
        values["dado"] = resultRows[0].Dado.ToUpperInvariant();
        values["quantidadeDados"] = resultRows[0].QuantidadeDados.ToString(CultureInfo.InvariantCulture);
        if (!string.IsNullOrWhiteSpace(itemBaseId))
            values[sourceType is "SKILL" or "MAGIA" ? "idPoderBase" : "idItemBase"] = itemBaseId;

        return GameplayOperationResult<GameplayResolvedAction>.Ok(new GameplayResolvedAction(
            actionCode,
            displayName,
            new[] { new GameplayDiceGroupSpec(resultRows[0].QuantidadeDados, faces) },
            mode,
            modifier,
            modifiers,
            ranges,
            useTotal,
            new GameplayActionSnapshotDto
            {
                Tipo = sourceType,
                IdPersonagemJogador = character.IdpersonagemJogador,
                RevisaoPersonagem = character.RevisaoRuntime,
                IdInstancia = reference.IdInstancia,
                // Catalogue ids supplied by the client are intentionally not
                // copied into the ledger. The stable instance id and the
                // server-read snapshot are the authoritative identity here.
                IdItemSistema = sourceType is "ITEM" or "PROTESE" ? TryReadInt(itemBaseId) : null,
                IdPoderSistema = sourceType is "SKILL" or "MAGIA"
                    ? reference.IdPoderSistema ?? TryReadInt(itemBaseId)
                    : null,
                IdSistemaVersao = version.IdSistemaVersao,
                Codigo = testCode,
                Nome = displayName,
                Valores = new Dictionary<string, string>(values),
            },
            notices));
    }

    private static GameplayOperationResult<WeaponContext> ResolveWeaponContext(
        GameplayActionParametersDto? parameters,
        JsonObject? attributes,
        GameplayStoredTestSpec test,
        string weaponName)
    {
        if (attributes is null)
            return Failure<WeaponContext>("ARMA_SEM_ATRIBUTOS", "A arma não possui atributos suficientes para este teste.");

        string mode = GetWeaponMode(attributes);
        if (mode.Length == 0)
        {
            return Failure<WeaponContext>(
                "ARMA_SEM_MODO",
                "Defina se esta arma usa modificadores à distância ou corpo a corpo antes de rolá-la.");
        }
        string operation = NormalizeCode(parameters?.Operacao);
        if (operation.Length == 0) operation = "ATACAR";
        string[] allowedOperations = test.Operacoes?
            .Select(NormalizeCode)
            .Where(value => value.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .ToArray()
            ?? new[] { "ATACAR" };
        if (!allowedOperations.Contains(operation, StringComparer.Ordinal))
        {
            return Failure<WeaponContext>(
                "OPERACAO_NAO_PERMITIDA",
                $"{weaponName} não está configurada para a operação selecionada.");
        }

        int quantity = parameters?.Quantidade ?? 1;
        if (quantity is < 1 or > 100)
            return Failure<WeaponContext>("QUANTIDADE_INVALIDA", "Informe uma quantidade válida para a ação.");

        string? range = null;
        string? fireMode = null;
        string modifierField;
        if (mode == "DISTANCIA")
        {
            string[] allowedRanges = test.Alcances?
                .Select(NormalizeCode)
                .Where(value => value.Length > 0)
                .Distinct(StringComparer.Ordinal)
                .ToArray()
                ?? new[] { "CURTA", "MEDIA", "LONGA" };
            range = NormalizeCode(parameters?.Alcance);
            if (!allowedRanges.Contains(range, StringComparer.Ordinal))
                return Failure<WeaponContext>("ALCANCE_OBRIGATORIO", "Escolha um alcance permitido pela configuração desta arma.");
            int cadence = ReadInt(attributes, "cadencia") ?? ReadInt(attributes, "ataquesPorTurno") ?? 1;
            cadence = Math.Clamp(cadence, 1, 100);
            if (quantity > cadence)
            {
                return Failure<WeaponContext>(
                    "QUANTIDADE_ACIMA_CADENCIA",
                    "A quantidade escolhida excede a cadência configurada para a arma.");
            }
            fireMode = NormalizeCode(parameters?.ModoDisparo);
            if (fireMode.Length == 0) fireMode = quantity > 1 ? "RAJADA" : "TIRO";
            string[] allowedFireModes = test.ModosDisparo?
                .Select(NormalizeCode)
                .Where(value => value.Length > 0)
                .Distinct(StringComparer.Ordinal)
                .ToArray()
                ?? new[] { "TIRO", "RAJADA" };
            if (!allowedFireModes.Contains(fireMode, StringComparer.Ordinal))
                return Failure<WeaponContext>("MODO_DISPARO_INVALIDO", "Escolha um modo de disparo permitido pela configuração desta arma.");
            modifierField = range.ToLowerInvariant();
        }
        else
        {
            if (quantity != 1)
                return Failure<WeaponContext>("QUANTIDADE_NAO_SUPORTADA", "Armas corpo a corpo usam uma ação por rolagem.");
            modifierField = operation == "REVIDAR" ? "revidar" : operation == "ATACAR" ? "ataque" : string.Empty;
        }

        IReadOnlyList<WeaponModifierSource> modifierSources = GetWeaponModifierSources(attributes, mode, weaponName);
        int damageModifier = modifierSources.Sum(source => ReadInt(source.Modifiers, "dano") ?? 0);
        int staminaModifier = modifierSources.Sum(source => ReadInt(source.Modifiers, "estamina") ?? 0);
        var modifiers = string.IsNullOrEmpty(modifierField)
            ? new List<GameplayModifierDto>()
            : modifierSources
                .Select((source, index) => new
                {
                    source,
                    Index = index,
                    Value = ReadInt(source.Modifiers, modifierField) ?? 0,
                })
                .Where(entry => entry.Value != 0)
                .Select(entry => new GameplayModifierDto
                {
                    Codigo = $"{entry.source.Origin}_{modifierField.ToUpperInvariant()}_{entry.Index + 1}",
                    Nome = mode == "DISTANCIA"
                        ? $"{entry.source.Name} · {range!.ToLowerInvariant()} distância"
                        : $"{entry.source.Name} · {operation.ToLowerInvariant()}",
                    Valor = entry.Value,
                    Origem = entry.source.Origin,
                })
                .ToList();

        int? baseDamage = mode == "DISTANCIA"
            ? ReadInt(GetObject(attributes, "danoPorAlcance"), RangeDamageProperty(range!)) ?? ReadInt(attributes, "danoBase")
            : ReadInt(attributes, "danoBase");
        int? damagePerHit = baseDamage.HasValue ? Math.Max(0, baseDamage.Value + damageModifier) : null;
        int? stamina = ReadInt(attributes, "gastoEstaminaPorAtaque");
        int? staminaPerUse = stamina.HasValue ? Math.Max(0, stamina.Value + staminaModifier) : null;
        List<string> effects = modifierSources
            .SelectMany(source => ReadStrings(source.Modifiers, "efeitos"))
            .Distinct(StringComparer.Ordinal)
            .ToList();
        List<string> appliedAccessories = modifierSources
            .Where(source => source.Origin == "ACESSORIO")
            .Select(source => string.IsNullOrWhiteSpace(source.StableId)
                ? source.Name
                : $"{source.StableId}:{source.Name}")
            .ToList();

        return GameplayOperationResult<WeaponContext>.Ok(new WeaponContext(
            mode == "DISTANCIA" ? "ATACAR_COM_ARMA" : operation == "REVIDAR" ? "REVIDAR_COM_ARMA" : "ATACAR_COM_ARMA",
            operation,
            mode,
            range,
            fireMode,
            quantity,
            modifiers,
            damagePerHit,
            staminaPerUse,
            effects,
            appliedAccessories));
    }

    private static IReadOnlyList<WeaponModifierSource> GetWeaponModifierSources(
        JsonObject weapon,
        string mode,
        string weaponName)
    {
        var sources = new List<WeaponModifierSource>();
        JsonObject? baseModifiers = GetObject(weapon, "modificadores");
        if (baseModifiers is not null)
            sources.Add(new WeaponModifierSource(weaponName, "ARMA", null, baseModifiers));
        foreach (JsonObject accessory in GetArray(weapon, "acessorios").OfType<JsonObject>())
        {
            JsonObject? accessoryAttributes = GetObject(accessory, "atributos");
            JsonObject? modifiers = GetObject(accessoryAttributes, "modificadores");
            string compatibility = NormalizeCode(ReadString(accessoryAttributes, "compatibilidade"));
            if (modifiers is null || (compatibility.Length > 0 && compatibility is not "TODAS" && compatibility != mode))
                continue;
            sources.Add(new WeaponModifierSource(
                ReadString(accessory, "nome") ?? "Acessório",
                "ACESSORIO",
                ReadString(accessory, "id") ?? ReadString(accessory, "idItemBase"),
                modifiers));
        }
        return sources;
    }

    private static List<SistemaResultadoDado> FindResultRows(
        SistemaVersao version,
        params string[] testCodes)
    {
        HashSet<string> codes = testCodes
            .Select(NormalizeCode)
            .Where(code => code.Length > 0)
            .ToHashSet(StringComparer.Ordinal);
        return version.ResultadosDado
            .Where(row => codes.Contains(NormalizeCode(row.CodigoTeste)))
            .OrderBy(row => row.Ordem)
            .ToList();
    }

    private static IReadOnlyList<GameplayResolvedResultRange> MapRanges(
        IEnumerable<SistemaResultadoDado> rows)
        => rows.Select(row => new GameplayResolvedResultRange(
            row.CodigoResultado,
            row.NomeResultado,
            row.ResultadoMinimo,
            row.ResultadoMaximo,
            row.ExigeNatural || IsNaturalOnlyOutcome(row.CodigoResultado),
            IsCritical(row.CodigoResultado),
            IsCriticalFailure(row.CodigoResultado),
            row.EfeitoJson)).ToArray();

    private static GameplayConfiguredTestRule ReadConfiguredTest(string? configurationJson)
    {
        if (string.IsNullOrWhiteSpace(configurationJson)) return new GameplayConfiguredTestRule();
        try
        {
            JsonObject? root = JsonNode.Parse(configurationJson) as JsonObject;
            JsonObject? source = GetObject(root, "rolagem") ?? GetObject(root, "teste") ?? root;
            if (source is null) return new GameplayConfiguredTestRule();
            GameplayRollMode? mode = Enum.TryParse(ReadString(source, "modo"), true, out GameplayRollMode parsedMode)
                ? parsedMode
                : null;
            return new GameplayConfiguredTestRule
            {
                CodigoTeste = ReadString(source, "codigoTeste"),
                Dado = ReadString(source, "dado"),
                QuantidadeDados = ReadInt(source, "quantidadeDados") ?? ReadInt(source, "quantidade"),
                Faces = ReadInt(source, "faces"),
                Modo = mode,
                UsaTotalParaFaixas = ReadBool(source, "usaTotalParaFaixas"),
                IncluiAtributo = ReadBool(source, "incluiAtributo"),
                Alvo = ReadInt(source, "alvo"),
                Comparador = ReadString(source, "comparador"),
                ValorFixo = ReadInt(source, "valorFixo"),
                Transformacao = ReadString(source, "transformacao"),
            };
        }
        catch (JsonException)
        {
            return new GameplayConfiguredTestRule();
        }
    }

    private static bool TryReadConfiguredDice(
        string? configurationJson,
        string? formula,
        out int quantity,
        out int faces)
    {
        GameplayConfiguredTestRule configured = ReadConfiguredTest(configurationJson);
        quantity = configured.QuantidadeDados ?? 1;
        faces = configured.Faces ?? 0;
        if (faces == 0 && TryParseDice(configured.Dado, out int configuredFaces))
            faces = configuredFaces;
        if (faces == 0)
        {
            Match match = Regex.Match(
                formula ?? string.Empty,
                @"(?<quantidade>\d*)\s*[dD]\s*(?<faces>\d+)",
                RegexOptions.CultureInvariant);
            if (match.Success)
            {
                quantity = int.TryParse(match.Groups["quantidade"].Value, out int parsedQuantity)
                    ? parsedQuantity
                    : 1;
                faces = int.TryParse(match.Groups["faces"].Value, out int parsedFaces)
                    ? parsedFaces
                    : 0;
            }
        }
        return quantity is >= 1 and <= 100 && faces is >= 2 and <= 1000;
    }

    private static IReadOnlyList<GameplayResolvedResultRange> BuildFormulaRanges(
        string? formula,
        GameplayConfiguredTestRule configured)
    {
        (int? target, string? comparator) = ReadFormulaDifficulty(formula, configured);
        if (!target.HasValue) return Array.Empty<GameplayResolvedResultRange>();

        return comparator switch
        {
            ">" => new[]
            {
                new GameplayResolvedResultRange("FALHA", "Falha", int.MinValue, target.Value, false, false, false),
                new GameplayResolvedResultRange("SUCESSO", "Sucesso", target.Value + 1, int.MaxValue, false, false, false),
            },
            ">=" => new[]
            {
                new GameplayResolvedResultRange("FALHA", "Falha", int.MinValue, target.Value - 1, false, false, false),
                new GameplayResolvedResultRange("SUCESSO", "Sucesso", target.Value, int.MaxValue, false, false, false),
            },
            "<" => new[]
            {
                new GameplayResolvedResultRange("SUCESSO", "Sucesso", int.MinValue, target.Value - 1, false, false, false),
                new GameplayResolvedResultRange("FALHA", "Falha", target.Value, int.MaxValue, false, false, false),
            },
            "<=" => new[]
            {
                new GameplayResolvedResultRange("SUCESSO", "Sucesso", int.MinValue, target.Value, false, false, false),
                new GameplayResolvedResultRange("FALHA", "Falha", target.Value + 1, int.MaxValue, false, false, false),
            },
            _ => Array.Empty<GameplayResolvedResultRange>(),
        };
    }

    private static (int? Target, string? Comparator) ReadFormulaDifficulty(
        string? formula,
        GameplayConfiguredTestRule configured)
    {
        int? target = configured.Alvo;
        string? comparator = configured.Comparador?.Trim();
        if (!target.HasValue)
        {
            Match match = Regex.Match(
                formula ?? string.Empty,
                @"(?:(?<comparador>>=|<=|>|<)\s*(?<alvo>\d+)|(?<texto>maior|menor)\s+(?:ou\s+igual\s+)?(?:que\s+)?(?<alvoTexto>\d+))",
                RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
            if (match.Success)
            {
                target = int.TryParse(match.Groups["alvo"].Value, out int numeric)
                    ? numeric
                    : int.TryParse(match.Groups["alvoTexto"].Value, out int textual) ? textual : null;
                comparator ??= match.Groups["comparador"].Success
                    ? match.Groups["comparador"].Value
                    : string.Equals(match.Groups["texto"].Value, "menor", StringComparison.OrdinalIgnoreCase) ? "<" : ">";
                if (match.Value.Contains("igual", StringComparison.OrdinalIgnoreCase))
                    comparator += "=";
            }
        }
        return (target, comparator);
    }

    private static GameplayXpRule ReadXpRule(SistemaFonteExperiencia source)
    {
        GameplayConfiguredTestRule configured = ReadConfiguredTest(source.ConfiguracaoJson);
        if (configured.ValorFixo.HasValue)
        {
            return new GameplayXpRule(
                true,
                0,
                0,
                GameplayRollMode.Normal,
                configured.ValorFixo,
                NormalizeOptionalCode(configured.Transformacao));
        }
        string formula = source.Formula?.Trim() ?? string.Empty;
        Match fixedMatch = Regex.Match(formula, @"^\+?\s*(?<valor>\d+)\s*(?:XP)?$", RegexOptions.IgnoreCase);
        if (fixedMatch.Success && int.TryParse(fixedMatch.Groups["valor"].Value, out int fixedValue))
            return new GameplayXpRule(true, 0, 0, GameplayRollMode.Normal, fixedValue, null);
        if (!TryReadConfiguredDice(source.ConfiguracaoJson, source.Formula, out int quantity, out int faces))
            return new GameplayXpRule(false, 0, 0, GameplayRollMode.Normal, null, null);

        GameplayRollMode mode = configured.Modo ?? (source.UsaVantagem ? GameplayRollMode.Vantagem : GameplayRollMode.Normal);
        // Fontes legadas do Odisseia descrevem vantagem como "2D4, manter o melhor".
        // O avaliador recebe a quantidade de dados de uma tentativa e gera as duas
        // tentativas da vantagem. Sem esta normalizacao, a formula legada virava
        // quatro dados (dois por tentativa), embora a regra descreva dois no total.
        // Configuracoes estruturadas continuam soberanas e podem declarar pools
        // maiores com vantagem explicitamente.
        bool legacyAdvantagePair = configured.Modo is null &&
            configured.QuantidadeDados is null &&
            source.UsaVantagem &&
            quantity == 2 &&
            (formula.Contains("manter", StringComparison.OrdinalIgnoreCase) ||
             formula.Contains("melhor", StringComparison.OrdinalIgnoreCase) ||
             formula.Contains("maior", StringComparison.OrdinalIgnoreCase));
        if (legacyAdvantagePair)
            quantity = 1;
        string? transform = NormalizeOptionalCode(configured.Transformacao);
        if (transform is null && formula.Contains("ímpar", StringComparison.OrdinalIgnoreCase) &&
            formula.Contains("par", StringComparison.OrdinalIgnoreCase))
        {
            transform = "PARIDADE_1_2";
        }
        return new GameplayXpRule(true, quantity, faces, mode, null, transform);
    }

    private static GameplayStoredTestSpec? ReadTestSpec(JsonObject entry, JsonObject? attributes)
    {
        JsonObject? raw = GetObject(attributes, "teste") ?? GetObject(entry, "teste") ??
            GetObject(attributes, "especificacaoTeste") ?? GetObject(entry, "especificacaoTeste");
        if (raw is null) return null;
        try
        {
            return raw.Deserialize<GameplayStoredTestSpec>(JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static JsonObject? FindEntry(string? source, string id)
    {
        if (string.IsNullOrWhiteSpace(source) || string.IsNullOrWhiteSpace(id)) return null;
        try
        {
            JsonNode? root = JsonNode.Parse(source);
            foreach (JsonObject entry in GetTopLevelEntries(root))
            {
                if (string.Equals(ReadString(entry, "id"), id, StringComparison.Ordinal))
                    return entry;
            }
        }
        catch (JsonException)
        {
            // A malformed legacy blob must not produce a partial client-trusted action.
        }
        return null;
    }

    private static IEnumerable<JsonObject> GetTopLevelEntries(JsonNode? root)
    {
        if (root is JsonArray array)
            return array.OfType<JsonObject>();
        if (root is not JsonObject objectRoot) return Enumerable.Empty<JsonObject>();
        foreach (string property in new[] { "itens", "inventario", "items", "skills", "magias", "poderes" })
        {
            JsonArray? entries = GetArray(objectRoot, property);
            if (entries.Count > 0) return entries.OfType<JsonObject>();
        }
        return Enumerable.Empty<JsonObject>();
    }

    private static bool TryGetAttributeValue(string statusJson, string? group, string code, out int value)
    {
        value = 0;
        try
        {
            JsonObject? root = JsonNode.Parse(statusJson) as JsonObject;
            JsonObject? attributes = GetObject(root, "atributos");
            IEnumerable<string> groups = NormalizeCode(group) switch
            {
                "PRINCIPAL" or "PRINCIPAIS" => new[] { "principais" },
                "SECUNDARIO" or "SECUNDARIOS" => new[] { "secundarios" },
                _ => new[] { "principais", "secundarios" },
            };
            foreach (string currentGroup in groups)
            {
                int? candidate = ReadInt(GetObject(attributes, currentGroup), code);
                if (candidate.HasValue)
                {
                    value = candidate.Value;
                    return true;
                }
            }
        }
        catch (JsonException)
        {
            // Invalid stored JSON behaves as an unavailable attribute.
        }
        return false;
    }

    private static JsonObject? GetObject(JsonObject? source, string property)
        => GetProperty(source, property) as JsonObject;

    private static JsonArray GetArray(JsonObject? source, string property)
        => GetProperty(source, property) as JsonArray ?? new JsonArray();

    private static JsonNode? GetProperty(JsonObject? source, string property)
        => source?.FirstOrDefault(pair => pair.Key.Equals(property, StringComparison.OrdinalIgnoreCase)).Value;

    private static string? ReadString(JsonObject? source, string property)
    {
        JsonNode? node = GetProperty(source, property);
        if (node is not JsonValue value) return null;
        if (value.TryGetValue(out string? text)) return text?.Trim();
        return value.TryGetValue(out int number) ? number.ToString(CultureInfo.InvariantCulture) : null;
    }

    private static int? ReadInt(JsonObject? source, string property)
    {
        JsonNode? node = GetProperty(source, property);
        if (node is not JsonValue value) return null;
        if (value.TryGetValue(out int integer)) return integer;
        if (value.TryGetValue(out double number) && double.IsFinite(number) && Math.Truncate(number) == number &&
            number is >= int.MinValue and <= int.MaxValue) return (int)number;
        return value.TryGetValue(out string? text) && int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsed)
            ? parsed : null;
    }

    private static bool? ReadBool(JsonObject? source, string property)
    {
        JsonNode? node = GetProperty(source, property);
        if (node is not JsonValue value) return null;
        if (value.TryGetValue(out bool result)) return result;
        return value.TryGetValue(out string? text) && bool.TryParse(text, out bool parsed) ? parsed : null;
    }

    private static IEnumerable<string> ReadStrings(JsonObject? source, string property)
        => GetArray(source, property).Select(node =>
            node is JsonValue value && value.TryGetValue(out string? text) ? text?.Trim() : null)
            .Where(value => !string.IsNullOrWhiteSpace(value))!
            .Cast<string>();

    private static string GetWeaponMode(JsonObject attributes)
    {
        string explicitMode = NormalizeCode(ReadString(attributes, "modoModificadores"));
        if (explicitMode is "DISTANCIA" or "CORPO_A_CORPO") return explicitMode;
        string type = ReadString(attributes, "tipoArma") ?? string.Empty;
        if (RangedWeaponTypes.Contains(type)) return "DISTANCIA";
        return string.IsNullOrWhiteSpace(type) ? string.Empty : "CORPO_A_CORPO";
    }

    private static string RangeDamageProperty(string range) => range switch
    {
        "CURTA" => "curta",
        "MEDIA" => "media",
        "LONGA" => "longa",
        _ => "",
    };

    private static bool TryParseDice(string? source, out int faces)
    {
        faces = 0;
        string value = (source ?? string.Empty).Trim().ToUpperInvariant();
        return value.Length > 1 && value[0] == 'D' && int.TryParse(value[1..], out faces) && faces is >= 2 and <= 1000;
    }

    private static bool IsOdisseia(SistemaVersao version)
        => string.Equals(version.SistemaRpg?.Codigo, SistemaRpgConfiguration.CodigoPadrao, StringComparison.OrdinalIgnoreCase);

    private static bool IsCritical(string code)
        => NormalizeCode(code) is "CRITICO" or "ACERTO_CRITICO";

    private static bool IsCriticalFailure(string code)
        => NormalizeCode(code) is "FALHA_CRITICA" or "ERRO_CRITICO";

    private static bool IsNaturalOnlyOutcome(string code)
        => NormalizeCode(code) is
            "CRITICO" or "ACERTO_CRITICO" or
            "FALHA_CRITICA" or "ERRO_CRITICO" or
            "ATAQUE_PRECISO" or "ACERTO_PRECISO" or "PRECISO";

    private static int? TryReadInt(string? source)
        => int.TryParse(source, NumberStyles.Integer, CultureInfo.InvariantCulture, out int value) ? value : null;

    private static string NormalizeCode(string? source)
        => (source ?? string.Empty).Trim().ToUpperInvariant().Replace('-', '_').Replace(' ', '_');

    private static string? NormalizeOptionalCode(string? source)
    {
        string code = NormalizeCode(source);
        return code.Length == 0 ? null : code;
    }

    private static GameplayExecutionNoticeDto Fallback(string message) => new()
    {
        Codigo = "REGRA_FALLBACK_ODISSEIA",
        Mensagem = message,
        Fallback = true,
    };

    private static GameplayOperationResult<TTarget> ConvertFailure<TSource, TTarget>(GameplayOperationResult<TSource> source)
        => GameplayOperationResult<TTarget>.Falha(source.Erro, source.Codigo, source.Mensagem ?? "A ação não pôde ser resolvida.");

    private static GameplayOperationResult<GameplayResolvedAction> Failure(string code, string message)
        => GameplayOperationResult<GameplayResolvedAction>.Falha(GameplayOperationError.RegraNaoPermitida, code, message);

    private static GameplayOperationResult<T> Failure<T>(string code, string message)
        => GameplayOperationResult<T>.Falha(GameplayOperationError.RegraNaoPermitida, code, message);

    private sealed class GameplayStoredTestSpec
    {
        public string? CodigoTeste { get; set; }
        public string? CodigoAtributo { get; set; }
        public string? GrupoAtributo { get; set; }
        public GameplayRollMode? Modo { get; set; }
        public bool? UsaTotalParaFaixas { get; set; }
        public List<string>? Operacoes { get; set; }
        public List<string>? Alcances { get; set; }
        public List<string>? ModosDisparo { get; set; }
    }

    private sealed class GameplayConfiguredTestRule
    {
        public string? CodigoTeste { get; init; }
        public string? Dado { get; init; }
        public int? QuantidadeDados { get; init; }
        public int? Faces { get; init; }
        public GameplayRollMode? Modo { get; init; }
        public bool? UsaTotalParaFaixas { get; init; }
        public bool? IncluiAtributo { get; init; }
        public int? Alvo { get; init; }
        public string? Comparador { get; init; }
        public int? ValorFixo { get; init; }
        public string? Transformacao { get; init; }
    }

    private sealed record GameplayXpRule(
        bool Executable,
        int Quantity,
        int Faces,
        GameplayRollMode Mode,
        int? FixedValue,
        string? Transform);

    private sealed record WeaponModifierSource(
        string Name,
        string Origin,
        string? StableId,
        JsonObject Modifiers);

    private sealed record WeaponContext(
        string ActionCode,
        string Operation,
        string Mode,
        string? Range,
        string? FireMode,
        int Quantity,
        IReadOnlyList<GameplayModifierDto> Modifiers,
        int? DamagePerHit,
        int? StaminaPerUse,
        IReadOnlyList<string> Effects,
        IReadOnlyList<string> AppliedAccessories);
}

public sealed record GameplayResolvedResultRange(
    string Code,
    string Name,
    int Minimum,
    int Maximum,
    bool RequiresNatural,
    bool Critical,
    bool CriticalFailure,
    string? EffectJson = null);

public sealed record GameplayResolvedAction(
    string ActionCode,
    string Name,
    IReadOnlyList<GameplayDiceGroupSpec> Groups,
    GameplayRollMode Mode,
    int Modifier,
    IReadOnlyList<GameplayModifierDto> Modifiers,
    IReadOnlyList<GameplayResolvedResultRange> Ranges,
    bool UseTotalForRanges,
    GameplayActionSnapshotDto Snapshot,
    IReadOnlyList<GameplayExecutionNoticeDto> Notices,
    string? ValueTransform = null,
    int? FixedAssociatedValue = null,
    int? AssociatedMinimum = null,
    int? AssociatedMaximum = null);
