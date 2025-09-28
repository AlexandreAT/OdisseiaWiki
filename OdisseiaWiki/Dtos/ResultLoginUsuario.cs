namespace OdisseiaWiki.Dtos
{
    public class ResultLoginUsuario
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public string? TokenJwt { get; set; }

        public static ResultLoginUsuario Ok(string token) =>
            new ResultLoginUsuario { Sucesso = true, TokenJwt = token };

        public static ResultLoginUsuario Falha(string mensagem) =>
            new ResultLoginUsuario { Sucesso = false, MensagemErro = mensagem };
    }
}
