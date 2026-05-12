namespace OdisseiaWiki.Dtos
{
    public class CreatePageWithBlocksDto
    {
        public PageDto Page { get; set; } = null!;
        public List<PageBlockDto> Blocks { get; set; } = new();
    }
}
