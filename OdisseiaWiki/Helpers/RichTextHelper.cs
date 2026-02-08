using System.Text.Json;

namespace OdisseiaWiki.Helpers
{
    public static class RichTextHelper
    {
        /// <summary>
        /// Serializa um objeto JSON estruturado (ex: TipTap/ProseMirror) para string.
        /// Se for null, retorna null. Se for string simples, envelopa em JSON básico.
        /// </summary>
        public static string? SerializeRichText(object? richTextJson)
        {
            if (richTextJson == null)
                return null;

            if (richTextJson is string str)
            {
                if (string.IsNullOrWhiteSpace(str))
                    return null;

                if (!IsValidJson(str))
                    return JsonSerializer.Serialize(WrapPlainTextAsJson(str));

                return str;
            }

            return JsonSerializer.Serialize(richTextJson);
        }

        /// <summary>
        /// Desserializa string JSON para JsonElement.
        /// Se string for null/vazia, retorna null.
        /// Se string for texto plano (não-JSON), envelopa em JSON básico.
        /// </summary>
        public static JsonElement? DeserializeRichText(string? jsonString)
        {
            if (string.IsNullOrWhiteSpace(jsonString))
                return null;

            try
            {
                return JsonSerializer.Deserialize<JsonElement>(jsonString);
            }
            catch (JsonException)
            {
                var wrapped = WrapPlainTextAsJson(jsonString);
                return JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(wrapped));
            }
        }

        /// <summary>
        /// Envelopa texto plano em estrutura JSON básica (parágrafo simples).
        /// Exemplo: "Texto" → { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Texto" }]}]}
        /// </summary>
        private static object WrapPlainTextAsJson(string plainText)
        {
            return new
            {
                type = "doc",
                content = new[]
                {
                    new
                    {
                        type = "paragraph",
                        content = new[]
                        {
                            new { type = "text", text = plainText }
                        }
                    }
                }
            };
        }

        /// <summary>
        /// Valida se string é JSON válido.
        /// </summary>
        private static bool IsValidJson(string str)
        {
            try
            {
                JsonDocument.Parse(str);
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}