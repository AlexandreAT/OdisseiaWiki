using System;
using System.Collections.Generic;
using System.Text.Json;

namespace OdisseiaWiki.Dtos
{
    public class RacaDto
    {
        public int Idraca { get; set; }
        public string Nome { get; set; } = null!;
        public RacaStatusDto? StatusJson { get; set; }
        public JsonElement? Descricao { get; set; }
        public string? Imagem { get; set; }
        public List<ImagemGaleriaDto>? GaleriaImagem { get; set; }
        public List<RacaVariacaoDto>? Variacoes { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;
        public bool Destaque { get; set; } = false;
        public int? IdSistemaRpg { get; set; }
        public int? IdSistemaVersao { get; set; }
        public bool? AcompanharPublicacaoAtual { get; set; }
        public SistemaRuntimeContextoDto? SistemaRuntime { get; set; }
        public DateTime DataCriacao { get; set; }
    }
}
