namespace OdisseiaWiki.Data;

public sealed class DatabaseInitializationState
{
    private volatile bool _isReady;

    public bool IsReady => _isReady;

    public void MarkReady() => _isReady = true;

    public void MarkUnavailable() => _isReady = false;
}
