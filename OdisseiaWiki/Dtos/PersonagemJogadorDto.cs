using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
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
        public int? IdSistemaVersao { get; set; }
        public bool Visivel { get; set; } = true;
        public string? Alinhamento { get; set; }
        public JsonElement? Historia { get; set; }
        public string? Imagem { get; set; }
        public List<string>? GaleriaImagem { get; set; }
        public int? Nanites { get; set; }
        public string? InfoSecundariasJson { get; set; }
        public List<string>? Costumes { get; set; }
        public List<string>? Tracos { get; set; }
        public object? InventarioJson { get; set; }
        public object? Skills { get; set; }
        public object? Magia { get; set; }
        public object? StatusJson { get; set; }
        public List<string>? PersonagemsVinculados { get; set; }
        public List<string>? Implantes { get; set; }
        public string? Ultimate { get; set; }
        public int? Idpassiva { get; set; }
        public DateTime DataCriacao { get; set; }
        public string? RacaNome { get; set; }
        public string? CidadeNome { get; set; }
        public string? MesaNome { get; set; }
        public string? AutorNome { get; set; }
        public string? AutorImagem { get; set; }
        public PersonagemVisibilidadeDto Visibilidade { get; set; } = PersonagemVisibilidadeDefaults.Jogador();
        public List<ProficienciaResumoDto> Proficiencias { get; set; } = new();
        public SistemaRuntimeContextoDto? SistemaRuntime { get; set; }
    }

    public class ProficienciaResumoDto
    {
        public int Idproficiencia { get; set; }
        public string Nome { get; set; } = null!;
        public string? Descricao { get; set; }
    }

    /// <summary>
    /// Atualização pequena usada pela Mesa em jogo. Mantém a ficha completa
    /// intacta e altera somente os recursos que o próprio jogador controla
    /// durante a sessão.
    /// </summary>
    public sealed class AtualizarRecursosPersonagemDto
    {
        [Range(0, int.MaxValue)]
        public int? Vida { get; set; }

        [Range(0, int.MaxValue)]
        public int? Mana { get; set; }

        [Range(0, int.MaxValue)]
        public int? Estamina { get; set; }

        [Range(0, int.MaxValue)]
        public int? Xp { get; set; }

        public bool PossuiAlteracao => Vida.HasValue || Mana.HasValue || Estamina.HasValue || Xp.HasValue;
    }
}
