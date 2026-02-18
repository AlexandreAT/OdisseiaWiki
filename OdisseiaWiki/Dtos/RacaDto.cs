using System;
using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class RacaDto
    {
        public int Idraca { get; set; }
        public string Nome { get; set; } = null!;
        public RacaStatusDto? StatusJson { get; set; }
        public string? Imagem { get; set; }
        public List<string>? GaleriaImagem { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;
        public DateTime DataCriacao { get; set; }
    }
}
