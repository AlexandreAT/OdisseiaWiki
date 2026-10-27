using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.GameRuns.Inventory;

public sealed class OutfitCompatibilityException(string message) : InvalidOperationException(message);

/// <summary>Pairwise, order-independent outfit rules from the run's pinned System version.</summary>
public static class GameRunOutfitCompatibility
{
    private sealed record Archetype(string Path, SistemaItemEscopoDto Scope, string Category);

    public static void Validate(string snapshotJson, SistemaItensConfigDto catalog, string? equippedItemId = null)
    {
        var types = catalog.Tipos.Where(tipo => tipo.Ativo && Code(tipo.Codigo) == "TRAJE");
        var archetypes = types.SelectMany(tipo => tipo.Filhos.Where(categoria => categoria.Ativo)
            .SelectMany(categoria => categoria.Filhos.Where(item => item.Ativo && item.Nivel == SistemaItemEscopoNivel.Arquetipo)
                .Select(item => new Archetype($"{Code(tipo.Codigo)}/{Code(categoria.Codigo)}/{Code(item.Codigo)}", item, Code(categoria.Codigo))))).ToArray();
        var known = catalog.ArquetiposTrajeConhecidos.Concat(catalog.Tipos
            .Where(tipo => Code(tipo.Codigo) == "TRAJE")
            .SelectMany(tipo => tipo.Filhos.SelectMany(categoria => categoria.Filhos
                .Select(item => $"TRAJE/{Code(categoria.Codigo)}/{Code(item.Codigo)}")))).ToArray();
        bool configured = catalog.RegrasTrajeConfiguradas || catalog.Tipos
            .Where(tipo => Code(tipo.Codigo) == "TRAJE")
            .SelectMany(tipo => tipo.Filhos.SelectMany(categoria => categoria.Filhos))
            .Any(item => item.ArquetiposCompativeis is not null);
        if (!configured) return;
        using var document = JsonDocument.Parse(snapshotJson);
        var inventory = GameRunWeaponOrder.InventoryEntries(Property(document.RootElement, "inventario")).ToArray();
        if (equippedItemId is not null && !inventory.Any(item => Text(item, "id") == equippedItemId && Code(Text(item, "tipo")) == "TRAJE")) return;
        var outfits = inventory
            .Where(item => Code(Text(item, "tipo")) == "TRAJE" &&
                !string.IsNullOrWhiteSpace(Text(Property(Property(item, "atributos"), "__vistaExplodida"), "equippedSlot")))
            .Select(item => (Item: item, Archetype: Resolve(item, archetypes, known))).ToArray();
        foreach (var outfit in outfits)
            if (outfit.Archetype is null) throw new OutfitCompatibilityException(
                $"{Name(outfit.Item)}: escolha uma subcategoria de traje válida nesta versão do Sistema.");
        for (int first = 0; first < outfits.Length; first++)
            for (int second = first + 1; second < outfits.Length; second++)
            {
                var a = outfits[first]; var b = outfits[second];
                if (!Allows(a.Archetype!, b.Archetype!) || !Allows(b.Archetype!, a.Archetype!))
                    throw new OutfitCompatibilityException($"{Name(a.Item)} e {Name(b.Item)} não podem ser usados juntos neste Sistema.");
            }
    }

    private static bool Allows(Archetype from, Archetype to) => from.Scope.ArquetiposCompativeis is null ||
        from.Scope.ArquetiposCompativeis.Contains(to.Path, StringComparer.OrdinalIgnoreCase);

    private static Archetype? Resolve(JsonElement item, Archetype[] archetypes, string[] known)
    {
        var attributes = Property(item, "atributos");
        string? explicitCode = Text(attributes, "codigoArquetipo");
        string code = Code(string.IsNullOrWhiteSpace(explicitCode) ? Text(attributes, "tipoTraje") : explicitCode);
        string category = Code(Text(attributes, "codigoCategoria"));
        Archetype[] Find(string value) => archetypes.Where(entry => Code(entry.Scope.Codigo) == value &&
            (category.Length == 0 || category == entry.Category)).ToArray();
        var matches = Find(code);
        // Preserve existing item aliases, but never override an explicitly configured archetype.
        if (matches.Length == 0)
        {
            if (known.Any(path => path.Split('/') is var parts && parts.Length == 3 && Code(parts[2]) == code &&
                (category.Length == 0 || Code(parts[1]) == category))) return null;
            string? legacy = code switch { "VEST" => "COLETE", "TRAJE_COMPLETO" => "TRAJE", "ARMORCORE" => "ARMOR_CORE", _ => null };
            if (legacy is not null) matches = Find(legacy);
        }
        return matches.Length == 1 ? matches[0] : null;
    }

    private static string Name(JsonElement item) => Text(item, "nome") ?? "Traje";
    private static string Code(string? value) => string.IsNullOrWhiteSpace(value) ? "" : SistemaRpgConfiguration.NormalizarCodigo(value, "");
    private static string? Text(JsonElement? element, string name) => Property(element, name) is { ValueKind: JsonValueKind.String } text ? text.GetString() : null;
    private static JsonElement? Property(JsonElement? element, string name)
    {
        if (element is { ValueKind: JsonValueKind.String } serialized)
        {
            using var parsed = JsonDocument.Parse(serialized.GetString()!);
            return Property(parsed.RootElement, name)?.Clone();
        }
        if (element is { ValueKind: JsonValueKind.Object } obj)
            foreach (var property in obj.EnumerateObject())
                if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase)) return property.Value;
        return null;
    }
}
