using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns;

public sealed record GameAttributeResourcePreview(string Recurso, int Antes, int Depois, decimal Percentual);
public sealed record GameAttributeOption(string Codigo, string Nome, string Grupo, int Valor,
    int Limite, string? Descricao, IReadOnlyList<GameAttributeResourcePreview> Recursos);
public sealed record GameAttributeOptions(int Pontos, IReadOnlyList<GameAttributeOption> Atributos);

public static class GameRunAttributes
{
    private static string Normalize(string value) => SistemaRpgConfiguration.NormalizarCodigo(value, string.Empty);
    private static int Number(JsonNode? node) => int.TryParse(node?.ToString(), out int number) ? number : 0;

    // Character creation points belong to the sheet, not to progression in a new run.
    // Keep them only for an effectively unallocated sheet (the racial point alone).
    public static string Prepare(string snapshot)
    {
        JsonObject root = JsonNode.Parse(snapshot)?.AsObject()
            ?? throw new InvalidOperationException("O estado da run está inválido.");
        JsonObject sheet = root["status"]?.AsObject()
            ?? throw new InvalidOperationException("A ficha da run está inválida.");
        int allocated = new[] { "principais", "secundarios" }
            .SelectMany(group => (sheet["atributos"]?[group] as JsonObject)?.Select(pair => pair.Value) ?? [])
            .Sum(Number);
        if (allocated != 1)
        {
            sheet["pontos"] = 0;
            sheet["pontosAtributo"] = 0;
        }
        sheet["pontosIniciaisDisponiveisNaRun"] = allocated == 1;
        return root.ToJsonString();
    }

    public static GameAttributeOptions Options(string snapshot, SistemaVersao version)
    {
        if (!version.Modulos.Any(module => module.TipoModulo == SistemaModuloTipo.Progressao && module.Habilitado))
            return new(0, []);
        JsonNode status = JsonNode.Parse(snapshot)?["status"] ?? throw new InvalidOperationException("Ficha indisponível.");
        var rules = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasProgressao>(version, SistemaModuloTipo.Progressao);
        var options = new List<GameAttributeOption>();
        foreach (SistemaAtributoConfig attribute in version.Atributos.Where(item => item.Ativo &&
            item.Grupo is SistemaAtributoGrupo.Principal or SistemaAtributoGrupo.Secundario).OrderBy(item => item.Ordem))
        {
            string group = attribute.Grupo == SistemaAtributoGrupo.Principal ? "principais" : "secundarios";
            JsonObject? values = status["atributos"]?[group] as JsonObject;
            string code = values?.Select(pair => pair.Key).FirstOrDefault(key => Normalize(key) == Normalize(attribute.CodigoAtributo))
                ?? attribute.CodigoAtributo.ToLowerInvariant();
            int current = values?.ContainsKey(code) == true ? Number(values[code]) : attribute.ValorMinimo;
            current -= GameRunProstheses.AttributeBonus(snapshot, group, code);
            int limit = Math.Min(attribute.ValorMaximoNatural, attribute.ValorMaximoAbsoluto ?? int.MaxValue);
            var resources = (rules.InfluenciasAtributos ?? []).Where(rule => rule is not null && Normalize(rule.CodigoAtributo) == Normalize(attribute.CodigoAtributo))
                .Select(rule =>
                {
                    int before = Number(status["status"]?[rule.Recurso + "Maxima"]);
                    decimal percentage = rule.PercentualPorValor * (current + 1);
                    int after = checked(before + (int)decimal.Floor(before * percentage / 100m));
                    return new GameAttributeResourcePreview(rule.Recurso, before, after, percentage);
                }).ToArray();
            options.Add(new(code, attribute.Nome, group, current, limit, attribute.Descricao, resources));
        }
        int available = checked(Math.Max(0, Number(status["pontos"])) + Math.Max(0, Number(status["pontosAtributo"])));
        // Runs created before the initial-points marker must not expose the character's
        // unused creation pool as a reward. Only explicitly tracked run grants are safe.
        if (status["pontosIniciaisDisponiveisNaRun"] is null)
        {
            int spent = (JsonNode.Parse(snapshot)?["atributosEvoluidos"] as JsonArray)?.Count ?? 0;
            int allocated = new[] { "principais", "secundarios" }
                .SelectMany(group => (status["atributos"]?[group] as JsonObject)?.Select(pair => pair.Value) ?? [])
                .Sum(Number);
            if (allocated - spent != 1)
            {
                int earned = Math.Max(0, Number(status["pontosConcedidosNaRun"]));
                available = Math.Min(available, Math.Max(0, earned - spent));
            }
        }
        return new(available, options);
    }

    public static string Upgrade(string snapshot, SistemaVersao version, string code)
    {
        GameAttributeOptions options = Options(snapshot, version);
        GameAttributeOption attribute = options.Atributos.SingleOrDefault(item => item.Codigo == code)
            ?? throw new InvalidOperationException("O atributo não está ativo na versão do Sistema desta run.");
        if (options.Pontos <= 0) throw new InvalidOperationException("Não há pontos de atributo disponíveis.");
        if (attribute.Valor >= attribute.Limite) throw new InvalidOperationException("O atributo atingiu o limite natural do Sistema.");
        JsonObject root = JsonNode.Parse(snapshot)!.AsObject();
        JsonObject status = root["status"]!.AsObject();
        string pool = Number(status["pontosAtributo"]) > 0 ? "pontosAtributo" : "pontos";
        status[pool] = Number(status[pool]) - 1;
        status["atributos"] ??= new JsonObject();
        status["atributos"]![attribute.Grupo] ??= new JsonObject();
        status["atributos"]![attribute.Grupo]![attribute.Codigo] = attribute.Valor + 1 +
            GameRunProstheses.AttributeBonus(snapshot, attribute.Grupo, attribute.Codigo);
        foreach (GameAttributeResourcePreview resource in attribute.Recursos)
            status["status"]![resource.Recurso + "Maxima"] = resource.Depois;
        JsonArray audit = root["atributosEvoluidos"] as JsonArray ?? [];
        audit.Add(new JsonObject { ["codigo"] = code, ["antes"] = attribute.Valor,
            ["depois"] = attribute.Valor + 1, ["pontosOrigem"] = pool });
        if (audit.Parent is null) root["atributosEvoluidos"] = audit;
        return root.ToJsonString();
    }
}
