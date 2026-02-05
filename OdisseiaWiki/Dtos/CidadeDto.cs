using System;
using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class CidadeDto
    {
        public int Idcidade { get; set; }
        public string Nome { get; set; } = null!;
        public string? Descricao { get; set; }
        public string? Imagem { get; set; }
        public List<string>? GaleriaImagem { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;
        public DateTime DataCriacao { get; set; }
    }
}
