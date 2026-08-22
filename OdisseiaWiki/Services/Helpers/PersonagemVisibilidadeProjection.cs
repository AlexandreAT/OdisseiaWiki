using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

/// <summary>
/// Removes values that a non-owner, non-administrator must not receive.
/// The visibility DTO itself is kept so clients can render an intentional placeholder.
/// </summary>
public static class PersonagemVisibilidadeProjection
{
    public static void ApplyForExternalViewer(Personagen personagem)
    {
        PersonagemVisibilidadeDto visibilidade = personagem.Visibilidade;

        if (!visibilidade.Nome) personagem.Nome = string.Empty;
        if (!visibilidade.Imagem) personagem.Imagem = null;
        if (!visibilidade.Historia) personagem.Historia = null;
        if (!visibilidade.Raca)
        {
            personagem.Idraca = 0;
            personagem.IdracaNavigation = null!;
        }
        if (!visibilidade.Cidade)
        {
            personagem.Idcidade = null;
            personagem.IdcidadeNavigation = null;
        }
        if (!visibilidade.Alinhamento) personagem.Alinhamento = null;
        if (!visibilidade.TracosPersonalidade)
        {
            personagem.Tracos = null;
            personagem.Costumes = null;
        }
        if (!visibilidade.PersonagensRelacionados) personagem.PersonagemsVinculados = null;
        if (!visibilidade.Inventario || !visibilidade.Proteses)
        {
            personagem.InventarioJson = ProjectInventoryJson(
                personagem.InventarioJson,
                visibilidade.Inventario,
                visibilidade.Proteses);
        }
        if (!visibilidade.Proteses) personagem.Implantes = null;
        if (!visibilidade.Passivas)
        {
            personagem.Idpassiva = null;
            personagem.Passiva = null;
        }
        if (!visibilidade.Ultimate) personagem.Ultimate = null;
        if (!visibilidade.Skills) personagem.Skills = null;
        if (!visibilidade.Magias) personagem.Magia = null;
        if (!visibilidade.Galeria) personagem.GaleriaImagem = null;

        personagem.StatusJson = MaskStatusJson(personagem.StatusJson, visibilidade);
        MaskRuntime(personagem.SistemaRuntime, visibilidade);
    }

    public static void ApplyForExternalViewer(PersonagemJogadorDto personagem)
    {
        PersonagemVisibilidadeDto visibilidade = personagem.Visibilidade;

        if (!visibilidade.Nome) personagem.Nome = string.Empty;
        if (!visibilidade.Imagem) personagem.Imagem = null;
        if (!visibilidade.Historia) personagem.Historia = null;
        if (!visibilidade.Raca)
        {
            personagem.Idraca = 0;
            personagem.RacaNome = null;
        }
        if (!visibilidade.Cidade)
        {
            personagem.Idcidade = null;
            personagem.CidadeNome = null;
        }
        if (!visibilidade.Alinhamento) personagem.Alinhamento = null;
        if (!visibilidade.TracosPersonalidade)
        {
            personagem.Tracos = null;
            personagem.Costumes = null;
            personagem.InfoSecundariasJson = null;
        }
        if (!visibilidade.PersonagensRelacionados) personagem.PersonagemsVinculados = null;
        if (!visibilidade.Inventario || !visibilidade.Proteses)
        {
            personagem.InventarioJson = ProjectInventoryObject(
                personagem.InventarioJson,
                visibilidade.Inventario,
                visibilidade.Proteses);
        }
        if (!visibilidade.Proteses) personagem.Implantes = null;
        if (!visibilidade.Passivas) personagem.Idpassiva = null;
        if (!visibilidade.Ultimate) personagem.Ultimate = null;
        if (!visibilidade.Skills)
        {
            personagem.Skills = null;
            personagem.Proficiencias = new List<ProficienciaResumoDto>();
        }
        if (!visibilidade.Magias) personagem.Magia = null;
        if (!visibilidade.Galeria) personagem.GaleriaImagem = null;

        personagem.StatusJson = MaskStatusObject(personagem.StatusJson, visibilidade);
        MaskRuntime(personagem.SistemaRuntime, visibilidade);
    }

