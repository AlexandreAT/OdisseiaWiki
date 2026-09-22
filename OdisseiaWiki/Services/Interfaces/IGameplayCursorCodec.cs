namespace OdisseiaWiki.Services.Interfaces;

public interface IGameplayCursorCodec
{
    string Encode(long sequence);
    bool TryDecode(string? cursor, out long sequence);
}
