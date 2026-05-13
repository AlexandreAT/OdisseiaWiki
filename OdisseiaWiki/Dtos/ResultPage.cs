namespace OdisseiaWiki.Dtos
{
    public class ResultPage
    {
        public bool Sucesso { get; set; }

        public string? MensagemErro { get; set; }

        public PageDto? Page { get; set; }

        public List<PageDto>? Pages { get; set; }

        public static ResultPage Ok(PageDto page)
            => new()
            {
                Sucesso = true,
                Page = page
            };

        public static ResultPage Ok(List<PageDto> pages)
            => new()
            {
                Sucesso = true,
                Pages = pages
            };

        public static ResultPage Fail(string erro)
            => new()
            {
                Sucesso = false,
                MensagemErro = erro
            };
    }
}
