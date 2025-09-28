using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Dtos
{
    public class ItemUpdateDto : ItemCreateDto
    {
        [Required]
        public string Iditem { get; set; }
    }
}
