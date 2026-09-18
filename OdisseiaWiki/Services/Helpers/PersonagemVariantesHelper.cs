using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Services.Helpers;

public static class PersonagemVariantesHelper
{
    // Keep the first sheet in the existing fields for catalogs and legacy consumers.
    public static string? ValidateAndNormalize(PersonagemDto dto)
    {
        var root = dto.StatusJson;
        if (root is null) return null;
        if (!root.generico)
        {
            root.variantes = new();
            return null;
        }

        if (root.variantes is null || root.variantes.Count == 0)
            return "Adicione uma variante ao personagem genérico.";

        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var variant in root.variantes)
        {
            if (variant is null || string.IsNullOrWhiteSpace(variant.nome) || variant.nome.Trim().Length > 100)
                return "Cada variante precisa de um nome de até 100 caracteres.";
            if (string.IsNullOrWhiteSpace(variant.id) || !ids.Add(variant.id))
                return "As variantes precisam de identificadores únicos.";
            if (variant.statusJson?.status is null || variant.statusJson.atributos?.principais is null ||
                variant.statusJson.atributos.secundarios is null || variant.statusJson.defesas is null)
                return "Preencha a ficha de cada variante.";
            variant.nome = variant.nome.Trim();
            variant.inventarioJson ??= new();
            variant.skills ??= new();
            variant.magia ??= new();
        }

        var first = root.variantes[0];
        var sheet = first.statusJson;
        root.status = sheet.status;
        root.atributos = sheet.atributos;
        root.defesas = sheet.defesas;
        root.nivel = sheet.nivel;
        root.xp = sheet.xp;
        root.pontos = sheet.pontos;
        root.pontosAtributo = sheet.pontosAtributo;
        root.pontosSkill = sheet.pontosSkill;
        root.pontosUltimate = sheet.pontosUltimate;
        root.condicioes = sheet.condicioes;
        dto.InventarioJson = first.inventarioJson;
        dto.Skills = first.skills;
        dto.Magia = first.magia;
        return null;
    }
}
