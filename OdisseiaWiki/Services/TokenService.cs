using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OdisseiaWiki.Models;
using OdisseiaWiki.Security;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Services
{
    public class TokenService : ITokenService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly HashSet<string> _adminEmails;
        private readonly bool _requireVerifiedEmailForAdmin;

        public TokenService(
            IOptions<JwtSettings> jwtOptions,
            IOptions<AuthorizationSettings> authorizationOptions)
        {
            _jwtSettings = jwtOptions.Value;
            _adminEmails = (authorizationOptions.Value.AdminEmails ?? Array.Empty<string>())
                .Where(email => !string.IsNullOrWhiteSpace(email))
                .Select(email => email.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            _requireVerifiedEmailForAdmin = authorizationOptions.Value.RequireVerifiedEmailForAdmin;
        }

        public string GerarToken(Usuario usuario, bool emailVerified = false)
        {
            SymmetricSecurityKey key = new(
                Encoding.UTF8.GetBytes(_jwtSettings.ChaveSecreta));
            SigningCredentials creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            List<Claim> claims = new()
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Idusuario.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("id", usuario.Idusuario.ToString()),
                new Claim("email", usuario.Email ?? ""),
                new Claim("nickname", usuario.Nickname ?? ""),
                new Claim("imagemUrl", usuario.ImagemUrl ?? "")
            };

            bool canReceiveAdminRole = !_requireVerifiedEmailForAdmin || emailVerified;
            if (canReceiveAdminRole &&
                !string.IsNullOrWhiteSpace(usuario.Email) &&
                _adminEmails.Contains(usuario.Email))
            {
                claims.Add(new Claim("role", AuthorizationPolicies.AdminRole));
            }

            JwtSecurityToken token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddHours(_jwtSettings.ExpiracaoHoras),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
