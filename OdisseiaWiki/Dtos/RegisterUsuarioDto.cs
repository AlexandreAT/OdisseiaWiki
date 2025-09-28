namespace OdisseiaWiki.Dtos
{
    public class RegisterUsuarioDto
    {
        public string Nome { get; set; }
        public string Email { get; set; }
        public string Senha { get; set; }
        public string Nickname { get; set; }
        public string? ImagemUrl { get; set; }
    }
}
