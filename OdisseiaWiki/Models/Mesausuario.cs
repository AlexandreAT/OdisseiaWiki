using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models;

public partial class Mesausuario
{
    [Key]
    public int IdmesaUsuario { get; set; }

    public int? Idmesa { get; set; }

    public int? Idusuario { get; set; }

    public virtual Mesa? IdmesaNavigation { get; set; }

    public virtual Usuario? IdusuarioNavigation { get; set; }
}
