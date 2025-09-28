using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OdisseiaWiki.Models
{
    public abstract class PersonagemBase
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string Nome { get; set; } = null!;

        [Required(ErrorMessage = "A raça é obrigatória.")]
        public int Idraca { get; set; }

        public int? Idcidade { get; set; }

        [Required(ErrorMessage = "O StatusJson é obrigatório.")]
        public string StatusJson { get; set; } = null!;

        [MaxLength(50)]
        public string? Alinhamento { get; set; }

        public string? Tracos { get; set; }
        public string? Costumes { get; set; }

        [MaxLength(150)]
        public string? Imagem { get; set; }
        public string? GaleriaImagem { get; set; }

        public string? InventarioJson { get; set; }
        public string? Skills { get; set; }
        public string? Magia { get; set; }
        public string? Historia { get; set; }
        public string? PersonagemsVinculados { get; set; }

        [MaxLength(50)]
        public string? Nanites { get; set; }

        [Column(TypeName = "date")]
        public DateOnly DataCriacao { get; set; }

        public virtual Cidade? IdcidadeNavigation { get; set; }
        public virtual Raca IdracaNavigation { get; set; } = null!;
    }
}