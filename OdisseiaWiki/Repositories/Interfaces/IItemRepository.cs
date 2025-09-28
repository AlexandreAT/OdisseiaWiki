namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IItemRepository
    {
        Task<IEnumerable<Item>> GetAllAsync();
        Task<Item?> GetByIdAsync(string id);
        Task AddAsync(Item item);
        Task UpdateAsync(Item item);
        Task DeleteAsync(string id);
    }
}
