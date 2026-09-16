namespace OdisseiaWiki.Dtos
{
    public class ResultLoginUsuario
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public string? TokenJwt { get; set; }
        public bool EmailNaoConfirmado { get; set; }
        public string? Email { get; set; }

        public static ResultLoginUsuario Ok(string token) =>
            new ResultLoginUsuario { Sucesso = true, TokenJwt = token };

        public static ResultLoginUsuario Falha(
            string mensagem,
            bool emailNaoConfirmado = false,
            string? email = null) =>
            new ResultLoginUsuario
            {
                Sucesso = false,
                MensagemErro = mensagem,
                EmailNaoConfirmado = emailNaoConfirmado,
                Email = email,
            };
    }
}
