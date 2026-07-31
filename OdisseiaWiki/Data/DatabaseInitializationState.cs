namespace OdisseiaWiki.Data;

public sealed class DatabaseInitializationState
{
    private int _initializationCompleted;
    private int _databaseAvailable;

    public bool IsInitializationComplete =>
        Volatile.Read(ref _initializationCompleted) == 1;

    public bool IsReady =>
        IsInitializationComplete &&
        Volatile.Read(ref _databaseAvailable) == 1;

    public bool MarkInitializedAndAvailable()
    {
        Interlocked.Exchange(ref _initializationCompleted, 1);
        return Interlocked.Exchange(ref _databaseAvailable, 1) == 0;
    }

    public bool MarkAvailable()
    {
        if (!IsInitializationComplete)
            return false;

        return Interlocked.Exchange(ref _databaseAvailable, 1) == 0;
    }

    public bool MarkUnavailable() =>
        Interlocked.Exchange(ref _databaseAvailable, 0) == 1;
}
