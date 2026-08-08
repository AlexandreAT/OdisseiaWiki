using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories
{
    public class PersonagemRepository : IPersonagemRepository
    {
        private readonly OdisseiaContext _context;

        public PersonagemRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Personagen>> GetAllAsync(bool? visivel = null)
        {
            var query = _context.Personagens.AsNoTracking();

            if (visivel.HasValue)
                query = query.Where(p => p.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public async Task<Personagen?> GetByIdAsync(int id)
            => await _context.Personagens.FindAsync(id);

        public async Task<List<ProficienciaResumoView>> GetProficienciasByPersonagemIdAsync(int id)
            => await _context.PersonagemProficiencias
                .AsNoTracking()
                .Where(link => link.Idpersonagem == id)
                .Join(
                    _context.Proficiencias.AsNoTracking(),
                    link => link.Idproficiencia,
                    proficiencia => proficiencia.Idproficiencia,
                    (_, proficiencia) => new ProficienciaResumoView
                    {
                        Idproficiencia = proficiencia.Idproficiencia,
                        Nome = proficiencia.Nome,
                        Descricao = proficiencia.Descricao,
                    })
                .ToListAsync();

        public async Task<Personagen> CreateAsync(Personagen personagem)
        {
            _context.Personagens.Add(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<Personagen> UpdateAsync(Personagen personagem)
        {
            _context.Personagens.Update(personagem);
            await _context.SaveChangesAsync();
            return personagem;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var personagem = await _context.Personagens.FindAsync(id);
            if (personagem == null) return false;

            _context.Personagens.Remove(personagem);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Personagen>> SearchAsync(string termo)
        {
            var termoLower = termo.ToLower();

            var personagens = await _context.Personagens
                .AsNoTracking()
                .ToListAsync();

            return personagens.Where(i =>
                i.Nome.ToLower().Contains(termoLower) ||
                (JsonSafeHelper.DeserializeTags(i.Tags)?
                    .Any(tag => tag.ToLower().Contains(termoLower)) ?? false)
            ).ToList();
        }

        public async Task<List<Personagen>> GetBatchAsync(List<int> ids)
        {
            return await _context.Personagens
                .AsNoTracking()
                .Where(p => ids.Contains(p.Idpersonagem))
                .ToListAsync();
        }

        public async Task<List<PersonagemComparacaoRegistro>> SearchVisibleForComparisonAsync(
            string term,
            int? excludedId,
            int limit)
        {
            string pattern = $"%{term.Trim()}%";

            return await _context.Personagens
                .AsNoTracking()
                .Where(personagem => personagem.Visivel)
                .Where(personagem => !excludedId.HasValue || personagem.Idpersonagem != excludedId.Value)
                .Where(personagem => EF.Functions.Like(personagem.Nome, pattern))
                .OrderBy(personagem => personagem.Nome)
                .Take(limit)
                .Select(personagem => new PersonagemComparacaoRegistro
                {
                    Id = personagem.Idpersonagem,
                    Jogador = false,
                    Nome = personagem.Nome,
                    Imagem = personagem.Imagem,
                    IdRaca = personagem.Idraca,
                    StatusJson = personagem.StatusJson,
                    SkillsJson = personagem.Skills,
                })
                .ToListAsync();
        }

        public async Task<PersonagemComparacaoRegistro?> GetForComparisonAsync(int id, bool requireVisible)
            => await _context.Personagens
                .AsNoTracking()
                .Where(personagem => personagem.Idpersonagem == id)
                .Where(personagem => !requireVisible || personagem.Visivel)
                .Select(personagem => new PersonagemComparacaoRegistro
                {
                    Id = personagem.Idpersonagem,
                    Jogador = false,
                    Nome = personagem.Nome,
                    Imagem = personagem.Imagem,
                    IdRaca = personagem.Idraca,
                    StatusJson = personagem.StatusJson,
                    SkillsJson = personagem.Skills,
                })
                .FirstOrDefaultAsync();
    }
}
