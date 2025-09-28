using System;
using System.Collections.Generic;

namespace OdisseiaWiki.Models;

public partial class Mesaracaconfig
{
    public int IdmesaRacaConfig { get; set; }

    public int Idmesa { get; set; }

    public int Idraca { get; set; }

    public string? StatusJson { get; set; }

    public virtual Mesa IdmesaNavigation { get; set; } = null!;

    public virtual Raca IdracaNavigation { get; set; } = null!;
}
