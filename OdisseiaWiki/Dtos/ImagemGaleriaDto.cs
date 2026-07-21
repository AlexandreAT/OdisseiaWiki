using System.Text.Json;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Dtos;

[JsonConverter(typeof(ImagemGaleriaDtoConverter))]
public sealed class ImagemGaleriaDto
{
    public string Url { get; set; } = string.Empty;
    public string? Legenda { get; set; }
}

/// <summary>
/// Mantém compatibilidade com galerias antigas, persistidas e enviadas como uma lista de strings.
/// Novos registros são gravados como objetos contendo URL e legenda opcional.
/// </summary>
public sealed class ImagemGaleriaDtoConverter : JsonConverter<ImagemGaleriaDto>
{
    public override ImagemGaleriaDto Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
            return new ImagemGaleriaDto { Url = reader.GetString() ?? string.Empty };

        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Imagem de galeria deve ser um caminho ou um objeto.");

        string url = string.Empty;
        string? legenda = null;

        while (reader.Read() && reader.TokenType != JsonTokenType.EndObject)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
                continue;

            string propertyName = reader.GetString() ?? string.Empty;
            reader.Read();

            if (propertyName.Equals("url", StringComparison.OrdinalIgnoreCase) ||
                propertyName.Equals("src", StringComparison.OrdinalIgnoreCase))
                url = reader.TokenType == JsonTokenType.String ? reader.GetString() ?? string.Empty : string.Empty;
            else if (propertyName.Equals("legenda", StringComparison.OrdinalIgnoreCase) ||
                     propertyName.Equals("caption", StringComparison.OrdinalIgnoreCase))
                legenda = reader.TokenType == JsonTokenType.String ? reader.GetString() : null;
            else
                reader.Skip();
        }

        return new ImagemGaleriaDto { Url = url, Legenda = legenda };
    }

    public override void Write(Utf8JsonWriter writer, ImagemGaleriaDto value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("url", value.Url);
        if (!string.IsNullOrWhiteSpace(value.Legenda))
            writer.WriteString("legenda", value.Legenda.Trim());
        writer.WriteEndObject();
    }
}
