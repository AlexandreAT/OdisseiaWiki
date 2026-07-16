namespace OdisseiaWiki.Dtos
{
    public class ResultSaveImage
    {
        public bool Sucesso { get; private set; }
        public string? Path { get; private set; }
        public string? Url => Path;
        public string? Provider { get; private set; }
        public string? PublicId { get; private set; }
        public string? MensagemErro { get; private set; }

        public static ResultSaveImage Ok(string path, string provider, string? publicId = null) => new()
        {
            Sucesso = true,
            Path = path,
            Provider = provider,
            PublicId = publicId,
        };

        public static ResultSaveImage Ok(string path) => Ok(path, "legacy");
        public static ResultSaveImage Fail(string mensagemErro) => new ResultSaveImage { Sucesso = false, MensagemErro = mensagemErro };
    }
}
