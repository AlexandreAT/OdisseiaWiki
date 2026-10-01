using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using System.Collections.Generic;
using OdisseiaWiki.Dtos;
using System.Linq;
using System.Threading.Tasks;

namespace OdisseiaWiki.Repositories
{
    public class RacaRepository : IRacaRepository
    {
        private readonly OdisseiaContext _context;

        public RacaRepository(OdisseiaContext context)
        {
            _context = context;
        }

        public async Task<List<Raca>> GetAllAsync(bool? visivel = null, int? idWikiEscopo = null)
        {
            var query = _context.Racas.AsNoTracking()
                .Where(raca => raca.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

            if (visivel.HasValue)
                query = query.Where(r => r.Visivel == visivel.Value);

            return await query.ToListAsync();
        }

        public Task<Raca?> GetByIdAsync(int id) => GetByIdAsync(id, null);

        public async Task<Raca?> GetByIdAsync(int id, int? idWikiEscopo)
            => await _context.Racas.FirstOrDefaultAsync(raca =>
                raca.Idraca == id &&
                raca.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial));

        public async Task<Raca> CreateAsync(Raca raca)
        {
            _context.Racas.Add(raca);
            await _context.SaveChangesAsync();
            return raca;
        }

        public async Task<Raca> UpdateAsync(Raca raca)
        {
            _context.Racas.Update(raca);
            await _context.SaveChangesAsync();
            return raca;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var raca = await _context.Racas.FindAsync(id);
            if (raca == null) return false;

            _context.Racas.Remove(raca);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Raca>> SearchAsync(string termo, int? idWikiEscopo = null)
        {
            var termoLower = termo.ToLower();

            var racas = await _context.Racas
                .AsNoTracking()
                .Where(raca => raca.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .ToListAsync();

            return racas.Where(i =>
                i.Nome.ToLower().Contains(termoLower) ||
                (JsonSafeHelper.DeserializeTags(i.Tags)?
                    .Any(tag => tag.ToLower().Contains(termoLower)) ?? false)
            ).ToList();
        }

        public async Task<List<Raca>> GetBatchAsync(List<int> ids, int? idWikiEscopo = null)
        {
            return await _context.Racas
                .AsNoTracking()
                .Where(r => ids.Contains(r.Idraca) &&
                    r.IdWikiEscopo == (idWikiEscopo ?? WikiEscopo.IdOficial))
                .ToListAsync();
        }

        public async Task<List<RacaPassivaDto>> SyncPassivasAsync(
            int idRaca,
            IReadOnlyCollection<RacaPassivaDto> passivas,
            int? idWikiEscopo = null)
        {
            List<Passivaraca> links = await _context.Passivaracas
                .Include(link => link.Passiva)
                .Where(link => link.Idraca == idRaca)
                .ToListAsync();
            var retainedPassives = new List<Passiva>();

            foreach (RacaPassivaDto dto in passivas)
            {
                string nome = dto.Nome!.Trim();
                Passiva? passive = dto.IdPassiva.HasValue
                    ? links.FirstOrDefault(link => link.Idpassiva == dto.IdPassiva.Value)?.Passiva
                    : links.Select(link => link.Passiva).FirstOrDefault(entry =>
                        string.Equals(entry.Nome, nome, StringComparison.OrdinalIgnoreCase));
                passive ??= new Passiva
                {
                    Nome = nome,
                    IdWikiEscopo = idWikiEscopo ?? WikiEscopo.IdOficial,
                    DataCriacao = DateTime.UtcNow,
                };
                passive.Nome = nome;
                passive.Descricao = dto.Efeito;
                passive.Visivel = true;
                if (passive.Idpassiva == 0) _context.Passivas.Add(passive);

                Passivaraca? link = links.FirstOrDefault(entry => entry.Passiva == passive ||
                    (passive.Idpassiva != 0 && entry.Idpassiva == passive.Idpassiva));
                if (link is null)
                {
                    link = new Passivaraca { Idraca = idRaca, Passiva = passive };
                    _context.Passivaracas.Add(link);
                    links.Add(link);
                }

                if (!retainedPassives.Contains(passive)) retainedPassives.Add(passive);
            }

            _context.Passivaracas.RemoveRange(links.Where(link =>
                !retainedPassives.Contains(link.Passiva)));
            await _context.SaveChangesAsync();
            return retainedPassives.Select(passive => new RacaPassivaDto
            {
                IdPassiva = passive.Idpassiva,
                Nome = passive.Nome,
                Efeito = passive.Descricao,
            }).ToList();
        }
    }
}
