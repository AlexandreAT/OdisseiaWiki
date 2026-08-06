namespace OdisseiaWiki.Services.Helpers;

public static class SystemMesaConstants
{
    public const string CodigoMesaPadrao = "ODISSEIA_PADRAO";
    public const string NomeMesaPadrao = "Odisseia";

    public static bool NomeRepresentaMesaPadrao(string? nome)
    {
        if (string.IsNullOrWhiteSpace(nome))
            return false;

        string normalizado = string.Concat(
            nome.Normalize(System.Text.NormalizationForm.FormD)
                .Where(caractere =>
                    System.Globalization.CharUnicodeInfo.GetUnicodeCategory(caractere) !=
                    System.Globalization.UnicodeCategory.NonSpacingMark));
        normalizado = string.Join(
            ' ',
            normalizado
                .ToUpperInvariant()
                .Split(
                    new[] { ' ', '-', '\u2013', '\u2014', '_', '\t', '\r', '\n' },
                    StringSplitOptions.RemoveEmptyEntries));

        return normalizado is "ODISSEIA" or "MESA PADRAO ODISSEIA";
    }
}