    public static void ApplyForExternalViewer(
        PersonagemComparacaoDto personagem,
        PersonagemVisibilidadeDto visibilidade)
    {
        personagem.Visibilidade = visibilidade;
        if (!visibilidade.Nome) personagem.Nome = null;
        if (!visibilidade.Imagem) personagem.Imagem = null;
        if (!visibilidade.Skills) personagem.QuantidadeSkills = 0;
        if (!visibilidade.Vida) personagem.Status.Vida = 0;
        if (!visibilidade.Estamina) personagem.Status.Estamina = 0;
        if (!visibilidade.Mana) personagem.Status.Mana = 0;
        if (!visibilidade.AtributosPrincipais)
        {
            personagem.Status.Resistencia = 0;
            personagem.Status.Agilidade = 0;
            personagem.Status.Sabedoria = 0;
            personagem.Status.Precisao = 0;
            personagem.Status.Forca = 0;
        }
        if (!visibilidade.Defesas)
        {
            personagem.Status.Escudo = 0;
            personagem.Status.Protecao = 0;
            personagem.Status.Armadura = 0;
            personagem.Status.Outras = 0;
        }
        if (!visibilidade.Nivel) personagem.Status.Nivel = 0;
    }

    private static object? MaskStatusObject(
        object? statusJson,
        PersonagemVisibilidadeDto visibilidade)
    {
        if (statusJson is null || !HasHiddenStatusFields(visibilidade))
            return statusJson;

        try
        {
            string json = JsonSerializer.Serialize(statusJson);
            string masked = MaskStatusJson(json, visibilidade);
            return JsonSerializer.Deserialize<object>(masked);
        }
        catch (JsonException)
        {
            return new { };
        }
    }

