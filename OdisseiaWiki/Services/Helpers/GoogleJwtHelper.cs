using Google.Apis.Auth;

namespace OdisseiaWiki.Services.Helpers
{
    public static class GoogleJwtHelper
    {
        public static async Task<GoogleJsonWebSignature.Payload?> ValidarTokenAsync(
            string token,
            string clientId)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(token, settings);
                return payload;
            }
            catch
            {
                return null;
            }
        }
    }
}
