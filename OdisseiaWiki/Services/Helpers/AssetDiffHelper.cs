namespace OdisseiaWiki.Services.Helpers
{
    public static class AssetDiffHelper
    {
        public static List<string> GetRemovedFiles(List<string>? oldList, List<string>? newList)
        {
            oldList ??= new List<string>();
            newList ??= new List<string>();

            return oldList
                .Where(old => !newList.Contains(old))
                .ToList();
        }
    }
}
