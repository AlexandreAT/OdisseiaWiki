using OdisseiaWiki.Enums;
using System.Text.Json;

namespace OdisseiaWiki.Dtos
{
    public class PageBlockDto
    {
        public PageBlockType Tipo { get; set; }
        public object Conteudo { get; set; } = null!;
        public int Ordem { get; set; }
    }
}
