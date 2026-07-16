using System.Security.Claims;

namespace OdisseiaWiki.Security;

public static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal principal)
    {
        string? value = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("id");

        return int.TryParse(value, out int userId) ? userId : null;
    }

    public static bool IsAdmin(this ClaimsPrincipal principal)
        => principal.IsInRole(AuthorizationPolicies.AdminRole);
}
