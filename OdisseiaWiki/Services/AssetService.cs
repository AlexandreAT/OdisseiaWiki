using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services
{
    public class AssetService : IAssetService
    {
        private readonly ILocalStorageProvider _local;
        private readonly IImgBBStorageProvider _imgbb;

        public AssetService(ILocalStorageProvider local, IImgBBStorageProvider imgbb)
        {
            _local = local;
            _imgbb = imgbb;
        }

        public async Task<ResultSaveImage> SaveImageAsync(IFormFile file, string type, string entityName, string? folderName = null)
        {
            if (file == null || file.Length == 0)
                return ResultSaveImage.Fail("Arquivo inválido.");

            // Normaliza nome da entidade (sem espaços, minúsculo)
            string safeEntity = (entityName ?? string.Empty).ToLower().Replace(" ", "-");
            string subFolder = string.IsNullOrEmpty(folderName)
                ? $"{type}/{safeEntity}"
                : $"{type}/{safeEntity}/{folderName}";

            var assetType = MapType(type);

            return assetType == AssetType.Player || assetType == AssetType.Profile
                ? await _imgbb.SaveAsync(file, subFolder)
                : await _local.SaveAsync(file, subFolder);
        }

        private static AssetType MapType(string type)
        {
            if (string.IsNullOrWhiteSpace(type)) return AssetType.Wiki;

            var t = type.Trim().ToLowerInvariant();
            return t switch
            {
                "player" => AssetType.Player,
                "perfil" => AssetType.Profile,
                "personagemjogador" => AssetType.Player,
                "personagem" => AssetType.Wiki,
                _ when t.Contains("player") => AssetType.Player,
                _ when t.Contains("perfil") => AssetType.Profile,
                _ => AssetType.Wiki
            };
        }
    }
}
