using System.Text.Json;

namespace OdisseiaWiki.Services.Helpers
{
    public static class JsonSafeHelper
    {
        public static List<string>? DeserializeTags(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                List<string>? result = JsonSerializer.Deserialize<List<string>>(json);

                if (result != null && result.Any(t => t.Contains("\\u")))
                {
                    return result
                        .Select(t => JsonSerializer.Deserialize<string>($"\"{t}\"") ?? t)
                        .ToList();
                }

                return result;
            }
            catch
            {
                try
                {
                    string? inner = JsonSerializer.Deserialize<string>(json);
                    return JsonSerializer.Deserialize<List<string>>(inner ?? "");
                }
                catch
                {
                    return null;
                }
            }
        }
    }
}