    private static string? ProjectInventoryJson(
        string? inventoryJson,
        bool inventoryVisible,
        bool prosthesesVisible)
    {
        if (inventoryVisible && prosthesesVisible)
            return inventoryJson;
        if (!inventoryVisible && !prosthesesVisible)
            return null;
        if (string.IsNullOrWhiteSpace(inventoryJson))
            return null;

        try
        {
            JsonArray items = FilterInventory(
                JsonNode.Parse(inventoryJson),
                includeProstheses: prosthesesVisible);
            return items.Count > 0 ? items.ToJsonString() : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static object? ProjectInventoryObject(
        object? inventoryJson,
        bool inventoryVisible,
        bool prosthesesVisible)
    {
        if (inventoryVisible && prosthesesVisible)
            return inventoryJson;
        if (!inventoryVisible && !prosthesesVisible)
            return null;
        if (inventoryJson is null)
            return null;

        try
        {
            JsonArray items = FilterInventory(
                JsonSerializer.SerializeToNode(inventoryJson),
                includeProstheses: prosthesesVisible);
            return items.Count > 0
                ? JsonSerializer.Deserialize<object>(items.ToJsonString())
                : null;
        }
        catch (Exception exception) when (exception is JsonException or NotSupportedException)
        {
            return null;
        }
    }

    private static JsonArray FilterInventory(JsonNode? inventory, bool includeProstheses)
    {
        JsonArray projectedItems = new();
        if (inventory is not JsonArray items)
            return projectedItems;

        foreach (JsonNode? item in items)
        {
            if (item is not null && IsProsthesis(item) == includeProstheses)
                projectedItems.Add(item.DeepClone());
        }

        return projectedItems;
    }

    private static bool IsProsthesis(JsonNode? item)
    {
        if (item is not JsonObject itemObject)
            return false;

        JsonNode? type = GetProperty(itemObject, "tipo");
        if (type is not JsonValue typeValue)
            return false;

        if (typeValue.TryGetValue(out int numericType))
            return numericType == (int)ItemTipo.Implante;

        if (!typeValue.TryGetValue(out string? stringType))
            return false;

        return string.Equals(stringType?.Trim(), "implante", StringComparison.OrdinalIgnoreCase);
    }

    private static string MaskStatusJson(
        string? statusJson,
        PersonagemVisibilidadeDto visibilidade)
    {
        if (!HasHiddenStatusFields(visibilidade))
            return statusJson ?? "{}";

        JsonObject root;
        try
        {
            root = JsonNode.Parse(statusJson ?? "{}") as JsonObject ?? new JsonObject();
        }
        catch (JsonException)
        {
            return "{}";
        }

        JsonObject? status = GetObject(root, "status");
        if (!visibilidade.Vida)
            Remove(status, "vida", "vidaMaxima");
        if (!visibilidade.Estamina)
            Remove(status, "estamina", "estaminaMaxima");
        if (!visibilidade.Mana)
            Remove(status, "mana", "manaMaxima");
        if (!visibilidade.CapacidadeCarga)
            Remove(status, "capacidadeCarga");

        JsonObject? atributos = GetObject(root, "atributos");
        if (!visibilidade.AtributosPrincipais)
            Remove(atributos, "principais");
        if (!visibilidade.AtributosSecundarios)
            Remove(atributos, "secundarios");
        if (!visibilidade.Defesas)
        {
            Remove(root, "defesas");
            Remove(atributos, "defesas");
        }
        if (!visibilidade.Xp) Remove(root, "xp");
        if (!visibilidade.Nivel) Remove(root, "nivel");

        return root.ToJsonString();
    }

    private static bool HasHiddenStatusFields(PersonagemVisibilidadeDto visibilidade) =>
        !visibilidade.Vida ||
        !visibilidade.Estamina ||
        !visibilidade.Mana ||
        !visibilidade.CapacidadeCarga ||
        !visibilidade.AtributosPrincipais ||
        !visibilidade.AtributosSecundarios ||
        !visibilidade.Defesas ||
        !visibilidade.Xp ||
        !visibilidade.Nivel;

    private static void MaskRuntime(
        SistemaRuntimeContextoDto? runtime,
        PersonagemVisibilidadeDto visibilidade)
    {
        if (runtime is null)
            return;

        if (!visibilidade.Raca)
            runtime.ConfiguracaoRacial = null;

        runtime.Proveniencias = runtime.Proveniencias
            .Where(item => !PathIsHidden(item.Caminho, visibilidade))
            .ToList();
        runtime.Warnings = runtime.Warnings
            .Where(item => !PathIsHidden(item.Caminho, visibilidade))
            .ToList();
    }

    private static bool PathIsHidden(string? caminho, PersonagemVisibilidadeDto visibilidade)
    {
        if (string.IsNullOrWhiteSpace(caminho))
            return false;

        string path = caminho.ToLowerInvariant();
        return (!visibilidade.Vida && path.Contains("vida", StringComparison.Ordinal)) ||
               (!visibilidade.Estamina && path.Contains("estamina", StringComparison.Ordinal)) ||
               (!visibilidade.Mana && path.Contains("mana", StringComparison.Ordinal)) ||
               (!visibilidade.CapacidadeCarga && path.Contains("capacidadecarga", StringComparison.Ordinal)) ||
               (!visibilidade.AtributosPrincipais && path.Contains("atributos.principais", StringComparison.Ordinal)) ||
               (!visibilidade.AtributosSecundarios && path.Contains("atributos.secundarios", StringComparison.Ordinal)) ||
               (!visibilidade.Defesas && path.Contains("defesas", StringComparison.Ordinal)) ||
               (!visibilidade.Xp && path.Contains("xp", StringComparison.Ordinal)) ||
               (!visibilidade.Nivel && path.Contains("nivel", StringComparison.Ordinal)) ||
               (!visibilidade.Skills && path.Contains("skills", StringComparison.Ordinal)) ||
               (!visibilidade.Magias && path.Contains("magias", StringComparison.Ordinal));
    }

    private static JsonObject? GetObject(JsonObject parent, string propertyName)
    {
        KeyValuePair<string, JsonNode?>? property = parent
            .FirstOrDefault(item => item.Key.Equals(propertyName, StringComparison.OrdinalIgnoreCase));
        return property?.Value as JsonObject;
    }

    private static JsonNode? GetProperty(JsonObject parent, string propertyName)
    {
        foreach (KeyValuePair<string, JsonNode?> item in parent)
        {
            if (item.Key.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
                return item.Value;
        }

        return null;
    }

    private static void Remove(JsonObject? parent, params string[] propertyNames)
    {
        if (parent is null)
            return;

        foreach (string propertyName in propertyNames)
        {
            string[] keys = parent
                .Where(item => item.Key.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
                .Select(item => item.Key)
                .ToArray();
            foreach (string key in keys)
                parent.Remove(key);
        }
    }
}
