using OdisseiaWiki.Dtos;
using OdisseiaWiki.Dtos.OdisseiaWiki.Dtos;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class RacaService : IRacaService
    {
        private readonly IRacaRepository _repository;

        public RacaService(IRacaRepository repository)
        {
            _repository = repository;
        }

        public async Task<ResultRaca> GetAllAsync()
        {
            var racas = await _repository.GetAllAsync();

            var dtos = racas.Select(r => new RacaDto
            {
                Idraca = r.Idraca,
                Nome = r.Nome,
                StatusJson = !string.IsNullOrWhiteSpace(r.StatusJson)
                    ? JsonSerializer.Deserialize<RacaStatusDto>(r.StatusJson)
                    : null,
                Imagem = r.Imagem,
                GaleriaImagem = !string.IsNullOrWhiteSpace(r.GaleriaImagem)
                    ? JsonSerializer.Deserialize<List<string>>(r.GaleriaImagem)
                    : null
            }).ToList();

            return ResultRaca.Ok(dtos);
        }
    }
}
