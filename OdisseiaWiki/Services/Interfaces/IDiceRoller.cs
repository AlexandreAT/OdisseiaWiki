namespace OdisseiaWiki.Services.Interfaces;

public interface IDiceRoller
{
    IReadOnlyList<int> Roll(int quantity, int faces);
}

public interface IDiceRandomSource
{
    int NextInclusive(int maximum);
}
