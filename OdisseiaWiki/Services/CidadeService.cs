using OdisseiaWiki.Dtos;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class CidadeService : ICidadeService
    {
        private readonly ICidadeRepository _repository;

        public CidadeService(ICidadeRepository repository)
        {
            _repository = repository;
        }

        public async Task<ResultCidade> GetAllAsync()
        {
            var cidades = await _repository.GetAllAsync();

            var dtos = cidades.Select(c => new CidadeDto
            {
                Idcidade = c.Idcidade,
                Nome = c.Nome,
                Descricao = c.Descricao,
                Imagem = c.Imagem,
                GaleriaImagem = !string.IsNullOrWhiteSpace(c.GaleriaImagem)
                    ? JsonSerializer.Deserialize<List<string>>(c.GaleriaImagem)
                    : null
            }).ToList();

            return ResultCidade.Ok(dtos);
        }
    }
}
