using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Inventory;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns;

/// <summary>Reversible passive deltas on the run copy, independent of attack execution.</summary>
public static class GameRunProstheses
{
    public static bool HasTest(JsonElement item)
    {
        if (!item.TryGetProperty("atributos", out var attributes)) return false;
        if (attributes.ValueKind == JsonValueKind.String)
        {
            using var parsed = JsonDocument.Parse(attributes.GetString()!);
            return HasTest(JsonSerializer.SerializeToElement(new { atributos = parsed.RootElement }));
        }
        return attributes.ValueKind == JsonValueKind.Object &&
            (!attributes.TryGetProperty("aplicaTeste", out var enabled) || enabled.ValueKind != JsonValueKind.False) &&
            attributes.TryGetProperty("teste", out var test) && test.ValueKind == JsonValueKind.Object &&
            test.TryGetProperty("codigoTeste", out var code) && !string.IsNullOrWhiteSpace(code.GetString());
    }

    public static void Reconcile(JsonObject root, SistemaVersao version)
    {
        var desired = new JsonObject();
        foreach (var item in GameRunInventory.ReadOrCreate(root, "implantes").OfType<JsonObject>())
        {
            if (item["atributos"] is JsonValue stored && stored.TryGetValue<string>(out var serialized))
                item["atributos"] = JsonNode.Parse(serialized!);
            var attributes = item["atributos"] as JsonObject;
            if (string.IsNullOrWhiteSpace(attributes?["__vistaExplodida"]?["equippedSlot"]?.ToString()) ||
                attributes?["bonus"] is not JsonObject bonuses) continue;
            foreach (var (key, value) in bonuses)
            {
                string code = Normalize(key);
                string? target = code is "VIDA" or "MANA" or "ESTAMINA" ? "recursos/" + code.ToLowerInvariant()
                    : version.Atributos.FirstOrDefault(attribute => attribute.Ativo &&
                        attribute.Grupo is SistemaAtributoGrupo.Principal or SistemaAtributoGrupo.Secundario &&
                        Normalize(attribute.CodigoAtributo) == code) is { } rule
                        ? $"{(rule.Grupo == SistemaAtributoGrupo.Principal ? "principais" : "secundarios")}/{code.ToLowerInvariant()}" : null;
                if (target is not null) desired[target] = checked(Number(desired[target]) + Math.Clamp(Number(value), -1000000, 1000000));
            }
        }
        var previous = root["__runProsthesisBonuses"] as JsonObject ?? new JsonObject();
        if (desired.Count == 0 && previous.Count == 0) return;
        var previousApplied = root["__runProsthesisApplied"] as JsonObject ?? previous;
        var applied = new JsonObject();
        var sheet = root["status"]!.AsObject();
        foreach (string target in desired.Select(pair => pair.Key).Concat(previous.Select(pair => pair.Key)).Distinct())
        {
            string[] parts = target.Split('/');
            if (parts[0] == "recursos")
            {
                var resources = sheet["status"]!.AsObject();
                string maximum = parts[1] + (resources[parts[1] + "Maxima"] is not null ? "Maxima" : "Maximo");
                int currentMax = resources[maximum] is null ? Number(resources[parts[1]]) : Number(resources[maximum]);
                if (root["limitesCondicoes"]?[parts[1]] is JsonObject limit)
                {
                    // Change the unreduced maximum, not the already penalized value.
                    long baseline = (long)Number(limit["base"]) + currentMax - Number(limit["aplicado"]) - Number(previousApplied[target]);
                    long maximumWithBonus = Math.Clamp(baseline + Number(desired[target]), 0, 1000000);
                    applied[target] = maximumWithBonus - baseline;
                    limit["base"] = maximumWithBonus;
                    limit["aplicado"] = currentMax;
                    continue;
                }
                long baseMaximum = (long)currentMax - Number(previousApplied[target]);
                long updatedMaximum = Math.Clamp(baseMaximum + Number(desired[target]), 0, 1000000);
                applied[target] = updatedMaximum - baseMaximum;
                resources[maximum] = updatedMaximum;
                // Increasing a maximum is not healing, including repeated equip/unequip.
                resources[parts[1]] = Math.Min(Number(resources[parts[1]]), Number(resources[maximum]));
            }
            else
            {
                sheet["atributos"] ??= new JsonObject();
                sheet["atributos"]![parts[0]] ??= new JsonObject();
                var values = sheet["atributos"]![parts[0]]!.AsObject();
                string key = values.Select(pair => pair.Key).FirstOrDefault(key => Normalize(key) == Normalize(parts[1])) ?? parts[1];
                long baseline = (long)Number(values[key]) - Number(previousApplied[target]);
                long updated = Math.Clamp(baseline + Number(desired[target]), -1000000, 1000000);
                values[key] = updated;
                applied[target] = updated - baseline;
            }
        }
        root["__runProsthesisBonuses"] = desired;
        root["__runProsthesisApplied"] = applied;
    }

    public static int AttributeBonus(string snapshot, string group, string code)
    {
        var root = JsonNode.Parse(snapshot);
        string target = $"{group}/{Normalize(code).ToLowerInvariant()}";
        return Number(root?["__runProsthesisApplied"]?[target] ?? root?["__runProsthesisBonuses"]?[target]);
    }

    private static string Normalize(string value) => SistemaRpgConfiguration.NormalizarCodigo(value, string.Empty);
    private static int Number(JsonNode? value) => int.TryParse(value?.ToString(), out int number)
        ? number : 0;
}
