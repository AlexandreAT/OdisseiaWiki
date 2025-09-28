namespace OdisseiaWiki.Dtos
{
    public class ResultSaveImage
    {
        public bool Sucesso { get; private set; }
        public string? Path { get; private set; }
        public string? MensagemErro { get; private set; }

        public static ResultSaveImage Ok(string path) => new ResultSaveImage { Sucesso = true, Path = path };
        public static ResultSaveImage Fail(string mensagemErro) => new ResultSaveImage { Sucesso = false, MensagemErro = mensagemErro };
    }
}
