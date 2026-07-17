using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace OdisseiaWiki.Models;

public partial class Personagen : PersonagemBase
{
    [Key]
    public int Idpersonagem { get; set; }

    public string? Tags { get; set; }
    
    public bool Visivel { get; set; } = true;
    public bool Destaque { get; set; } = false;

    [NotMapped]
    [JsonPropertyName("proficiencias")]
    public List<ProficienciaResumoView> ProficienciasResumo { get; set; } = new();
}

public sealed class ProficienciaResumoView
{
    public int Idproficiencia { get; set; }
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
}
