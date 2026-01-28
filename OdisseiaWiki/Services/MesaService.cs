using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;

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

        private static ResultMesa ResultMesaFail(string mensagem)
            => new() { Sucesso = false, MensagemErro = mensagem };

        private static ResultMesa ResultMesaOk(Mesa mesa)
            => new() { Sucesso = true, Mesa = mesa };
    }
}