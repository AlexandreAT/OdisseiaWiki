using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;
using Microsoft.EntityFrameworkCore;

namespace OdisseiaWiki.Services
{
    public class MesaService : IMesaService
    {
        private readonly IMesaRepository _repository;

        public MesaService(IMesaRepository repository)
        {
            _repository = repository;
        }

        public async Task<ResultMesa> CreateAsync(MesaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultMesaFail("Nome é obrigatório.");

            var mesa = new Mesa
            {
                IdusuarioCriacao = dto.IdusuarioCriacao,
                Nome = dto.Nome,
                Imagem = dto.Imagem,
                DataCriacao = DateTime.UtcNow
            };

            var criada = await _repository.CreateAsync(mesa);
            return ResultMesaOk(criada);
        }

        public async Task<List<Mesa>> GetAllAsync()
            => await _repository.GetAllAsync();

        public async Task<Mesa> ObterMesaPadraoAsync()
        {
            var mesaPadrao = await _repository.GetByCodigoSistemaAsync(SystemMesaConstants.CodigoMesaPadrao);
            if (mesaPadrao is not null)
                return mesaPadrao;

            try
            {
                return await _repository.CreateAsync(new Mesa
                {
                    Nome = SystemMesaConstants.NomeMesaPadrao,
                    CodigoSistema = SystemMesaConstants.CodigoMesaPadrao,
                    PadraoSistema = true,
                    IdusuarioCriacao = null,
                    DataCriacao = DateTime.UtcNow,
                });
            }
            catch (DbUpdateException)
            {
                var mesaCriadaPorOutraInstancia = await _repository.GetByCodigoSistemaAsync(SystemMesaConstants.CodigoMesaPadrao);
                if (mesaCriadaPorOutraInstancia is not null)
                    return mesaCriadaPorOutraInstancia;

                throw;
            }
        }

        public async Task<ResultMesa> UpdateAsync(int id, MesaDto dto)
        {
            var mesa = await _repository.GetByIdAsync(id);
            if (mesa is null)
                return ResultMesaFail("Mesa não encontrada.");

            if (mesa.PadraoSistema)
                return ResultMesaFail("A mesa padrão do sistema não pode ser alterada.");

            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultMesaFail("Nome é obrigatório.");

            mesa.Nome = dto.Nome;
            mesa.Imagem = dto.Imagem;
            var atualizada = await _repository.UpdateAsync(mesa);
            return ResultMesaOk(atualizada);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var mesa = await _repository.GetByIdAsync(id);
            return mesa is not null && !mesa.PadraoSistema && await _repository.DeleteAsync(id);
        }

        private static ResultMesa ResultMesaFail(string mensagem)
            => new() { Sucesso = false, MensagemErro = mensagem };

        private static ResultMesa ResultMesaOk(Mesa mesa)
            => new() { Sucesso = true, Mesa = mesa };
    }
}
