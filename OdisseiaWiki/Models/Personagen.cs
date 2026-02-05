using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OdisseiaWiki.Models;

public partial class Personagen : PersonagemBase
{
    [Key]
    public int Idpersonagem { get; set; }

    public string? Tags { get; set; }
    
    public bool Visivel { get; set; } = true;
}
