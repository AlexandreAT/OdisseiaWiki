namespace OdisseiaWiki.Dtos
{
    public class ResultRaca
    {
        public bool Sucesso { get; private set; }
        public string? MensagemErro { get; private set; }
        public RacaDto? Raca { get; private set; }
        public List<RacaDto>? Racas { get; private set; }

        private ResultRaca(bool sucesso, string? mensagemErro = null, RacaDto? raca = null, List<RacaDto>? racas = null)
        {
            Sucesso = sucesso;
            MensagemErro = mensagemErro;
            Raca = raca;
            Racas = racas;
        }

        public static ResultRaca Ok(List<RacaDto> racas) => new(true, racas: racas);
        public static ResultRaca Ok(RacaDto raca) => new(true, raca: raca);
        public static ResultRaca Fail(string mensagemErro) => new(false, mensagemErro);
    }
}
