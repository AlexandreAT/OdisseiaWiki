using OdisseiaWiki.Models;
using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class ResultRaca
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public RacaDto? Raca { get; set; }
        public List<RacaDto>? Racas { get; set; }

        public static ResultRaca Ok(RacaDto raca) => new() { Sucesso = true, Raca = raca };
        public static ResultRaca Ok(List<RacaDto> racas) => new() { Sucesso = true, Racas = racas };
        public static ResultRaca Fail(string mensagemErro) => new() { Sucesso = false, MensagemErro = mensagemErro };
    }
}
