using Google.Apis.Auth;

namespace OdisseiaWiki.Services.Helpers
{
    public static class GoogleJwtHelper
    {
        public static async Task<GoogleJsonWebSignature.Payload?> ValidarTokenAsync(string token)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { "1000361239674-p29f1mb5mdardrmucofq5m2r0v340nu2.apps.googleusercontent.com" }
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
