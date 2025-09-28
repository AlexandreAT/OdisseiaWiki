using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IUsuarioService
    {
        Task<ResultRegisterUsuario> Register(RegisterUsuarioDto dto);
        Task<ResultLoginUsuario> LoginGoogleAsync(string tokenJwtGoogle);
        Task<ResultLoginUsuario> Login(LoginUsuarioDto dto);
    }
}