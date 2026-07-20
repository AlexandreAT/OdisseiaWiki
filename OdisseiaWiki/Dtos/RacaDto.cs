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
        public List<ImagemGaleriaDto>? GaleriaImagem { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;
        public bool Destaque { get; set; } = false;
        public DateTime DataCriacao { get; set; }
    }
}
