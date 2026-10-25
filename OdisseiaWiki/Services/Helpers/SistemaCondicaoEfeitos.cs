using System.Text.Json;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

public sealed record SistemaCondicaoEfeito(string Operacao, string Recurso, int Valor, string Momento);

/// <summary>Reads executable primitives; never interprets narrative descriptions.</summary>
public static class SistemaCondicaoEfeitos
{
    public static string? Image(SistemaCondicao rule)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(rule.ConfiguracaoPadraoJson ?? "{}");
            if (!document.RootElement.TryGetProperty("imagem", out JsonElement image) ||
                image.ValueKind != JsonValueKind.String) return null;
            string? path = image.GetString()?.Trim();
            return path?.Length is > 0 and <= 2048 &&
                (path.StartsWith('/') && !path.StartsWith("//") ||
                 Uri.TryCreate(path, UriKind.Absolute, out Uri? uri) && uri.Scheme is "https" or "http") ? path : null;
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException) { return null; }
    }

    public static bool HasOverride(string? activeSnapshot, int index)
    {
        if (string.IsNullOrWhiteSpace(activeSnapshot)) return false;
        try
        {
            using JsonDocument document = JsonDocument.Parse(activeSnapshot);
            return document.RootElement.TryGetProperty("valoresEfeitos", out JsonElement values) &&
                values.ValueKind == JsonValueKind.Object &&
                values.TryGetProperty(index.ToString(), out _);
        }
        catch (JsonException) { return false; }
    }

    public static bool ValidOverrides(IReadOnlyList<SistemaCondicaoEfeito> effects,
        IReadOnlyDictionary<int, int>? values) => values is null || values.Count <= effects.Count &&
        values.All(pair => pair.Key >= 0 && pair.Key < effects.Count &&
            Valid(effects[pair.Key].Operacao, effects[pair.Key].Recurso, pair.Value,
                effects[pair.Key].Momento));

    public static IReadOnlyList<SistemaCondicaoEfeito> ReadEffective(SistemaCondicao rule,
        string? activeSnapshot)
    {
        IReadOnlyList<SistemaCondicaoEfeito> effects = Read(rule);
        if (string.IsNullOrWhiteSpace(activeSnapshot)) return effects;
        try
        {
            using JsonDocument document = JsonDocument.Parse(activeSnapshot);
            if (!document.RootElement.TryGetProperty("valoresEfeitos", out JsonElement values) ||
                values.ValueKind != JsonValueKind.Object) return effects;
            var overrides = new Dictionary<int, int>();
            foreach (JsonProperty value in values.EnumerateObject())
                if (int.TryParse(value.Name, out int index) && value.Value.TryGetInt32(out int number))
                    overrides[index] = number;
                else return effects;
            if (!ValidOverrides(effects, overrides)) return effects;
            return effects.Select((effect, index) => overrides.TryGetValue(index, out int number)
                ? effect with { Valor = number } : effect).ToArray();
        }
        catch (JsonException) { return effects; }
    }
    public static bool ValidConfiguration(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return true;
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object ||
                !document.RootElement.TryGetProperty("efeitos", out JsonElement entries)) return true;
            if (entries.ValueKind != JsonValueKind.Array || entries.GetArrayLength() > 8) return false;
            foreach (JsonElement entry in entries.EnumerateArray())
            {
                if (entry.ValueKind != JsonValueKind.Object ||
                    !entry.TryGetProperty("operacao", out JsonElement operation) ||
                    !entry.TryGetProperty("recurso", out JsonElement resource) ||
                    !entry.TryGetProperty("momento", out JsonElement moment) ||
                    !entry.TryGetProperty("valor", out JsonElement value) ||
                    !value.TryGetInt32(out int number) ||
                    !Valid(operation.GetString() ?? "", resource.GetString() ?? "", number,
                        moment.GetString() ?? "")) return false;
            }
            return true;
        }
        catch (Exception error) when (error is JsonException or InvalidOperationException) { return false; }
    }

    public static IReadOnlyList<SistemaCondicaoEfeito> Read(SistemaCondicao rule)
    {
        var effects = new List<SistemaCondicaoEfeito>();
        if (!string.IsNullOrWhiteSpace(rule.OperacaoEfeito) &&
            !string.IsNullOrWhiteSpace(rule.CodigoRecurso))
            effects.Add(new(rule.OperacaoEfeito, rule.CodigoRecurso,
                (int)Math.Clamp(decimal.Truncate(rule.ValorPadrao ?? rule.ValorEfeito ?? 0), -1000000, 1000000),
                string.IsNullOrWhiteSpace(rule.MomentoEfeito) &&
                rule.OperacaoEfeito is ("REDUZIR_LIMITE_PERCENTUAL" or "BLOQUEAR_RECUPERACAO")
                    ? "ENQUANTO_ATIVA" : rule.MomentoEfeito ?? ""));
        if (string.IsNullOrWhiteSpace(rule.ConfiguracaoPadraoJson)) return effects;
        try
        {
            using JsonDocument document = JsonDocument.Parse(rule.ConfiguracaoPadraoJson);
            if (!document.RootElement.TryGetProperty("efeitos", out JsonElement entries) ||
                entries.ValueKind != JsonValueKind.Array) return effects;
            foreach (JsonElement entry in entries.EnumerateArray())
            {
                if (entry.ValueKind != JsonValueKind.Object) continue;
                string operation = entry.TryGetProperty("operacao", out JsonElement op) ? op.GetString() ?? "" : "";
                string resource = entry.TryGetProperty("recurso", out JsonElement res) ? res.GetString() ?? "" : "";
                string moment = entry.TryGetProperty("momento", out JsonElement when) ? when.GetString() ?? "" : "";
                int value = entry.TryGetProperty("valor", out JsonElement number) && number.TryGetInt32(out int parsed)
                    ? parsed : 0;
                if (!Valid(operation, resource, value, moment)) continue;
                effects.Add(new(operation.ToUpperInvariant(), resource.ToUpperInvariant(), value,
                    moment.ToUpperInvariant()));
            }
        }
        catch (JsonException) { /* Older narrative configuration is not executable. */ }
        return effects;
    }

    public static bool Valid(string operation, string resource, int value, string moment)
    {
        string op = operation.ToUpperInvariant();
        string when = moment.ToUpperInvariant();
        if (value is < -1000000 or > 1000000 ||
            when is not ("AO_APLICAR" or "INICIO_TURNO" or "FIM_TURNO" or "ENQUANTO_ATIVA")) return false;
        if (op is "MODIFICAR_ROLAGEM" or "MODIFICAR_ATRIBUTO" or "DESVANTAGEM" or "VANTAGEM")
            return when == "ENQUANTO_ATIVA" && (op is not ("MODIFICAR_ROLAGEM" or "MODIFICAR_ATRIBUTO") ||
                !string.IsNullOrWhiteSpace(resource) && resource.Length <= 50 &&
                (op != "MODIFICAR_ATRIBUTO" || !resource.Equals("TODOS", StringComparison.OrdinalIgnoreCase)));
        if (op == "MODIFICAR_DANO")
            return when == "ENQUANTO_ATIVA" && resource.ToUpperInvariant() == "TODOS";
        if (op == "MODIFICAR_DEFESA")
            return when == "ENQUANTO_ATIVA" && resource.ToUpperInvariant() == "ARMADURA";
        if (op == "MODIFICAR_LIMITE_PERCENTUAL")
            return when == "ENQUANTO_ATIVA" && value is >= -100 and <= 1000 &&
                resource.ToUpperInvariant() is ("VIDA" or "MANA" or "ESTAMINA");
        if (op == "PERDER_TURNOS")
            return when == "AO_APLICAR" && resource.ToUpperInvariant() == "TURNO" && value is >= 1 and <= 100;
        return (op is "SUBTRAIR" or "SOMAR" or "DEFINIR" or "REDUZIR_LIMITE_PERCENTUAL" or
            "BLOQUEAR_RECUPERACAO") && (resource.ToUpperInvariant() is "VIDA" or "MANA" or "ESTAMINA") &&
            value >= 0 && (op != "REDUZIR_LIMITE_PERCENTUAL" || value <= 100);
    }
}
