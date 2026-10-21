using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Helpers;

public static class GameplayConditionResistance
{
    public static bool Valid(GameplayResistanceTestDto? test, SistemaVersao version) =>
        test is null || test.Dados is >= 1 and <= 10 && test.Faces is >= 2 and <= 1000 &&
        test.Dificuldade is >= -1000000 and <= 1000000 &&
        !string.IsNullOrWhiteSpace(test.Atributo) && test.Atributo.Length <= 50 &&
        version.Atributos.Any(attribute => attribute.Ativo &&
            SistemaRpgConfiguration.NormalizarCodigo(attribute.CodigoAtributo, string.Empty) ==
            SistemaRpgConfiguration.NormalizarCodigo(test.Atributo, string.Empty));
}
