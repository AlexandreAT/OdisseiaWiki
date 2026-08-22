using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Models;

public partial class Personagen : PersonagemBase
{
    [Key]
    public int Idpersonagem { get; set; }

    public string? Tags { get; set; }
    
    public bool Visivel { get; set; } = true;
    public bool Destaque { get; set; } = false;

    public int? IdSistemaRpg { get; set; }

    public int? IdSistemaVersao { get; set; }

    public bool AcompanharPublicacaoAtual { get; set; } = true;

    [JsonIgnore]
    public virtual SistemaRpg? SistemaRpg { get; set; }

    [JsonIgnore]
    public virtual SistemaVersao? SistemaVersao { get; set; }

    [JsonIgnore]
    public virtual PersonagemVisibilidade? ConfiguracaoVisibilidade { get; set; }

    [NotMapped]
    [JsonPropertyName("visibilidade")]
    public PersonagemVisibilidadeDto Visibilidade { get; set; } = PersonagemVisibilidadeDefaults.Npc();

    [NotMapped]
    [JsonPropertyName("proficiencias")]
    public List<ProficienciaResumoView> ProficienciasResumo { get; set; } = new();

    [NotMapped]
    [JsonPropertyName("sistemaRuntime")]
    public SistemaRuntimeContextoDto? SistemaRuntime { get; set; }
}

public sealed class ProficienciaResumoView
{
    public int Idproficiencia { get; set; }
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
}
