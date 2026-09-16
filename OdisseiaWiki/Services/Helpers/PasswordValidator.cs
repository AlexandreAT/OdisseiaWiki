namespace OdisseiaWiki.Services.Helpers;

public static class PasswordValidator
{
    public const int MinimumLength = 6;

    public static string? Validate(string? password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Trim().Length < MinimumLength)
            return $"A senha deve ter pelo menos {MinimumLength} caracteres.";

        return null;
    }
}
