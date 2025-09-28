﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OdisseiaWiki.Models;

public partial class Cidade
{
    [Key]
    public int Idcidade { get; set; }

    [Required(ErrorMessage = "O nome é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = null!;

    public string? Descricao { get; set; }

    [MaxLength(255, ErrorMessage = "O caminho da imagem deve ter no máximo 255 caracteres.")]
    public string? Imagem { get; set; }

    public string? GaleriaImagem { get; set; }

    [Column(TypeName = "date")]
    public DateOnly DataCriacao { get; set; }

    public virtual ICollection<Personagen> Personagens { get; set; } = new List<Personagen>();
}
