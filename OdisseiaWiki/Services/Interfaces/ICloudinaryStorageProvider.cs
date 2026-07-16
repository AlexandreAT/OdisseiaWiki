namespace OdisseiaWiki.Services.Interfaces;

public interface ICloudinaryStorageProvider : IStorageProvider
{
    bool TryGetPublicId(string url, out string publicId);
}
