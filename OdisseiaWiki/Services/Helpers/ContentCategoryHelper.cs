using System.Globalization;
using System.Text;

namespace OdisseiaWiki.Services.Helpers
{
    public static class ContentCategoryHelper
    {
        public const string Cidade = "Cidade";
        public const string Personagem = "Personagem";
        public const string Item = "Item";
        public const string InfoLore = "InfoLore";
        public const string Raca = "Raça";
        public const string Page = "Page";

        public static List<string> EnsureCategoryTag(IEnumerable<string>? tags, string category)
        {
            var result = (tags ?? Enumerable.Empty<string>())
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Select(tag => tag.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (!result.Any(tag => string.Equals(tag, category, StringComparison.OrdinalIgnoreCase)))
                result.Insert(0, category);

            return result;
        }

        public static List<string> EnsureCategoryTag(string? tagsJson, string category)
            => EnsureCategoryTag(JsonSafeHelper.DeserializeTags(tagsJson), category);

        public static bool MatchesCategorySearch(string term, string category)
        {
            var normalizedTerm = Normalize(term);
            if (string.IsNullOrWhiteSpace(normalizedTerm)) return false;

            return category switch
            {
                Raca => normalizedTerm == "raca",
                InfoLore => normalizedTerm is "infolore" or "info lore" or "lore",
                Page => normalizedTerm is "page" or "pagina",
                _ => normalizedTerm == Normalize(category)
            };
        }

        private static string Normalize(string value)
        {
            var decomposed = value.Trim().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(decomposed.Length);

            foreach (var character in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                    builder.Append(char.ToLowerInvariant(character));
            }

            return builder.ToString().Normalize(NormalizationForm.FormC);
        }
    }
}
