using OdisseiaWiki.Models;

namespace OdisseiaWiki.Dtos
{
    public class ResultPersonagem
    {
        public bool Sucesso { get; private set; }
        public string? MensagemErro { get; private set; }
        public Personagen? Personagem { get; private set; }
        public SistemaRuntimeContextoDto? SistemaRuntime => Personagem?.SistemaRuntime;
        public IReadOnlyList<SistemaRuntimeWarningDto> Warnings =>
            Personagem?.SistemaRuntime?.Warnings is { } warnings
                ? warnings
                : Array.Empty<SistemaRuntimeWarningDto>();

        private ResultPersonagem(bool sucesso, string? mensagemErro, Personagen? personagem)
        {
            Sucesso = sucesso;
            MensagemErro = mensagemErro;
            Personagem = personagem;
        }

        public static ResultPersonagem Ok(Personagen personagem)
            => new(true, null, personagem);

        public static ResultPersonagem Fail(string mensagemErro)
            => new(false, mensagemErro, null);
    }
}
