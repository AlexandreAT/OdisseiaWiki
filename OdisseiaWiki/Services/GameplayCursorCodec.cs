using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Services;

public sealed class GameplayCursorCodec : IGameplayCursorCodec
{
    private readonly byte[] _key;

    public GameplayCursorCodec(IOptions<JwtSettings> settings)
    {
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(
            $"gameplay-cursor:v1:{settings.Value.ChaveSecreta}"));
    }

    public string Encode(long sequence)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(sequence);
        byte[] payload = Encoding.UTF8.GetBytes($"v1:{sequence}");
        byte[] signature = HMACSHA256.HashData(_key, payload);
        byte[] result = new byte[payload.Length + signature.Length];
        Buffer.BlockCopy(payload, 0, result, 0, payload.Length);
        Buffer.BlockCopy(signature, 0, result, payload.Length, signature.Length);
        return WebEncoders.Base64UrlEncode(result);
    }

    public bool TryDecode(string? cursor, out long sequence)
    {
        sequence = 0;
        if (string.IsNullOrWhiteSpace(cursor))
            return true;

        try
        {
            byte[] decoded = WebEncoders.Base64UrlDecode(cursor);
            if (decoded.Length <= 32)
                return false;
            int payloadLength = decoded.Length - 32;
            ReadOnlySpan<byte> payload = decoded.AsSpan(0, payloadLength);
            ReadOnlySpan<byte> signature = decoded.AsSpan(payloadLength);
            byte[] expected = HMACSHA256.HashData(_key, payload);
            if (!CryptographicOperations.FixedTimeEquals(signature, expected))
                return false;

            string text = Encoding.UTF8.GetString(payload);
            return text.StartsWith("v1:", StringComparison.Ordinal) &&
                long.TryParse(text.AsSpan(3), out sequence) &&
                sequence >= 0;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
