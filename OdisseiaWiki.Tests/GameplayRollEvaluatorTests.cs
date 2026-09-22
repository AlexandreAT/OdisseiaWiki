using Moq;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class GameplayRollEvaluatorTests
{
    [Theory]
    [InlineData(GameplayRollMode.Vantagem)]
    [InlineData(GameplayRollMode.Desvantagem)]
    public void Evaluate_LimitaTotalDeDadosGeradosEmRolagemDupla(GameplayRollMode mode)
    {
        var dice = new Mock<IDiceRoller>();
        var evaluator = new GameplayRollEvaluator(dice.Object);
        var plan = new GameplayRollPlan(
            "51D6",
            new[] { new GameplayDiceGroupSpec(51, 6) },
            mode,
            0);

        Assert.Throws<ArgumentOutOfRangeException>(() => evaluator.Evaluate(plan));
        dice.VerifyNoOtherCalls();
    }

    [Fact]
    public void Evaluate_AceitaCinquentaDadosBaseComVantagem()
    {
        var dice = new Mock<IDiceRoller>();
        dice.Setup(item => item.Roll(100, 6))
            .Returns(Enumerable.Repeat(1, 100).ToArray());
        var evaluator = new GameplayRollEvaluator(dice.Object);
        var plan = new GameplayRollPlan(
            "50D6 com vantagem",
            new[] { new GameplayDiceGroupSpec(50, 6) },
            GameplayRollMode.Vantagem,
            0);

        var result = evaluator.Evaluate(plan);

        Assert.Equal(100, result.Grupos.Single().Valores.Count);
        Assert.Equal(50, result.Total);
        dice.Verify(item => item.Roll(100, 6), Times.Once);
    }
}
