using System.Security.Cryptography;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class CryptoDiceRandomSource : IDiceRandomSource
{
    public int NextInclusive(int maximum)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximum);
        if (maximum == int.MaxValue)
            throw new ArgumentOutOfRangeException(nameof(maximum));
        return RandomNumberGenerator.GetInt32(1, maximum + 1);
    }
}

public sealed class DiceRoller : IDiceRoller
{
    private readonly IDiceRandomSource _randomSource;

    public DiceRoller(IDiceRandomSource randomSource)
    {
        _randomSource = randomSource;
    }

    public IReadOnlyList<int> Roll(int quantity, int faces)
    {
        if (quantity is < 1 or > 100)
            throw new ArgumentOutOfRangeException(nameof(quantity));
        if (faces is < 2 or > 1000)
            throw new ArgumentOutOfRangeException(nameof(faces));

        int[] values = new int[quantity];
        for (int index = 0; index < quantity; index++)
            values[index] = _randomSource.NextInclusive(faces);
        return values;
    }
}
