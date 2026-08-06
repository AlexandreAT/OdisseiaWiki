using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgService
{
    private static readonly JsonSerializerOptions PatchJsonOptions = CriarPatchJsonOptions();

    private static readonly string[] ValoresPreservadosMigracao =
    {
        "Vida atual e máxima salva",
        "Mana atual e máxima salva",
        "Estamina atual e máxima salva",
        "XP e nível atuais",
        "Atributos distribuídos",
        "Skills escolhidas",
        "Magias aprendidas",
        "Inventário",
        "Valores explícitos e overrides da Mesa",
    };

    public async Task<SistemaOperacaoResultado<SistemaPatchNoteDto>> ObterPatchNoteAsync(
        int idSistemaVersao)
    {
        SistemaPatchNote? patchNote = await _repository.GetPatchNoteByVersionAsync(idSistemaVersao);
        if (patchNote is null)
            return NaoEncontrado<SistemaPatchNoteDto>("Patch note da versão não encontrado.");

        try
        {
            return SistemaOperacaoResultado<SistemaPatchNoteDto>.Ok(MapearPatchNote(patchNote));
        }
        catch (JsonException ex)
        {
            _logger.LogError(
                ex,
                "Patch note {IdSistemaPatchNote} possui diff estruturado inválido.",
                patchNote.IdSistemaPatchNote);
            return Conflito<SistemaPatchNoteDto>(
                "O patch note existe, mas seu conteúdo estruturado não pôde ser lido.");
        }
    }

    public async Task<SistemaOperacaoResultado<MesaMigracaoPreviewDto>> ObterPreviaMigracaoMesaAsync(
        int idMesa,
        int idSistemaVersaoDestino)
    {
        Mesa? mesa = await _repository.GetMesaForMigrationPreviewAsync(idMesa);
        if (mesa is null)
            return NaoEncontrado<MesaMigracaoPreviewDto>("Mesa não encontrada.");
        if (MesaAcompanhaSistemaPadrao(mesa))
        {
            return Conflito<MesaMigracaoPreviewDto>(
                "A Mesa Padrão acompanha automaticamente a publicação atual do Sistema ODISSEIA e não precisa de migração manual.");
        }

        SistemaVersao? destino = await _repository.GetVersionAsync(
            idSistemaVersaoDestino,
            includeConfiguration: true);
        if (destino is null)
            return NaoEncontrado<MesaMigracaoPreviewDto>("Versão de destino não encontrada.");
        if (destino.Status != SistemaVersaoStatus.Publicado || !destino.SistemaRpg.Ativo)
        {
            return Validacao<MesaMigracaoPreviewDto>(
                "Somente uma versão publicada de um sistema ativo pode ser usada como destino.");
        }
        if (mesa.IdSistemaVersao == idSistemaVersaoDestino)
            return Conflito<MesaMigracaoPreviewDto>("A Mesa já utiliza a versão de destino informada.");

        SistemaVersao? origem = mesa.IdSistemaVersao.HasValue
            ? await _repository.GetVersionAsync(mesa.IdSistemaVersao.Value, includeConfiguration: true)
            : null;

        SistemaPatchNoteDto comparacao = await ObterComparacaoMigracaoAsync(origem, destino);
        List<SistemaMigracaoAvisoDto> avisos = AnalisarDadosMesa(mesa, origem, destino);
        int quantidadeItens = ContarItensInventario(mesa.PersonagensJogadores);

        MesaMigracaoPreviewDto preview = new()
        {
            IdMesa = mesa.Idmesa,
            NomeMesa = mesa.Nome,
            IdSistemaVersaoOrigem = origem?.IdSistemaVersao,
            NumeroVersaoOrigem = origem?.NumeroVersao ?? "LEGACY",
            IdSistemaVersaoDestino = destino.IdSistemaVersao,
            NumeroVersaoDestino = destino.NumeroVersao,
            Comparacao = comparacao,
            ValoresPreservados = ValoresPreservadosMigracao.ToList(),
            ResumoMesa = new SistemaMigracaoResumoMesaDto
            {
                QuantidadePersonagens = mesa.PersonagensJogadores.Count,
                QuantidadeOverrides = mesa.MesaEntidadeConfigs.Count,
                QuantidadeItensInventario = quantidadeItens,
                QuantidadeAvisos = avisos.Count,
                QuantidadeBloqueios = avisos.Count(a => a.Nivel == SistemaMigracaoAvisoNivel.Bloqueio),
            },
            Avisos = avisos,
        };

        return SistemaOperacaoResultado<MesaMigracaoPreviewDto>.Ok(preview);
    }

    private async Task<SistemaPatchNoteDto> ObterComparacaoMigracaoAsync(
        SistemaVersao? origem,
        SistemaVersao destino)
    {
        SistemaPatchNote? persistido = await _repository.GetPatchNoteByVersionAsync(destino.IdSistemaVersao);
        if (persistido is not null && persistido.IdVersaoAnterior == origem?.IdSistemaVersao)
            return MapearPatchNote(persistido);

        return GerarComparacao(
            destino,
            origem,
            DateTime.UtcNow,
            $"Prévia {origem?.NumeroVersao ?? "LEGACY"} → {destino.NumeroVersao}");
    }

    private static SistemaPatchNote CriarPatchNote(
        SistemaVersao novaVersao,
        SistemaVersao? versaoAnterior,
        DateTime dataGeracao)
    {
        SistemaPatchNoteDto dto = GerarComparacao(novaVersao, versaoAnterior, dataGeracao);
        return new SistemaPatchNote
        {
            IdSistemaRpg = novaVersao.IdSistemaRpg,
            IdSistemaVersao = novaVersao.IdSistemaVersao,
            IdVersaoAnterior = versaoAnterior?.IdSistemaVersao,
            CodigoSistema = novaVersao.SistemaRpg.Codigo,
            NomeSistema = novaVersao.SistemaRpg.Nome,
            NumeroVersaoAnterior = versaoAnterior?.NumeroVersao,
            NumeroVersaoNova = novaVersao.NumeroVersao,
            Titulo = dto.Titulo,
            Resumo = dto.Resumo,
            VersaoInicial = dto.VersaoInicial,
            DataGeracao = dataGeracao,
            DiffJson = JsonSerializer.Serialize(dto.Grupos, PatchJsonOptions),
        };
    }

    private static SistemaPatchNoteDto GerarComparacao(
        SistemaVersao novaVersao,
        SistemaVersao? versaoAnterior,
        DateTime dataGeracao,
        string? titulo = null)
    {
        Dictionary<string, JsonNode?> secoesNovas = ObterSecoesCanonicas(novaVersao);
        Dictionary<string, JsonNode?> secoesAnteriores = versaoAnterior is null
            ? new Dictionary<string, JsonNode?>(StringComparer.OrdinalIgnoreCase)
            : ObterSecoesCanonicas(versaoAnterior);
        List<SistemaPatchAlteracaoDto> alteracoes = new();

        foreach (string modulo in secoesNovas.Keys.Union(secoesAnteriores.Keys).OrderBy(k => k))
        {
            secoesAnteriores.TryGetValue(modulo, out JsonNode? anterior);
            secoesNovas.TryGetValue(modulo, out JsonNode? novo);
            CompararNos(modulo, "Configuração", null, "$modulo", anterior, novo, alteracoes);
        }

        List<SistemaPatchGrupoDto> grupos = alteracoes
            .GroupBy(a => a.Modulo)
            .OrderBy(g => g.Key)
            .Select(g => new SistemaPatchGrupoDto
            {
                Modulo = g.Key,
                Titulo = Humanizar(g.Key),
                Impacto = g.Max(a => a.Impacto),
                Alteracoes = g
                    .OrderBy(a => a.Entidade)
                    .ThenBy(a => a.Identidade)
                    .ThenBy(a => a.Campo)
                    .ToList(),
            })
            .ToList();

        bool inicial = versaoAnterior is null;
        string resumo = novaVersao.Changelog?.Trim() ??
            (inicial
                ? $"Versão inicial com {alteracoes.Count} registros estruturados de configuração."
                : $"{alteracoes.Count} alterações distribuídas em {grupos.Count} módulos.");

        return new SistemaPatchNoteDto
        {
            IdSistemaRpg = novaVersao.IdSistemaRpg,
            CodigoSistema = novaVersao.SistemaRpg.Codigo,
            NomeSistema = novaVersao.SistemaRpg.Nome,
            IdVersaoAnterior = versaoAnterior?.IdSistemaVersao,
            NumeroVersaoAnterior = versaoAnterior?.NumeroVersao,
            IdSistemaVersao = novaVersao.IdSistemaVersao,
            NumeroVersaoNova = novaVersao.NumeroVersao,
            DataGeracao = dataGeracao,
            Titulo = titulo ?? (inicial
                ? $"Versão inicial {novaVersao.NumeroVersao}"
                : $"Atualização {novaVersao.NumeroVersao}"),
            Resumo = resumo,
            VersaoInicial = inicial,
            Grupos = grupos,
        };
    }

    private static SistemaPatchNoteDto MapearPatchNote(SistemaPatchNote entity) => new()
    {
        IdSistemaPatchNote = entity.IdSistemaPatchNote,
        IdSistemaRpg = entity.IdSistemaRpg,
        CodigoSistema = entity.CodigoSistema,
        NomeSistema = entity.NomeSistema,
        IdVersaoAnterior = entity.IdVersaoAnterior,
        NumeroVersaoAnterior = entity.NumeroVersaoAnterior,
        IdSistemaVersao = entity.IdSistemaVersao,
        NumeroVersaoNova = entity.NumeroVersaoNova,
        DataGeracao = entity.DataGeracao,
        Titulo = entity.Titulo,
        Resumo = entity.Resumo,
        VersaoInicial = entity.VersaoInicial,
        Grupos = JsonSerializer.Deserialize<List<SistemaPatchGrupoDto>>(
            entity.DiffJson,
            PatchJsonOptions) ?? new List<SistemaPatchGrupoDto>(),
    };

    private static Dictionary<string, JsonNode?> ObterSecoesCanonicas(SistemaVersao versao) =>
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["REGRAS_BASE"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToGeral(versao), PatchJsonOptions)),
            ["CRIACAO"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToCriacao(versao), PatchJsonOptions)),
            ["PROGRESSAO"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToProgressao(versao), PatchJsonOptions)),
            ["EXPLORACAO"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToExploracao(versao), PatchJsonOptions)),
            ["COMBATE"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToCombate(versao), PatchJsonOptions)),
            ["PODERES"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToPoderes(versao), PatchJsonOptions)),
            ["SOBREVIVENCIA"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToSobrevivencia(versao), PatchJsonOptions)),
            ["ITENS"] = NormalizarNo(JsonSerializer.SerializeToNode(
                SistemaRpgMapper.ToItens(versao), PatchJsonOptions)),
        };

    private static JsonNode? NormalizarNo(JsonNode? node, string? nomePropriedade = null)
    {
        if (node is JsonObject objeto)
        {
            JsonObject resultado = new();
            foreach ((string chave, JsonNode? valor) in objeto.OrderBy(p => p.Key))
            {
                if (chave.StartsWith("idSistema", StringComparison.OrdinalIgnoreCase) ||
                    chave.Equals("idEscopoPai", StringComparison.OrdinalIgnoreCase))
                    continue;

                resultado[chave] = NormalizarNo(valor, chave);
            }
            return resultado;
        }

        if (node is JsonArray array)
        {
            JsonArray resultado = new();
            foreach (JsonNode? item in array)
                resultado.Add(NormalizarNo(item));
            return resultado;
        }

        if (node is JsonValue valorJson &&
            nomePropriedade?.Contains("json", StringComparison.OrdinalIgnoreCase) == true &&
            valorJson.TryGetValue(out string? textoJson) &&
            !string.IsNullOrWhiteSpace(textoJson))
        {
            try
            {
                return NormalizarNo(JsonNode.Parse(textoJson));
            }
            catch (JsonException)
            {
                // Texto legado que não é JSON válido continua comparável como string.
            }
        }

        return node?.DeepClone();
    }

    private static void CompararNos(
        string modulo,
        string entidade,
        string? identidade,
        string campo,
        JsonNode? anterior,
        JsonNode? novo,
        List<SistemaPatchAlteracaoDto> alteracoes)
    {
        if (JsonNode.DeepEquals(anterior, novo))
            return;

        if (anterior is null || novo is null)
        {
            AdicionarAlteracao(modulo, entidade, identidade, campo, anterior, novo, alteracoes);
            return;
        }

        if (anterior is JsonObject objetoAnterior && novo is JsonObject objetoNovo)
        {
            foreach (string propriedade in objetoAnterior.Select(p => p.Key)
                         .Union(objetoNovo.Select(p => p.Key))
                         .OrderBy(p => p))
            {
                objetoAnterior.TryGetPropertyValue(propriedade, out JsonNode? valorAnterior);
                objetoNovo.TryGetPropertyValue(propriedade, out JsonNode? valorNovo);
                if (valorAnterior is JsonArray || valorNovo is JsonArray)
                {
                    CompararArrays(
                        modulo,
                        propriedade,
                        valorAnterior as JsonArray,
                        valorNovo as JsonArray,
                        alteracoes);
                    continue;
                }

                CompararNos(
                    modulo,
                    entidade,
                    identidade,
                    campo == "$modulo" ? propriedade : $"{campo}.{propriedade}",
                    valorAnterior,
                    valorNovo,
                    alteracoes);
            }
            return;
        }

        if (anterior is JsonArray || novo is JsonArray)
        {
            CompararArrays(modulo, entidade, anterior as JsonArray, novo as JsonArray, alteracoes);
            return;
        }

        AdicionarAlteracao(modulo, entidade, identidade, campo, anterior, novo, alteracoes);
    }

    private static void CompararArrays(
        string modulo,
        string entidade,
        JsonArray? anterior,
        JsonArray? novo,
        List<SistemaPatchAlteracaoDto> alteracoes)
    {
        anterior ??= new JsonArray();
        novo ??= new JsonArray();
        bool anteriorEhColecaoDeObjetos = anterior.Count == 0 || anterior.All(n => n is JsonObject);
        bool novoEhColecaoDeObjetos = novo.Count == 0 || novo.All(n => n is JsonObject);
        if (!anteriorEhColecaoDeObjetos || !novoEhColecaoDeObjetos)
        {
            if (!JsonNode.DeepEquals(anterior, novo))
                AdicionarAlteracao(modulo, entidade, null, "$colecao", anterior, novo, alteracoes);
            return;
        }

        Dictionary<string, JsonNode?> mapaAnterior = MapearArray(anterior);
        Dictionary<string, JsonNode?> mapaNovo = MapearArray(novo);
        foreach (string chave in mapaAnterior.Keys.Union(mapaNovo.Keys).OrderBy(k => k))
        {
            mapaAnterior.TryGetValue(chave, out JsonNode? itemAnterior);
            mapaNovo.TryGetValue(chave, out JsonNode? itemNovo);
            CompararNos(modulo, entidade, chave, "$entidade", itemAnterior, itemNovo, alteracoes);
        }
    }

    private static Dictionary<string, JsonNode?> MapearArray(JsonArray array)
    {
        Dictionary<string, JsonNode?> mapa = new(StringComparer.OrdinalIgnoreCase);
        for (int indice = 0; indice < array.Count; indice++)
        {
            JsonNode? item = array[indice];
            string chave = ObterIdentidade(item as JsonObject) ?? $"#{indice + 1}";
            string chaveUnica = chave;
            int repeticao = 2;
            while (mapa.ContainsKey(chaveUnica))
                chaveUnica = $"{chave}#{repeticao++}";
            mapa[chaveUnica] = item;
        }
        return mapa;
    }

    private static string? ObterIdentidade(JsonObject? objeto)
    {
        if (objeto is null)
            return null;

        string? codigoTeste = ObterTexto(objeto, "codigoTeste");
        string? codigoResultado = ObterTexto(objeto, "codigoResultado");
        if (codigoTeste is not null && codigoResultado is not null)
        {
            return $"{codigoTeste}:{codigoResultado}:{ObterTexto(objeto, "resultadoMinimo") ?? "-"}-" +
                   (ObterTexto(objeto, "resultadoMaximo") ?? "-");
        }

        foreach (string propriedade in new[]
                 {
                     "codigo", "codigoAtributo", "codigoRaca", "codigoPassiva", "nivel",
                     "tipoModulo", "tipo", "nome", "nomeRaca", "ordem",
                 })
        {
            string? valor = ObterTexto(objeto, propriedade);
            if (!string.IsNullOrWhiteSpace(valor))
                return valor;
        }

        return null;
    }

    private static string? ObterTexto(JsonObject objeto, string propriedade)
    {
        KeyValuePair<string, JsonNode?> item = objeto.FirstOrDefault(p =>
            p.Key.Equals(propriedade, StringComparison.OrdinalIgnoreCase));
        if (item.Key is null || item.Value is null)
            return null;
        return item.Value is JsonValue value && value.TryGetValue(out string? texto)
            ? texto
            : item.Value.ToJsonString(PatchJsonOptions).Trim('"');
    }

    private static void AdicionarAlteracao(
        string modulo,
        string entidade,
        string? identidade,
        string campo,
        JsonNode? anterior,
        JsonNode? novo,
        List<SistemaPatchAlteracaoDto> alteracoes)
    {
        SistemaPatchAlteracaoTipo tipo = anterior is null
            ? SistemaPatchAlteracaoTipo.Adicionado
            : novo is null
                ? SistemaPatchAlteracaoTipo.Removido
                : SistemaPatchAlteracaoTipo.Alterado;
        SistemaPatchImpacto impacto = CalcularImpacto(tipo, modulo, entidade, campo);
        alteracoes.Add(new SistemaPatchAlteracaoDto
        {
            Modulo = modulo,
            Entidade = entidade,
            Identidade = identidade,
            Campo = campo,
            ValorAnterior = ParaElemento(anterior),
            ValorNovo = ParaElemento(novo),
            Tipo = tipo,
            Impacto = impacto,
            Descricao = $"{Humanizar(entidade)}{(identidade is null ? string.Empty : $" {identidade}")}: " +
                        $"{Humanizar(campo)} {tipo.ToString().ToLowerInvariant()}.",
        });
    }

    private static SistemaPatchImpacto CalcularImpacto(
        SistemaPatchAlteracaoTipo tipo,
        string modulo,
        string entidade,
        string campo)
    {
        string contexto = NormalizarCodigo($"{modulo} {entidade} {campo}");
        if (tipo == SistemaPatchAlteracaoTipo.Removido &&
            (contexto.Contains("atribut") || contexto.Contains("recurso") ||
             contexto.Contains("condico") || contexto.Contains("tiposdano") ||
             contexto.Contains("tiposdefesa") || contexto.Contains("raca")))
            return SistemaPatchImpacto.Critico;

        if (contexto.Contains("nivelmaximo") || contexto.Contains("xp") ||
            contexto.Contains("limite") || contexto.Contains("valormaximo") ||
            contexto.Contains("marco") || contexto.Contains("jogavel"))
            return SistemaPatchImpacto.Alto;

        if (contexto.Contains("descricao") || contexto.Contains("observ") ||
            contexto.EndsWith("ordem", StringComparison.Ordinal))
            return SistemaPatchImpacto.Baixo;

        return tipo == SistemaPatchAlteracaoTipo.Adicionado
            ? SistemaPatchImpacto.Medio
            : SistemaPatchImpacto.Medio;
    }

    private static JsonElement? ParaElemento(JsonNode? node)
    {
        if (node is null)
            return null;
        using JsonDocument document = JsonDocument.Parse(node.ToJsonString(PatchJsonOptions));
        return document.RootElement.Clone();
    }

    private static List<SistemaMigracaoAvisoDto> AnalisarDadosMesa(
        Mesa mesa,
        SistemaVersao? origem,
        SistemaVersao destino)
    {
        List<SistemaMigracaoAvisoDto> avisos = new();
        if (origem is null)
        {
            AdicionarAviso(
                avisos,
                "ORIGEM_LEGACY",
                SistemaMigracaoAvisoNivel.Atencao,
                "Fallback",
                "A Mesa não possui versão explícita; a comparação parte do fallback legado.");
        }

        HashSet<int> racasDestino = destino.Racas
            .Where(r => r.IdRaca.HasValue && r.Jogavel)
            .Select(r => r.IdRaca!.Value)
            .ToHashSet();
        int racasIncompativeis = mesa.PersonagensJogadores.Count(p => !racasDestino.Contains(p.Idraca));
        if (racasIncompativeis > 0)
        {
            AdicionarAviso(
                avisos,
                "RACAS_INCOMPATIVEIS",
                SistemaMigracaoAvisoNivel.Atencao,
                "Raças",
                $"{racasIncompativeis} personagem(ns) usam raça sem configuração jogável no destino; o fallback racial será necessário.",
                quantidade: racasIncompativeis);
        }

        int limiteSkills = destino.SkillConfig?.MaximoSkills ?? int.MaxValue;
        int nivelMaximoSkill = destino.SkillConfig?.NivelMaximoSkill ?? int.MaxValue;
        int limiteMagias = destino.SkillConfig?.MaximoMagias ??
            SistemaRpgMapper.ToPoderes(destino).LimiteMagias;
        int nivelMaximo = SistemaRpgMapper.ToProgressao(destino).NivelMaximo;
        int personagensSkillsAcima = 0;
        int personagensNivelSkillAcima = 0;
        int personagensMagiasAcima = 0;
        int personagensNivelAcima = 0;
        int jsonsInvalidos = 0;
        int condicoesRemovidasEmUso = 0;
        int valoresAcimaReferencia = 0;
        int atributosRemovidosEmUso = 0;

        HashSet<string> condicoesDestino = destino.Condicoes
            .SelectMany(c => new[] { NormalizarCodigo(c.Codigo), NormalizarCodigo(c.Nome) })
            .ToHashSet();
        HashSet<string> atributosDestino = destino.Atributos
            .Where(a => a.Ativo)
            .Select(a => NormalizarCodigo(a.CodigoAtributo))
            .ToHashSet();

        foreach (PersonagemJogador personagem in mesa.PersonagensJogadores)
        {
            JsonArray? skills = TentarLerArray(personagem.Skills, ref jsonsInvalidos);
            if (skills?.Count > limiteSkills)
                personagensSkillsAcima++;
            if (skills is not null && skills.Any(s => ObterInteiro(s, "nivel") > nivelMaximoSkill))
                personagensNivelSkillAcima++;

            JsonArray? magias = TentarLerArray(personagem.Magia, ref jsonsInvalidos);
            if (magias?.Count > limiteMagias)
                personagensMagiasAcima++;

            JsonNode? status = TentarLerJson(personagem.StatusJson, ref jsonsInvalidos);
            if (status is null)
                continue;

            if (ObterInteiro(status, "nivel") > nivelMaximo)
                personagensNivelAcima++;

            List<string> condicoesSalvas = ObterStrings(status, "condicoes").ToList();
            if (condicoesSalvas.Count == 0 && origem is not null)
            {
                string statusNormalizado = NormalizarCodigo(personagem.StatusJson);
                condicoesSalvas.AddRange(origem.Condicoes
                    .Where(condicao =>
                        statusNormalizado.Contains(NormalizarCodigo(condicao.Codigo)) ||
                        statusNormalizado.Contains(NormalizarCodigo(condicao.Nome)))
                    .Select(condicao => condicao.Codigo));
            }

            foreach (string condicao in condicoesSalvas)
            {
                if (!condicoesDestino.Contains(NormalizarCodigo(condicao)))
                    condicoesRemovidasEmUso++;
            }

            JsonObject? atributosSalvos = EncontrarObjeto(status, "atributos");
            if (atributosSalvos is not null)
            {
                Dictionary<string, decimal> valores = ObterNumerosRecursivos(atributosSalvos);
                atributosRemovidosEmUso += valores.Keys.Count(codigo => !atributosDestino.Contains(codigo));
                foreach (SistemaAtributoConfig atributo in destino.Atributos.Where(a => a.Ativo))
                {
                    string codigo = NormalizarCodigo(atributo.CodigoAtributo);
                    if (valores.TryGetValue(codigo, out decimal valor) &&
                        valor > (atributo.ValorMaximoAbsoluto ?? atributo.ValorMaximoNatural))
                        valoresAcimaReferencia++;
                }
            }

            foreach (SistemaRecursoConfig recurso in destino.Recursos.Where(r => r.Ativo && r.ValorMaximo.HasValue))
            {
                decimal? valor = EncontrarNumero(
                    status,
                    $"{recurso.Codigo}Maxima",
                    $"{recurso.Codigo}Maximo",
                    recurso.Codigo);
                if (valor > recurso.ValorMaximo)
                    valoresAcimaReferencia++;
            }
        }

        AdicionarAvisoContagem(avisos, personagensSkillsAcima, "SKILLS_ACIMA_LIMITE", "Poderes",
            "personagem(ns) possuem mais skills que o limite da versão de destino");
        AdicionarAvisoContagem(avisos, personagensNivelSkillAcima, "SKILLS_NIVEL_ACIMA", "Poderes",
            "personagem(ns) possuem skill acima do nível máximo da versão de destino");
        AdicionarAvisoContagem(avisos, personagensMagiasAcima, "MAGIAS_ACIMA_LIMITE", "Poderes",
            "personagem(ns) possuem mais magias que o limite da versão de destino");
        AdicionarAvisoContagem(avisos, personagensNivelAcima, "NIVEL_ACIMA_LIMITE", "Progressão",
            "personagem(ns) possuem nível salvo acima do máximo da versão de destino");
        AdicionarAvisoContagem(avisos, condicoesRemovidasEmUso, "CONDICOES_REMOVIDAS_EM_USO", "Condições",
            "condição(ões) salvas não existem na versão de destino");
        AdicionarAvisoContagem(avisos, atributosRemovidosEmUso, "ATRIBUTOS_REMOVIDOS_EM_USO", "Atributos",
            "atributo(s) salvo(s) não existem na versão de destino");
        AdicionarAvisoContagem(avisos, valoresAcimaReferencia, "VALORES_ACIMA_REFERENCIA", "Valores",
            "valor(es) explícito(s) ultrapassam a nova referência; serão preservados");

        AnalisarInventarios(mesa.PersonagensJogadores, destino, avisos, ref jsonsInvalidos);
        AnalisarOverrides(mesa.MesaEntidadeConfigs, origem, destino, avisos, ref jsonsInvalidos);
        AdicionarAvisoContagem(avisos, jsonsInvalidos, "JSON_LEGADO_INVALIDO", "Compatibilidade",
            "estrutura(s) JSON não puderam ser analisadas integralmente");

        return avisos;
    }

    private static void AnalisarInventarios(
        IEnumerable<PersonagemJogador> personagens,
        SistemaVersao destino,
        List<SistemaMigracaoAvisoDto> avisos,
        ref int jsonsInvalidos)
    {
        HashSet<string> arquetiposDestino = ObterArquetiposDestino(destino);
        int itensSemArquetipo = 0;
        int itensIncompativeis = 0;
        int totalItens = 0;

        foreach (PersonagemJogador personagem in personagens)
        {
            JsonArray? inventario = TentarLerArray(personagem.InventarioJson, ref jsonsInvalidos);
            if (inventario is null)
                continue;
            totalItens += inventario.Count;
            foreach (JsonNode? item in inventario)
            {
                string? arquetipo = EncontrarTexto(item, "codigoArquetipo", "arquetipo", "tipoArma", "subtipo");
                if (string.IsNullOrWhiteSpace(arquetipo))
                    itensSemArquetipo++;
                else if (arquetiposDestino.Count > 0 && !arquetiposDestino.Contains(NormalizarCodigo(arquetipo)))
                    itensIncompativeis++;
            }
        }

        AdicionarAvisoContagem(avisos, itensSemArquetipo, "ITENS_SEM_ARQUETIPO", "Itens",
            "item(ns) do inventário não informam arquétipo compatível");
        AdicionarAvisoContagem(avisos, itensIncompativeis, "ITENS_ARQUETIPO_INCOMPATIVEL", "Itens",
            "item(ns) usam arquétipo ausente na versão de destino");
        if (totalItens > 0 && arquetiposDestino.Count == 0)
        {
            AdicionarAviso(
                avisos,
                "CATALOGO_ITENS_FALLBACK",
                SistemaMigracaoAvisoNivel.Informacao,
                "Fallback",
                "A versão de destino não expõe catálogo de arquétipos analisável; itens manterão os valores salvos e usarão fallback.");
        }
    }

    private static void AnalisarOverrides(
        IEnumerable<MesaEntidadeConfig> overrides,
        SistemaVersao? origem,
        SistemaVersao destino,
        List<SistemaMigracaoAvisoDto> avisos,
        ref int jsonsInvalidos)
    {
        HashSet<string> referenciasRemovidas = ObterReferenciasRemovidas(origem, destino);
        HashSet<int> racasDestino = destino.Racas
            .Where(r => r.IdRaca.HasValue)
            .Select(r => r.IdRaca!.Value)
            .ToHashSet();
        int incompatibilidades = 0;

        foreach (MesaEntidadeConfig config in overrides)
        {
            JsonNode? json = TentarLerJson(config.ConfigJson, ref jsonsInvalidos);
            if (json is null)
                continue;

            if (config.TipoEntidade == MesaEntidadeTipo.Raca &&
                (!int.TryParse(config.Identidade, out int idRaca) || !racasDestino.Contains(idRaca)))
                incompatibilidades++;

            string normalizado = NormalizarCodigo(json.ToJsonString(PatchJsonOptions));
            if (referenciasRemovidas.Any(normalizado.Contains))
                incompatibilidades++;
        }

        AdicionarAvisoContagem(avisos, incompatibilidades, "OVERRIDES_INCOMPATIVEIS", "Overrides",
            "override(s) referenciam configuração ausente na versão de destino; serão preservados sem reescrita");
    }

    private static HashSet<string> ObterReferenciasRemovidas(
        SistemaVersao? origem,
        SistemaVersao destino)
    {
        if (origem is null)
            return new HashSet<string>();

        IEnumerable<string> origemCodigos = origem.Atributos.Select(a => a.CodigoAtributo)
            .Concat(origem.Recursos.Select(r => r.Codigo))
            .Concat(origem.Condicoes.Select(c => c.Codigo))
            .Concat(origem.TiposDano.Select(t => t.Codigo))
            .Concat(origem.TiposDefesa.Select(t => t.Codigo));
        HashSet<string> destinoCodigos = destino.Atributos.Select(a => a.CodigoAtributo)
            .Concat(destino.Recursos.Select(r => r.Codigo))
            .Concat(destino.Condicoes.Select(c => c.Codigo))
            .Concat(destino.TiposDano.Select(t => t.Codigo))
            .Concat(destino.TiposDefesa.Select(t => t.Codigo))
            .Select(NormalizarCodigo)
            .ToHashSet();
        return origemCodigos
            .Select(NormalizarCodigo)
            .Where(c => c.Length > 2 && !destinoCodigos.Contains(c))
            .ToHashSet();
    }

    private static HashSet<string> ObterArquetiposDestino(SistemaVersao destino)
    {
        HashSet<string> arquetipos = destino.ItemEscopos
            .Where(item => item.Ativo && item.Nivel == SistemaItemEscopoNivel.Arquetipo)
            .SelectMany(item => new[]
            {
                NormalizarCodigo(item.Codigo),
                NormalizarCodigo(item.CodigoCaminho),
            })
            .Where(codigo => codigo.Length > 0)
            .ToHashSet();
        foreach (SistemaModulo modulo in destino.Modulos.Where(m =>
                     m.TipoModulo == SistemaModuloTipo.Equipamentos &&
                     !string.IsNullOrWhiteSpace(m.ConfiguracaoJson)))
        {
            try
            {
                JsonNode? json = JsonNode.Parse(modulo.ConfiguracaoJson!);
                ColetarValoresCatalogo(json, arquetipos, false);
            }
            catch (JsonException)
            {
                // O warning de fallback será emitido se nenhum catálogo puder ser lido.
            }
        }
        return arquetipos;
    }

    private static void ColetarValoresCatalogo(
        JsonNode? node,
        HashSet<string> valores,
        bool dentroCatalogo)
    {
        if (node is JsonObject objeto)
        {
            foreach ((string chave, JsonNode? valor) in objeto)
            {
                bool catalogo = dentroCatalogo ||
                    chave.Contains("arquetip", StringComparison.OrdinalIgnoreCase) ||
                    chave.Contains("categoria", StringComparison.OrdinalIgnoreCase);
                if (catalogo && valor is JsonValue jsonValue && jsonValue.TryGetValue(out string? texto))
                    valores.Add(NormalizarCodigo(texto ?? string.Empty));
                ColetarValoresCatalogo(valor, valores, catalogo);
            }
        }
        else if (node is JsonArray array)
        {
            foreach (JsonNode? item in array)
                ColetarValoresCatalogo(item, valores, dentroCatalogo);
        }
        else if (dentroCatalogo && node is JsonValue valor && valor.TryGetValue(out string? texto))
        {
            valores.Add(NormalizarCodigo(texto ?? string.Empty));
        }
    }

    private static int ContarItensInventario(IEnumerable<PersonagemJogador> personagens)
    {
        int total = 0;
        foreach (PersonagemJogador personagem in personagens)
        {
            try
            {
                if (JsonNode.Parse(personagem.InventarioJson ?? "null") is JsonArray itens)
                    total += itens.Count;
            }
            catch (JsonException)
            {
                // A análise principal já informa JSON legado inválido.
            }
        }
        return total;
    }

    private static JsonArray? TentarLerArray(string? json, ref int invalidos)
    {
        JsonNode? node = TentarLerJson(json, ref invalidos);
        if (node is null)
            return null;
        if (node is JsonArray array)
            return array;
        invalidos++;
        return null;
    }

    private static JsonNode? TentarLerJson(string? json, ref int invalidos)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;
        try
        {
            return JsonNode.Parse(json);
        }
        catch (JsonException)
        {
            invalidos++;
            return null;
        }
    }

    private static int ObterInteiro(JsonNode? node, string propriedade)
    {
        decimal? valor = EncontrarNumero(node, propriedade);
        return valor.HasValue ? decimal.ToInt32(decimal.Truncate(valor.Value)) : 0;
    }

    private static decimal? EncontrarNumero(JsonNode? node, params string[] propriedades)
    {
        HashSet<string> procuradas = propriedades.Select(NormalizarCodigo).ToHashSet();
        return EncontrarNumeroInterno(node, procuradas);
    }

    private static decimal? EncontrarNumeroInterno(JsonNode? node, HashSet<string> propriedades)
    {
        if (node is JsonObject objeto)
        {
            foreach ((string chave, JsonNode? valor) in objeto)
            {
                if (propriedades.Contains(NormalizarCodigo(chave)) &&
                    valor is JsonValue jsonValue &&
                    jsonValue.TryGetValue(out decimal numero))
                    return numero;
            }
            foreach (JsonNode? valor in objeto.Select(p => p.Value))
            {
                decimal? encontrado = EncontrarNumeroInterno(valor, propriedades);
                if (encontrado.HasValue)
                    return encontrado;
            }
        }
        else if (node is JsonArray array)
        {
            foreach (JsonNode? item in array)
            {
                decimal? encontrado = EncontrarNumeroInterno(item, propriedades);
                if (encontrado.HasValue)
                    return encontrado;
            }
        }
        return null;
    }

    private static string? EncontrarTexto(JsonNode? node, params string[] propriedades)
    {
        HashSet<string> procuradas = propriedades.Select(NormalizarCodigo).ToHashSet();
        if (node is JsonObject objeto)
        {
            foreach ((string chave, JsonNode? valor) in objeto)
            {
                if (procuradas.Contains(NormalizarCodigo(chave)) &&
                    valor is JsonValue jsonValue &&
                    jsonValue.TryGetValue(out string? texto))
                    return texto;
            }
            foreach (JsonNode? valor in objeto.Select(p => p.Value))
            {
                string? encontrado = EncontrarTexto(valor, propriedades);
                if (encontrado is not null)
                    return encontrado;
            }
        }
        return null;
    }

    private static JsonObject? EncontrarObjeto(JsonNode? node, string propriedade)
    {
        if (node is not JsonObject objeto)
            return null;
        foreach ((string chave, JsonNode? valor) in objeto)
        {
            if (chave.Equals(propriedade, StringComparison.OrdinalIgnoreCase) && valor is JsonObject encontrado)
                return encontrado;
            JsonObject? recursivo = EncontrarObjeto(valor, propriedade);
            if (recursivo is not null)
                return recursivo;
        }
        return null;
    }

    private static IEnumerable<string> ObterStrings(JsonNode node, string propriedade)
    {
        using JsonDocument document = JsonDocument.Parse(node.ToJsonString(PatchJsonOptions));
        List<string> resultado = new();
        ColetarStrings(document.RootElement, propriedade, resultado);
        return resultado;
    }

    private static void ColetarStrings(
        JsonElement element,
        string propriedade,
        List<string> resultado)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (property.Name.Equals(propriedade, StringComparison.OrdinalIgnoreCase) &&
                    property.Value.ValueKind == JsonValueKind.Array)
                {
                    foreach (JsonElement item in property.Value.EnumerateArray())
                    {
                        if (item.ValueKind == JsonValueKind.String)
                        {
                            string? texto = item.GetString();
                            if (!string.IsNullOrWhiteSpace(texto))
                                resultado.Add(texto);
                        }
                        else if (item.ValueKind == JsonValueKind.Object)
                        {
                            JsonProperty? identificador = item.EnumerateObject().FirstOrDefault(p =>
                                p.Name.Equals("codigo", StringComparison.OrdinalIgnoreCase) ||
                                p.Name.Equals("nome", StringComparison.OrdinalIgnoreCase));
                            if (identificador?.Value.ValueKind == JsonValueKind.String)
                                resultado.Add(identificador.Value.Value.GetString()!);
                        }
                    }
                }
                else
                {
                    ColetarStrings(property.Value, propriedade, resultado);
                }
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement item in element.EnumerateArray())
                ColetarStrings(item, propriedade, resultado);
        }
    }

    private static Dictionary<string, decimal> ObterNumerosRecursivos(JsonNode node)
    {
        Dictionary<string, decimal> resultado = new();
        if (node is JsonObject objeto)
        {
            foreach ((string chave, JsonNode? valor) in objeto)
            {
                if (valor is JsonValue jsonValue && jsonValue.TryGetValue(out decimal numero))
                    resultado[NormalizarCodigo(chave)] = numero;
                else if (valor is not null)
                {
                    foreach ((string codigo, decimal numeroFilho) in ObterNumerosRecursivos(valor))
                        resultado[codigo] = numeroFilho;
                }
            }
        }
        return resultado;
    }

    private static void AdicionarAvisoContagem(
        List<SistemaMigracaoAvisoDto> avisos,
        int quantidade,
        string codigo,
        string categoria,
        string mensagem)
    {
        if (quantidade <= 0)
            return;
        AdicionarAviso(
            avisos,
            codigo,
            SistemaMigracaoAvisoNivel.Atencao,
            categoria,
            $"{quantidade} {mensagem}.",
            quantidade: quantidade);
    }

    private static void AdicionarAviso(
        List<SistemaMigracaoAvisoDto> avisos,
        string codigo,
        SistemaMigracaoAvisoNivel nivel,
        string categoria,
        string mensagem,
        string? entidade = null,
        string? identidade = null,
        int quantidade = 1) => avisos.Add(new SistemaMigracaoAvisoDto
        {
            Codigo = codigo,
            Nivel = nivel,
            Categoria = categoria,
            Mensagem = mensagem,
            Entidade = entidade,
            Identidade = identidade,
            Quantidade = quantidade,
        });

    private static string Humanizar(string valor)
    {
        if (valor.StartsWith('$'))
            valor = valor[1..];
        valor = valor.Replace('_', ' ').Replace('.', ' ');
        StringBuilder resultado = new();
        for (int i = 0; i < valor.Length; i++)
        {
            char atual = valor[i];
            if (i > 0 && char.IsUpper(atual) && char.IsLower(valor[i - 1]))
                resultado.Append(' ');
            resultado.Append(atual);
        }
        string texto = resultado.ToString().Trim().ToLowerInvariant();
        return texto.Length == 0 ? "Configuração" : char.ToUpperInvariant(texto[0]) + texto[1..];
    }

    private static string NormalizarCodigo(string valor)
    {
        string decomposed = valor.Normalize(NormalizationForm.FormD);
        StringBuilder builder = new();
        foreach (char c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
                continue;
            if (char.IsLetterOrDigit(c))
                builder.Append(char.ToLowerInvariant(c));
        }
        return builder.ToString();
    }

    private static JsonSerializerOptions CriarPatchJsonOptions()
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false,
        };
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }
}
