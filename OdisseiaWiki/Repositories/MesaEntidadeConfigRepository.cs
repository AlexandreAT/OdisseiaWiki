using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public class MesaEntidadeConfigRepository : IMesaEntidadeConfigRepository
{
    private readonly OdisseiaContext _context;

    public MesaEntidadeConfigRepository(OdisseiaContext context) => _context = context;

    public Task<MesaEntidadeConfig?> GetAsync(int idMesa, MesaEntidadeTipo tipoEntidade, string idEntidade) =>
        _context.MesaEntidadeConfigs.FirstOrDefaultAsync(configuracao =>
            configuracao.Idmesa == idMesa &&
            configuracao.TipoEntidade == tipoEntidade &&
            configuracao.Identidade == idEntidade);

    public async Task<MesaEntidadeConfig> CreateAsync(MesaEntidadeConfig configuracao)
    {
        _context.MesaEntidadeConfigs.Add(configuracao);
        await _context.SaveChangesAsync();
        return configuracao;
    }

    public async Task<MesaEntidadeConfig> UpdateAsync(MesaEntidadeConfig configuracao)
    {
        _context.MesaEntidadeConfigs.Update(configuracao);
        await _context.SaveChangesAsync();
        return configuracao;
    }

    public async Task<bool> DeleteAsync(MesaEntidadeConfig configuracao)
    {
        _context.MesaEntidadeConfigs.Remove(configuracao);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EntityExistsAsync(MesaEntidadeTipo tipoEntidade, string idEntidade)
    {
        return tipoEntidade switch
        {
            MesaEntidadeTipo.Raca when int.TryParse(idEntidade, out var idRaca) =>
                await _context.Racas.AnyAsync(raca => raca.Idraca == idRaca),
            MesaEntidadeTipo.Item => await _context.Itens.AnyAsync(item => item.Iditem == idEntidade),
            MesaEntidadeTipo.Passiva when int.TryParse(idEntidade, out var idPassiva) =>
                await _context.Passivas.AnyAsync(passiva => passiva.Idpassiva == idPassiva),
            MesaEntidadeTipo.Proficiencia when int.TryParse(idEntidade, out var idProficiencia) =>
                await _context.Proficiencias.AnyAsync(proficiencia => proficiencia.Idproficiencia == idProficiencia),
            MesaEntidadeTipo.Cidade when int.TryParse(idEntidade, out var idCidade) =>
                await _context.Cidades.AnyAsync(cidade => cidade.Idcidade == idCidade),
            _ => false,
        };
    }
}
