using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Dtos;

[JsonConverter(typeof(RacaPassivaDtoConverter))]
public sealed class RacaPassivaDto
{
    [MaxLength(100)]
    public string? Nome { get; set; }

    [MaxLength(2000)]
    public string? Efeito { get; set; }
}

/// <summary>
/// Mantem compativel a leitura das passivas antigas, persistidas apenas como texto.
/// </summary>
public sealed class RacaPassivaDtoConverter : JsonConverter<RacaPassivaDto>
{
    public override RacaPassivaDto Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
            return new RacaPassivaDto { Nome = reader.GetString() };

        if (reader.TokenType != JsonTokenType.StartObject)
            throw new JsonException("Passiva de raca deve ser um texto ou um objeto.");

        string? nome = null;
        string? efeito = null;

        while (reader.Read() && reader.TokenType != JsonTokenType.EndObject)
        {
            if (reader.TokenType != JsonTokenType.PropertyName)
                continue;

            string propertyName = reader.GetString() ?? string.Empty;
            reader.Read();

            if (propertyName.Equals("nome", StringComparison.OrdinalIgnoreCase))
                nome = reader.TokenType == JsonTokenType.String ? reader.GetString() : null;
            else if (propertyName.Equals("efeito", StringComparison.OrdinalIgnoreCase) ||
                     propertyName.Equals("descricao", StringComparison.OrdinalIgnoreCase))
                efeito = reader.TokenType == JsonTokenType.String ? reader.GetString() : null;
            else
                reader.Skip();
        }

        return new RacaPassivaDto { Nome = nome, Efeito = efeito };
    }

    public override void Write(Utf8JsonWriter writer, RacaPassivaDto value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("nome", value.Nome);
        if (!string.IsNullOrWhiteSpace(value.Efeito))
            writer.WriteString("efeito", value.Efeito.Trim());
        writer.WriteEndObject();
    }
}
