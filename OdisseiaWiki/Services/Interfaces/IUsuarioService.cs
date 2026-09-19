using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces
{
    public interface IUsuarioService
    {
        Task<ResultRegisterUsuario> Register(RegisterUsuarioDto dto);
        Task<ResultLoginUsuario> LoginGoogleAsync(string tokenJwtGoogle);
        Task<ResultLoginUsuario> Login(LoginUsuarioDto dto);
        Task<ResultAccountAction> ConfirmarEmailAsync(string token);
        Task ReenviarConfirmacaoEmailAsync(string email);
        Task SolicitarRedefinicaoSenhaAsync(string email);
        Task<ResultAccountAction> RedefinirSenhaAsync(RedefinirSenhaDto dto);
        Task<UsuarioPerfilDto?> ObterPerfilAsync(int idUsuario);
        Task<ResultUsuarioPerfil> AtualizarPerfilAsync(int idUsuario, AtualizarUsuarioPerfilDto dto);
        Task<ResultAccountAction> SolicitarRedefinicaoSenhaDoUsuarioAsync(int idUsuario);
        Task<ResultAccountAction> ExcluirContaAsync(int idUsuario, string confirmacao);
    }
}
