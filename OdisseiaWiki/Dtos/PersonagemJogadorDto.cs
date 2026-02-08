using System;
using System.Collections.Generic;
using System.Text.Json;

namespace OdisseiaWiki.Dtos
{
    public class PersonagemJogadorDto
    {
        public int IdpersonagemJogador { get; set; }
        public string Nome { get; set; } = null!;
        public int Idraca { get; set; }
        public int? Idcidade { get; set; }
        public int Idmesa { get; set; }
        public int Idusuario { get; set; }
        public string? Alinhamento { get; set; }
        public JsonElement? Historia { get; set; }
        public string? Imagem { get; set; }
        public int? Nanites { get; set; }
        public string? InfoSecundariasJson { get; set; }
        public List<string>? Costumes { get; set; }
        public List<string>? Tracos { get; set; }
        public object? InventarioJson { get; set; }
        public object? Skills { get; set; }
        public object? Magia { get; set; }
        public object? StatusJson { get; set; }
        public List<string>? PersonagemsVinculados { get; set; }
        public DateTime DataCriacao { get; set; }
    }
}
