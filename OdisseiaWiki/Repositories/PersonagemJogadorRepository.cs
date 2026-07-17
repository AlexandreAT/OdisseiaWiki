using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories
{
    public class PersonagemJogadorRepository : IPersonagemJogadorRepository
    {
        private readonly OdisseiaContext _context;

        public PersonagemJogadorRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<PersonagemJogador>> GetAllAsync()
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .ToListAsync();

        public async Task<List<PersonagemJogador>> GetByIdsAsync(IEnumerable<int> ids)
        {
            int[] normalizedIds = ids.Distinct().ToArray();
            if (normalizedIds.Length == 0)
                return new List<PersonagemJogador>();

            return await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .Where(p => normalizedIds.Contains(p.IdpersonagemJogador))
                .ToListAsync();
        }

        public async Task<PersonagemJogador?> GetByIdAsync(int id) => await _context.PersonagemJogadores.FindAsync(id);

        public async Task<PersonagemJogador?> GetByIdWithDetailsAsync(int id)
            => await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .FirstOrDefaultAsync(p => p.IdpersonagemJogador == id);

        public async Task<List<PersonagemJogador>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.PersonagemJogadores
                .AsNoTracking()
                .Include(p => p.IdracaNavigation)
                .Include(p => p.IdcidadeNavigation)
                .Include(p => p.Mesa)
                .Include(p => p.Usuario)
                .Where(p => p.Idusuario == usuarioId)
                .ToListAsync();
        }

        public async Task<Dictionary<int, List<Proficiencia>>> GetProficienciasByPersonagemIdsAsync(IEnumerable<int> personagemIds)
        {
            int[] ids = personagemIds.Distinct().ToArray();
            if (ids.Length == 0)
                return new Dictionary<int, List<Proficiencia>>();

            var rows = await _context.PersonagemProficiencias
                .AsNoTracking()
                .Where(link => link.IdpersonagemJogador.HasValue && ids.Contains(link.IdpersonagemJogador.Value))
                .Join(
                    _context.Proficiencias.AsNoTracking(),
                    link => link.Idproficiencia,
                    proficiencia => proficiencia.Idproficiencia,
                    (link, proficiencia) => new
                    {
                        PersonagemId = link.IdpersonagemJogador!.Value,
                        Proficiencia = proficiencia,
                    })
                .ToListAsync();

            return rows
                .GroupBy(row => row.PersonagemId)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(row => row.Proficiencia).ToList());
        }


        public async Task<PersonagemJogador> CreateAsync(PersonagemJogador personagem)
        {
            _context.PersonagemJogadores.Add(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<PersonagemJogador> UpdateAsync(PersonagemJogador personagem)
        {
            _context.PersonagemJogadores.Update(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await DeleteManyAsync(new[] { id }) == 1;
        }

        public async Task<int> DeleteManyAsync(IEnumerable<int> ids)
        {
            int[] normalizedIds = ids.Distinct().ToArray();
            if (normalizedIds.Length == 0)
                return 0;

            await using var transaction = await _context.Database.BeginTransactionAsync();

            List<PersonagemJogador> personagens = await _context.PersonagemJogadores
                .Where(p => normalizedIds.Contains(p.IdpersonagemJogador))
                .ToListAsync();

            if (personagens.Count != normalizedIds.Length)
                return 0;

            List<PersonagemProficiencia> proficiencyLinks = await _context.PersonagemProficiencias
                .Where(link =>
                    (link.IdpersonagemJogador.HasValue && normalizedIds.Contains(link.IdpersonagemJogador.Value)) ||
                    (EF.Property<int?>(link, "PersonagemJogadorIdpersonagemJogador").HasValue &&
                     normalizedIds.Contains(EF.Property<int?>(link, "PersonagemJogadorIdpersonagemJogador")!.Value)))
                .ToListAsync();

            _context.PersonagemProficiencias.RemoveRange(proficiencyLinks);
            _context.PersonagemJogadores.RemoveRange(personagens);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return personagens.Count;
        }
    }
}
