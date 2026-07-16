using System.Text.Json;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Services.StorageProviders;
using OdisseiaWiki.Settings;

const long maxFileSize = 10 * 1024 * 1024;
string[] allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
Dictionary<string, string> contentTypes = new(StringComparer.OrdinalIgnoreCase)
{
    [".jpg"] = "image/jpeg",
    [".jpeg"] = "image/jpeg",
    [".png"] = "image/png",
    [".gif"] = "image/gif",
    [".webp"] = "image/webp",
};

bool execute = args.Contains("--execute", StringComparer.OrdinalIgnoreCase);
string repositoryRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../"));
string source = GetOption(args, "--source") ??
    Path.Combine(repositoryRoot, "OdisseiaWiki", "wwwroot", "assets_dynamic");
string output = GetOption(args, "--output") ??
    Path.Combine(repositoryRoot, "migration-output", "cloudinary-assets.json");

source = Path.GetFullPath(source);
output = Path.GetFullPath(output);

if (!Directory.Exists(source))
{
    Console.Error.WriteLine("Diretório de origem não encontrado. Use --source <caminho>.");
    return 2;
}

List<MigrationEntry> entries = await ReadMappingAsync(output);
Dictionary<string, MigrationEntry> byPath = entries
    .GroupBy(entry => entry.LocalPath, StringComparer.OrdinalIgnoreCase)
    .ToDictionary(group => group.Key, group => group.Last(), StringComparer.OrdinalIgnoreCase);

CloudinaryStorageProvider? provider = null;
string rootFolder = Environment.GetEnvironmentVariable("Cloudinary__RootFolder") ?? "odisseia";
if (execute)
{
    CloudinarySettings settings = new()
    {
        CloudName = RequireEnvironment("Cloudinary__CloudName"),
        ApiKey = RequireEnvironment("Cloudinary__ApiKey"),
        ApiSecret = RequireEnvironment("Cloudinary__ApiSecret"),
        RootFolder = rootFolder,
    };
    provider = new CloudinaryStorageProvider(
        Options.Create(settings),
        NullLogger<CloudinaryStorageProvider>.Instance);
}

string[] files = Directory.EnumerateFiles(source, "*", SearchOption.AllDirectories)
    .Where(path => allowedExtensions.Contains(Path.GetExtension(path), StringComparer.OrdinalIgnoreCase))
    .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
    .ToArray();

Console.WriteLine(execute
    ? $"Migração explícita iniciada para {files.Length} imagens."
    : $"Dry-run: {files.Length} imagens encontradas; nenhum upload será realizado.");

foreach (string filePath in files)
{
    string relativePath = Path.GetRelativePath(source, filePath).Replace('\\', '/');
    if (byPath.TryGetValue(relativePath, out MigrationEntry? previous) && previous.Status == "success")
        continue;

    string extension = Path.GetExtension(filePath).ToLowerInvariant();
    string publicId = $"{NormalizeRoot(rootFolder)}/legacy/{NormalizePath(Path.ChangeExtension(relativePath, null)!)}-{ShortHash(relativePath)}";
    FileInfo info = new(filePath);
    MigrationEntry entry = new(relativePath, "cloudinary", publicId, null, "dry-run", null, DateTime.UtcNow);

    if (info.Length == 0 || info.Length > maxFileSize)
    {
        entry = entry with { Status = "failed", Error = "Arquivo vazio ou acima de 10 MB." };
    }
    else if (execute && provider is not null)
    {
        try
        {
            await using FileStream stream = new(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            FormFile formFile = new(stream, 0, stream.Length, "file", Path.GetFileName(filePath))
            {
                Headers = new HeaderDictionary(),
                ContentType = contentTypes[extension],
            };

            var result = await provider.SaveAsync(formFile, "legacy", publicId);
            entry = result.Sucesso
                ? entry with { Url = result.Url, Status = "success", Error = null }
                : entry with { Status = "failed", Error = result.MensagemErro };
        }
        catch (Exception exception)
        {
            entry = entry with { Status = "failed", Error = exception.Message };
        }
    }

    byPath[relativePath] = entry;
}

await WriteMappingAsync(output, byPath.Values);
int failures = byPath.Values.Count(entry => entry.Status == "failed");
Console.WriteLine($"Mapeamento salvo. Falhas: {failures}. Originais não foram alterados.");
return failures == 0 ? 0 : 1;

static string? GetOption(string[] arguments, string name)
{
    int index = Array.FindIndex(arguments, argument =>
        string.Equals(argument, name, StringComparison.OrdinalIgnoreCase));
    return index >= 0 && index + 1 < arguments.Length ? arguments[index + 1] : null;
}

static string RequireEnvironment(string name)
    => Environment.GetEnvironmentVariable(name) is { Length: > 0 } value
        ? value
        : throw new InvalidOperationException($"Variável de ambiente obrigatória ausente: {name}");

static string NormalizeRoot(string value)
    => string.Join('/', value.Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries)
        .Select(segment => Regex.Replace(segment.ToLowerInvariant(), "[^a-z0-9_-]+", "-").Trim('-'))
        .Where(segment => segment.Length > 0));

static string NormalizePath(string value)
    => string.Join('/', value.Split('/', StringSplitOptions.RemoveEmptyEntries)
        .Select(segment => Regex.Replace(segment.ToLowerInvariant(), "[^a-z0-9_-]+", "-").Trim('-'))
        .Where(segment => segment.Length > 0));

static string ShortHash(string value)
    => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)))[..12].ToLowerInvariant();

static async Task<List<MigrationEntry>> ReadMappingAsync(string path)
{
    if (!File.Exists(path))
        return [];

    await using FileStream stream = File.OpenRead(path);
    return await JsonSerializer.DeserializeAsync<List<MigrationEntry>>(stream) ?? [];
}

static async Task WriteMappingAsync(string path, IEnumerable<MigrationEntry> entries)
{
    Directory.CreateDirectory(Path.GetDirectoryName(path)!);
    await using (FileStream stream = new(
        path,
        FileMode.Create,
        FileAccess.Write,
        FileShare.None,
        bufferSize: 81920,
        useAsync: true))
    {
        await JsonSerializer.SerializeAsync(stream, entries.OrderBy(entry => entry.LocalPath), new JsonSerializerOptions
        {
            WriteIndented = true,
        });
        await stream.FlushAsync();
    }
}

internal sealed record MigrationEntry(
    string LocalPath,
    string Provider,
    string PublicId,
    string? Url,
    string Status,
    string? Error,
    DateTime UpdatedAtUtc);
