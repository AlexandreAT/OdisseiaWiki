using OdisseiaWiki.Models;

namespace OdisseiaWiki.Dtos
{
    public class ResultRegisterUsuario
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public Usuario? Usuario { get; set; }

        public static ResultRegisterUsuario Falha(string mensagem) => 
            new ResultRegisterUsuario { Sucesso = false, MensagemErro = mensagem };

        public static ResultRegisterUsuario Ok(Usuario usuario) => 
            new ResultRegisterUsuario { Sucesso = true, Usuario = usuario };
    }
}
