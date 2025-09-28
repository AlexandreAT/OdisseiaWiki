namespace OdisseiaWiki.Dtos
{
    public class ResultCidade
    {
        public bool Sucesso { get; private set; }
        public string? MensagemErro { get; private set; }
        public CidadeDto? Cidade { get; private set; }
        public List<CidadeDto>? Cidades { get; private set; }

        private ResultCidade(bool sucesso, string? mensagemErro = null, CidadeDto? cidade = null, List<CidadeDto>? cidades = null)
        {
            Sucesso = sucesso;
            MensagemErro = mensagemErro;
            Cidade = cidade;
            Cidades = cidades;
        }

        public static ResultCidade Ok(List<CidadeDto> cidades) => new(true, cidades: cidades);
        public static ResultCidade Ok(CidadeDto cidade) => new(true, cidade: cidade);
        public static ResultCidade Fail(string mensagemErro) => new(false, mensagemErro);
    }
}
