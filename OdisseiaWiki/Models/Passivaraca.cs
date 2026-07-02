using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Models
{
    public partial class Passivaraca
    {
        [Key]
        public int IdpassivaRaca { get; set; }

        public int Idraca { get; set; }

        public int Idpassiva { get; set; }

        public virtual Raca Raca { get; set; } = null!;

        public virtual Passiva Passiva { get; set; } = null!;
    }
}
