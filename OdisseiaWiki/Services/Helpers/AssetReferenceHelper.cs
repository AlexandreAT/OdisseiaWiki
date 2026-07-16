using System.Text.RegularExpressions;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services.Helpers;

public static partial class AssetReferenceHelper
{
    public static HashSet<string> Extract(params string?[] values)
    {
        HashSet<string> references = new(StringComparer.Ordinal);

        foreach (string? value in values)
        {
            if (string.IsNullOrWhiteSpace(value))
                continue;

            string trimmed = value.Trim();
            if (LooksLikeAsset(trimmed))
                references.Add(trimmed);

            foreach (Match match in AssetUrlRegex().Matches(value))
            {
                string candidate = match.Value.TrimEnd(')', ']', '}', ',', '.', ';');
                if (LooksLikeAsset(candidate))
                    references.Add(candidate);
            }
        }

        return references;
    }

    public static IEnumerable<string> Removed(
        IEnumerable<string> oldReferences,
        IEnumerable<string> currentReferences)
        => oldReferences.Except(currentReferences, StringComparer.Ordinal);

    public static async Task DeleteRemovedAsync(
        IAssetService assetService,
        IEnumerable<string> oldReferences,
        IEnumerable<string> currentReferences)
    {
        foreach (string reference in Removed(oldReferences, currentReferences))
            await assetService.DeleteIfUnreferencedAsync(reference);
    }

    public static async Task DeleteAllAsync(
        IAssetService assetService,
        IEnumerable<string> references)
    {
        foreach (string reference in references.Distinct(StringComparer.Ordinal))
            await assetService.DeleteIfUnreferencedAsync(reference);
    }

    private static bool LooksLikeAsset(string value)
        => value.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
           value.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
           value.StartsWith("assets_dynamic/", StringComparison.OrdinalIgnoreCase) ||
           value.StartsWith("/assets_dynamic/", StringComparison.OrdinalIgnoreCase);

    [GeneratedRegex(@"(?:https?://[^\s\""'<>]+|/?assets_dynamic/[^\s\""'<>]+)", RegexOptions.IgnoreCase)]
    private static partial Regex AssetUrlRegex();
}
