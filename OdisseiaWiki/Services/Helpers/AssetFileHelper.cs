namespace OdisseiaWiki.Services.Helpers
{
    public static class AssetFileHelper
    {
        public static void DeleteIfExists(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            try
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relativePath);

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
