using OdisseiaWiki.Models;

using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Repositories.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<List<Usuario>> GetAllAsync();
        Task<Usuario?> GetByIdAsync(int id);
        Task<Usuario> CreateAsync(Usuario usuario);
        Task<Usuario> UpdateAsync(Usuario usuario);
        Task<bool> DeleteAsync(int id);
        Task<Usuario?> GetByEmailAsync(string email);
        Task<Usuario?> GetByLoginAsync(string login);
        Task<Usuario?> GetByNameAsync(string username);
        Task<Usuario?> GetByNicknameAsync(string nickname);
        Task<bool> NicknameExistsAsync(string nickname, int? excludingUserId = null);
        Task<UsuarioExclusaoDados?> DeleteAccountAsync(int id);
    }
}
