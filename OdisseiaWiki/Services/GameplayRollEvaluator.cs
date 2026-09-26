using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed record GameplayDiceGroupSpec(int Quantity, int Faces);

public sealed record GameplayRollPlan(
    string Expression,
    IReadOnlyList<GameplayDiceGroupSpec> Groups,
    GameplayRollMode Mode,
    int Modifier,
    GameplayModifierDto? ModifierDetail = null,
    IReadOnlyList<GameplayModifierDto>? ModifierDetails = null);

public sealed class GameplayRollEvaluator
{
    private readonly IDiceRoller _diceRoller;

    public GameplayRollEvaluator(IDiceRoller diceRoller)
    {
        _diceRoller = diceRoller;
    }

    public GameplayRollResultDto Evaluate(GameplayRollPlan plan)
    {
        int attempts = plan.Mode == GameplayRollMode.Normal ? 1 : 2;
        if (plan.Groups.Count > 8 || plan.Groups.Sum(item => item.Quantity) > 100 / attempts)
            throw new ArgumentOutOfRangeException(nameof(plan));

        var valuesByGroup = new List<IReadOnlyList<int>>(plan.Groups.Count);
        int selectedAttempt = 0;
        if (plan.Mode != GameplayRollMode.Normal)
        {
            int firstTotal = 0;
            int secondTotal = 0;
            foreach (GameplayDiceGroupSpec group in plan.Groups)
            {
                IReadOnlyList<int> values = _diceRoller.Roll(group.Quantity * 2, group.Faces);
                valuesByGroup.Add(values);
                firstTotal = checked(firstTotal + values.Take(group.Quantity).Sum());
                secondTotal = checked(secondTotal + values.Skip(group.Quantity).Sum());
            }

            selectedAttempt = plan.Mode == GameplayRollMode.Vantagem
                ? (secondTotal > firstTotal ? 1 : 0)
                : (secondTotal < firstTotal ? 1 : 0);
        }
        else
        {
            foreach (GameplayDiceGroupSpec group in plan.Groups)
                valuesByGroup.Add(_diceRoller.Roll(group.Quantity, group.Faces));
        }

        var groups = new List<GameplayDiceGroupResultDto>(plan.Groups.Count);
        int subtotal = 0;
        int? natural = null;
        for (int groupIndex = 0; groupIndex < plan.Groups.Count; groupIndex++)
        {
            GameplayDiceGroupSpec spec = plan.Groups[groupIndex];
            IReadOnlyList<int> values = valuesByGroup[groupIndex];
            int start = plan.Mode == GameplayRollMode.Normal
                ? 0
                : selectedAttempt * spec.Quantity;
            int end = start + spec.Quantity;
            int[] kept = Enumerable.Range(start, spec.Quantity).ToArray();
            int[] discarded = Enumerable.Range(0, values.Count)
                .Where(index => index < start || index >= end)
                .ToArray();
            subtotal = checked(subtotal + kept.Sum(index => values[index]));
            if (!natural.HasValue && kept.Length > 0)
                natural = values[kept[0]];
            groups.Add(new GameplayDiceGroupResultDto
            {
                Quantidade = values.Count,
                Faces = spec.Faces,
                Valores = values,
                IndicesMantidos = kept,
                IndicesDescartados = discarded,
            });
        }

        return new GameplayRollResultDto
        {
            Expressao = plan.Expression,
            Grupos = groups,
            Modificadores = plan.ModifierDetails ?? (plan.ModifierDetail is null
                ? Array.Empty<GameplayModifierDto>()
                : new[] { plan.ModifierDetail }),
            ValorNatural = natural,
            Modificador = plan.Modifier,
            Subtotal = subtotal,
            Total = checked(subtotal + plan.Modifier),
            Manual = false,
        };
    }
}
