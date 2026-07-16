namespace OdisseiaWiki.Services.Helpers
{
    public static class AssetFileHelper
    {
        public static void DeleteIfExists(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath) ||
                Uri.TryCreate(relativePath, UriKind.Absolute, out _))
                return;

            try
            {
                string webRoot = Path.GetFullPath(
                    Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
                string fullPath = Path.GetFullPath(Path.Combine(webRoot, relativePath));
                string requiredPrefix = webRoot.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

                if (!fullPath.StartsWith(requiredPrefix, StringComparison.OrdinalIgnoreCase))
                    return;

                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
            catch
            {
                // adicionar log de erro dps
            }
        }
    }
}
