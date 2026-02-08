using System;
using System.Collections.Generic;
using System.Text.Json;

namespace OdisseiaWiki.Dtos
{
    public class InfoLoreDto
    {
        public int IdinfoLore { get; set; }
        public string Titulo { get; set; } = null!;
        public JsonElement? Descricao { get; set; }
        public string? Imagem { get; set; }
        public int? Ordem { get; set; }
        public List<string>? Tags { get; set; }
        public bool Visivel { get; set; } = true;
        public DateTime DataCriacao { get; set; }
    }
}