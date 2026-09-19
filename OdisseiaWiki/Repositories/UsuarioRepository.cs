using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.Repositories
{
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly OdisseiaContext _context;

        public UsuarioRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Usuario>> GetAllAsync()
        {
            return await _context.Usuarios.AsNoTracking().ToListAsync();
        }

        public async Task<Usuario?> GetByIdAsync(int id)
        {
            return await _context.Usuarios.FindAsync(id);
        }

        public async Task<Usuario?> GetByEmailAsync(string email)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == email);
        }

        public Task<Usuario?> GetByLoginAsync(string login)
        {
            return login.Contains('@')
                ? GetByEmailAsync(login)
                : GetByNicknameAsync(login);
        }

        public async Task<Usuario?> GetByNameAsync(string nome)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Nome == nome);
        }

        public async Task<Usuario?> GetByNicknameAsync(string nickname)
        {
            return await _context.Usuarios.FirstOrDefaultAsync(u => u.Nickname.ToLower() == nickname.ToLower());
        }

        public Task<bool> NicknameExistsAsync(string nickname, int? excludingUserId = null)
            => _context.Usuarios.AsNoTracking().AnyAsync(usuario =>
                usuario.Nickname == nickname &&
                (!excludingUserId.HasValue || usuario.Idusuario != excludingUserId.Value));

        public async Task<Usuario> CreateAsync(Usuario usuario)
        {
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();
            return usuario;
        }

        public async Task<Usuario> UpdateAsync(Usuario usuario)
        {
            _context.Usuarios.Update(usuario);
            await _context.SaveChangesAsync();
            return usuario;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return false;

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<UsuarioExclusaoDados?> DeleteAccountAsync(int id)
        {
            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();
                Usuario? usuario = await _context.Usuarios.FirstOrDefaultAsync(item => item.Idusuario == id);
                if (usuario is null)
                    return null;

                List<PersonagemJogador> personagens = await _context.PersonagemJogadores
                    .Where(personagem => personagem.Idusuario == id)
                    .ToListAsync();
                int[] personagemIds = personagens
                    .Select(personagem => personagem.IdpersonagemJogador)
                    .ToArray();

                List<PersonagemProficiencia> proficiencias = personagemIds.Length == 0
                    ? new List<PersonagemProficiencia>()
                    : await _context.PersonagemProficiencias
                        .Where(link =>
                            (link.IdpersonagemJogador.HasValue && personagemIds.Contains(link.IdpersonagemJogador.Value)) ||
                            (EF.Property<int?>(link, "PersonagemJogadorIdpersonagemJogador").HasValue &&
                             personagemIds.Contains(EF.Property<int?>(link, "PersonagemJogadorIdpersonagemJogador")!.Value)))
                        .ToListAsync();

                List<Mesa> mesasCriadas = await _context.Mesas
                    .Where(mesa => mesa.IdusuarioCriacao == id)
                    .ToListAsync();
                List<Mesausuario> participacoes = await _context.Mesausuarios
                    .Where(link => link.Idusuario == id)
                    .ToListAsync();
                int[] mesasAfetadas = mesasCriadas.Select(mesa => mesa.Idmesa)
                    .Concat(personagens.Select(personagem => personagem.Idmesa))
                    .Concat(participacoes.Where(link => link.Idmesa.HasValue).Select(link => link.Idmesa!.Value))
                    .Distinct()
                    .ToArray();

                foreach (Mesa mesa in mesasCriadas)
                {
                    mesa.IdusuarioCriacao = null;
                    mesa.DataAtualizacao = DateTime.UtcNow;
                }

                _context.PersonagemProficiencias.RemoveRange(proficiencias);
                _context.PersonagemJogadores.RemoveRange(personagens);
                _context.Mesausuarios.RemoveRange(participacoes);
                _context.MesaSolicitacoesEntrada.RemoveRange(
                    await _context.MesaSolicitacoesEntrada.Where(pedido => pedido.Idusuario == id).ToListAsync());
                _context.MesaExpulsoesRegistro.RemoveRange(
                    await _context.MesaExpulsoesRegistro
                        .Where(registro => registro.Idusuario == id || registro.IdusuarioMestre == id)
                        .ToListAsync());
                _context.UsuariosEmailTokens.RemoveRange(
                    await _context.UsuariosEmailTokens.Where(token => token.Idusuario == id).ToListAsync());
                _context.Usuarios.Remove(usuario);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new UsuarioExclusaoDados
                {
                    ImagemPerfil = usuario.ImagemUrl,
                    Personagens = personagens,
                    MesasAfetadas = mesasAfetadas,
                };
            });
        }
    }
}
