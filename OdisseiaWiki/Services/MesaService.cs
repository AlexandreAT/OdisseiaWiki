using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Services
{
    public class MesaService : IMesaService
    {
        private readonly IMesaRepository _repository;
        private readonly IAssetService _assetService;
        private readonly ISistemaRpgService _sistemaRpgService;
        private readonly ISistemaRpgResolver _sistemaRpgResolver;

        public MesaService(
            IMesaRepository repository,
            IAssetService assetService,
            ISistemaRpgService sistemaRpgService,
            ISistemaRpgResolver sistemaRpgResolver)
        {
            _repository = repository;
            _assetService = assetService;
            _sistemaRpgService = sistemaRpgService;
            _sistemaRpgResolver = sistemaRpgResolver;
        }

        public async Task<ResultMesa> CreateAsync(MesaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultMesaFail("Nome é obrigatório.");

            int? idSistemaVersao = dto.IdSistemaVersao;
            if (idSistemaVersao.HasValue)
            {
                var validacao = await _sistemaRpgService.ValidarVersaoSelecionavelAsync(idSistemaVersao.Value);
                if (!validacao.Sucesso)
                    return ResultMesaFail(validacao.MensagemErro ?? "A versão do sistema não pode ser usada por uma nova mesa.");
            }
            else
            {
                idSistemaVersao = await ResolverVersaoPadraoAsync();
            }

            var mesa = new Mesa
            {
                IdusuarioCriacao = dto.IdusuarioCriacao,
                Nome = dto.Nome,
                Imagem = dto.Imagem,
                IdSistemaVersao = idSistemaVersao,
                DataCriacao = DateTime.UtcNow
            };

            var criada = await _repository.CreateAsync(mesa);
            return ResultMesaOk(criada);
        }

        public async Task<List<Mesa>> GetAllAsync()
            => await _repository.GetAllAsync();

        public Task<Mesa?> GetByIdAsync(int id)
            => _repository.GetByIdAsync(id);

        public Task<List<Mesa>> GetAccessibleAsync(int idUsuario)
            => _repository.GetAccessibleByUsuarioIdAsync(idUsuario);

        public Task<bool> IsOwnerAsync(int idMesa, int idUsuario)
            => _repository.IsOwnerAsync(idMesa, idUsuario);

        public Task<bool> CanUseAsync(int idMesa, int idUsuario)
            => _repository.UsuarioPodeUsarMesaAsync(idMesa, idUsuario);

        public async Task<Mesa> ObterMesaPadraoAsync()
        {
            int? idSistemaVersao = await ResolverVersaoPadraoAsync();
            return await _repository.EnsureSystemDefaultAsync(
                SystemMesaConstants.CodigoMesaPadrao,
                SystemMesaConstants.NomeMesaPadrao,
                idSistemaVersao);
        }

        public async Task<ResultMesa> UpdateAsync(int id, MesaDto dto)
        {
            var mesa = await _repository.GetByIdAsync(id);
            if (mesa is null)
                return ResultMesaFail("Mesa não encontrada.");

            if (EhMesaPadraoFixa(mesa))
                return ResultMesaFail("A mesa padrão do sistema não pode ser alterada.");

            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultMesaFail("Nome é obrigatório.");

            string? oldImage = mesa.Imagem;
            mesa.Nome = dto.Nome;
            mesa.Imagem = dto.Imagem;
            var atualizada = await _repository.UpdateAsync(mesa);
            if (!string.Equals(oldImage, atualizada.Imagem, StringComparison.Ordinal))
                await _assetService.DeleteIfUnreferencedAsync(oldImage);
            return ResultMesaOk(atualizada);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var mesa = await _repository.GetByIdAsync(id);
            if (mesa is null || EhMesaPadraoFixa(mesa))
                return false;

            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await _assetService.DeleteIfUnreferencedAsync(mesa.Imagem);
            return deleted;
        }

        private static ResultMesa ResultMesaFail(string mensagem)
            => new() { Sucesso = false, MensagemErro = mensagem };

        private static ResultMesa ResultMesaOk(Mesa mesa)
            => new() { Sucesso = true, Mesa = mesa };

        private async Task<int?> ResolverVersaoPadraoAsync()
        {
            SistemaResolvidoDto sistemaResolvido = await _sistemaRpgResolver.ResolverAsync();
            return sistemaResolvido.UsaFallbackLegado
                ? null
                : sistemaResolvido.IdSistemaVersao;
        }

        private static bool EhMesaPadraoFixa(Mesa mesa) =>
            string.Equals(
                mesa.CodigoSistema,
                SystemMesaConstants.CodigoMesaPadrao,
                StringComparison.OrdinalIgnoreCase) ||
            mesa.PadraoSistema;
    }
}
