using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface ITokenService
    {
        string GerarToken(Usuario usuario);
    }
}