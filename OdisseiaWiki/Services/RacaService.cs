using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Helpers;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace OdisseiaWiki.Services
{
    public class RacaService : IRacaService
    {
        private readonly IRacaRepository _repository;
        private readonly IMesaEntidadeConfigService _mesaEntidadeConfigService;
        private readonly IAssetService _assetService;
        private readonly ISistemaRpgResolver _sistemaRpgResolver;
        private readonly ISistemaEntidadeVinculoService _sistemaEntidadeVinculoService;

        public RacaService(
            IRacaRepository repository,
            IMesaEntidadeConfigService mesaEntidadeConfigService,
            IAssetService assetService,
            ISistemaRpgResolver sistemaRpgResolver,
            ISistemaEntidadeVinculoService sistemaEntidadeVinculoService)
        {
            _repository = repository;
            _mesaEntidadeConfigService = mesaEntidadeConfigService;
            _assetService = assetService;
            _sistemaRpgResolver = sistemaRpgResolver;
            _sistemaEntidadeVinculoService = sistemaEntidadeVinculoService;
        }

        public async Task<ResultRaca> CreateAsync(RacaDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nome))
                return ResultRaca.Fail("O nome é obrigatório.");

            if (!TryNormalizeStatus(dto.StatusJson, out RacaStatusDto? status, out string? statusError))
                return ResultRaca.Fail(statusError!);

            if (!TryNormalizeVariacoes(dto.Variacoes, out List<RacaVariacaoDto>? variacoes, out string? variacoesError))
                return ResultRaca.Fail(variacoesError!);

            SistemaEntidadeVinculoResultado vinculo = await _sistemaEntidadeVinculoService.ValidarAsync(
                dto.IdSistemaRpg,
                dto.IdSistemaVersao,
                dto.AcompanharPublicacaoAtual ?? true);
            if (!vinculo.Sucesso)
                return ResultRaca.Fail(vinculo.MensagemErro!);

            var raca = new Raca
            {
                Nome = dto.Nome.Trim(),
                StatusJson = status != null
                    ? JsonSerializer.Serialize(status)
                    : null,
                Descricao = RichTextHelper.SerializeRichText(dto.Descricao),
                Imagem = dto.Imagem,
                GaleriaImagem = dto.GaleriaImagem != null && dto.GaleriaImagem.Any()
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null,
                Variacoes = variacoes != null && variacoes.Count > 0
                    ? JsonSerializer.Serialize(variacoes)
                    : null,
                Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(dto.Tags, ContentCategoryHelper.Raca)),
                Visivel = dto.Visivel,
                Destaque = dto.Destaque,
                IdSistemaRpg = vinculo.IdSistemaRpg,
                IdSistemaVersao = vinculo.IdSistemaVersao,
                AcompanharPublicacaoAtual = vinculo.AcompanharPublicacaoAtual,
                DataCriacao = DateTime.UtcNow
            };

            var criada = await _repository.CreateAsync(raca);
            return ResultRaca.Ok(MapToDto(criada));
        }

        public async Task<ResultRaca> UpdateAsync(int id, RacaDto dto)
        {
            var raca = await _repository.GetByIdAsync(id);
            if (raca == null)
                return ResultRaca.Fail($"Raça com id {id} não encontrada.");

            HashSet<string> oldAssets = AssetReferenceHelper.Extract(
                raca.Imagem, raca.GaleriaImagem, raca.Variacoes, raca.Descricao);

            bool alterarVinculo = dto.AcompanharPublicacaoAtual.HasValue ||
                dto.IdSistemaRpg.HasValue ||
                dto.IdSistemaVersao.HasValue;
            if (alterarVinculo)
            {
                SistemaEntidadeVinculoResultado vinculo = await _sistemaEntidadeVinculoService.ValidarAsync(
                    dto.IdSistemaRpg,
                    dto.IdSistemaVersao,
                    dto.AcompanharPublicacaoAtual ?? raca.AcompanharPublicacaoAtual,
                    new SistemaEntidadeVinculoExistente(
                        raca.IdSistemaRpg,
                        raca.IdSistemaVersao,
                        raca.AcompanharPublicacaoAtual));
                if (!vinculo.Sucesso)
                    return ResultRaca.Fail(vinculo.MensagemErro!);

                raca.IdSistemaRpg = vinculo.IdSistemaRpg;
                raca.IdSistemaVersao = vinculo.IdSistemaVersao;
                raca.AcompanharPublicacaoAtual = vinculo.AcompanharPublicacaoAtual;
            }

            raca.Nome = string.IsNullOrWhiteSpace(dto.Nome) ? raca.Nome : dto.Nome.Trim();
            SistemaRuntimeConsultaDto consultaRuntime = new()
            {
                TipoEntidade = Enums.SistemaEntidadeGlobalTipo.Raca,
                IdEntidade = raca.Idraca.ToString(),
                IdRaca = raca.Idraca,
            };
            SistemaRuntimeContextoDto contextoAtual = await _sistemaRpgResolver.ResolverContextoAsync(
                consultaRuntime,
                new SistemaEntidadeGlobalVinculoSnapshot
                {
                    TipoEntidade = Enums.SistemaEntidadeGlobalTipo.Raca,
                    IdEntidade = raca.Idraca.ToString(),
                    IdSistemaRpg = raca.IdSistemaRpg,
                    IdSistemaVersao = raca.IdSistemaVersao,
                    AcompanharPublicacaoAtual = raca.AcompanharPublicacaoAtual,
                    EstadoJson = raca.StatusJson,
                });
            bool sistemaPadrao = string.Equals(
                contextoAtual.CodigoSistema,
                SistemaRpgConfiguration.CodigoPadrao,
                StringComparison.OrdinalIgnoreCase);
            bool configuracaoMecanicaVersionada = !sistemaPadrao &&
                contextoAtual.ConfiguracaoRacial is not null &&
                !contextoAtual.Fallbacks.Any(fallback =>
                    fallback.Caminho.StartsWith("configuracaoRacial", StringComparison.OrdinalIgnoreCase));

            // No ODISSEIA, a entidade da Wiki é a fonte oficial. Somente Sistemas
            // adicionais podem substituir seus valores por configuração versionada.
            if (dto.StatusJson is not null && !configuracaoMecanicaVersionada)
            {
                if (!TryNormalizeStatus(dto.StatusJson, out RacaStatusDto? status, out string? statusError))
                    return ResultRaca.Fail(statusError!);

                raca.StatusJson = status is null ? null : JsonSerializer.Serialize(status);
            }
            raca.Descricao = dto.Descricao.HasValue
                ? RichTextHelper.SerializeRichText(dto.Descricao)
                : raca.Descricao;
            raca.Imagem = dto.Imagem ?? raca.Imagem;
            if (dto.GaleriaImagem is not null)
            {
                raca.GaleriaImagem = dto.GaleriaImagem.Count > 0
                    ? JsonSerializer.Serialize(dto.GaleriaImagem)
                    : null;
            }
            if (dto.Variacoes is not null)
            {
                if (!TryNormalizeVariacoes(dto.Variacoes, out List<RacaVariacaoDto>? variacoes, out string? variacoesError))
                    return ResultRaca.Fail(variacoesError!);

                raca.Variacoes = variacoes != null && variacoes.Count > 0
                    ? JsonSerializer.Serialize(variacoes)
                    : null;
            }
            raca.Tags = JsonSerializer.Serialize(ContentCategoryHelper.EnsureCategoryTag(
                dto.Tags ?? JsonSafeHelper.DeserializeTags(raca.Tags),
                ContentCategoryHelper.Raca));
            raca.Visivel = dto.Visivel;
            raca.Destaque = dto.Destaque;

            var atualizada = await _repository.UpdateAsync(raca);
            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                AssetReferenceHelper.Extract(
                    atualizada.Imagem, atualizada.GaleriaImagem, atualizada.Variacoes, atualizada.Descricao));
            return ResultRaca.Ok(MapToDto(atualizada));
        }

        public async Task<ResultRaca> GetAllAsync(bool? visivel = null, int? idMesa = null)
        {
            var racas = await _repository.GetAllAsync(visivel);
            SistemaRuntimeContextoDto contexto = await _sistemaRpgResolver.ResolverContextoAsync(
                new SistemaRuntimeConsultaDto { IdMesa = idMesa });
            bool sistemaPadrao = string.Equals(
                contexto.CodigoSistema,
                SistemaRpgConfiguration.CodigoPadrao,
                StringComparison.OrdinalIgnoreCase);
            Dictionary<int, SistemaRacaConfigDto> configuracoes = sistemaPadrao
                ? new Dictionary<int, SistemaRacaConfigDto>()
                : contexto.Criacao?.Racas
                    .Where(configuracao => configuracao.IdRaca.HasValue)
                    .ToDictionary(configuracao => configuracao.IdRaca!.Value)
                    ?? new Dictionary<int, SistemaRacaConfigDto>();
            Dictionary<string, RacaDto> bases = racas.ToDictionary(
                raca => raca.Idraca.ToString(),
                raca => AplicarConfiguracaoSistema(
                    MapToDto(raca),
                    configuracoes.GetValueOrDefault(raca.Idraca)));
            IReadOnlyDictionary<string, RacaDto> resolvidas = await _mesaEntidadeConfigService
                .ApplyOverridesAsync(idMesa, Enums.MesaEntidadeTipo.Raca, bases);

            return ResultRaca.Ok(racas
                .Select(raca => resolvidas[raca.Idraca.ToString()])
                .ToList());
        }

        public async Task<RacaDto?> GetByIdAsync(int id, int? idMesa = null)
        {
            var raca = await _repository.GetByIdAsync(id);
            return raca != null ? await MapToDtoAsync(raca, idMesa) : null;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            Raca? raca = await _repository.GetByIdAsync(id);
            if (raca is null)
                return false;

            HashSet<string> assets = AssetReferenceHelper.Extract(
                raca.Imagem, raca.GaleriaImagem, raca.Variacoes, raca.Descricao);
            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        private static RacaDto MapToDto(Raca raca) => new()
        {
            Idraca = raca.Idraca,
            Nome = raca.Nome,
            StatusJson = DeserializeStatus(raca.StatusJson),
            Descricao = RichTextHelper.DeserializeRichText(raca.Descricao),
            Imagem = raca.Imagem,
            GaleriaImagem = !string.IsNullOrWhiteSpace(raca.GaleriaImagem)
                ? JsonSerializer.Deserialize<List<ImagemGaleriaDto>>(raca.GaleriaImagem)
                : null,
            Variacoes = DeserializeVariacoes(raca.Variacoes),
            Tags = !string.IsNullOrWhiteSpace(raca.Tags)
                ? JsonSerializer.Deserialize<List<string>>(raca.Tags)
                : null,
            Visivel = raca.Visivel,
            Destaque = raca.Destaque,
            IdSistemaRpg = raca.IdSistemaRpg,
            IdSistemaVersao = raca.IdSistemaVersao,
            AcompanharPublicacaoAtual = raca.AcompanharPublicacaoAtual,
            DataCriacao = raca.DataCriacao
        };

        private Task<RacaDto> MapToDtoAsync(Raca raca, int? idMesa)
            => MapToDtoComSistemaAsync(raca, idMesa);

        private async Task<RacaDto> MapToDtoComSistemaAsync(Raca raca, int? idMesa)
        {
            SistemaRuntimeContextoDto contexto = await _sistemaRpgResolver.ResolverContextoAsync(
                new SistemaRuntimeConsultaDto
                {
                    IdMesa = idMesa,
                    TipoEntidade = Enums.SistemaEntidadeGlobalTipo.Raca,
                    IdEntidade = raca.Idraca.ToString(),
                    IdRaca = raca.Idraca,
                });
            RacaDto dto = AplicarConfiguracaoSistema(MapToDto(raca), contexto.ConfiguracaoRacial);
            dto.SistemaRuntime = contexto;
            return dto;
        }

        private static RacaDto AplicarConfiguracaoSistema(
            RacaDto dto,
            SistemaRacaConfigDto? configuracao)
        {
            if (configuracao is null)
                return dto;

            List<RacaPassivaDto>? passivasLegadas = dto.StatusJson?.passivas;
            List<RacaPassivaDto>? passivasSistema = configuracao.PassivasVinculadas.Count == 0
                ? passivasLegadas
                : configuracao.PassivasVinculadas.Select(passiva => new RacaPassivaDto
                {
                    Nome = passiva.NomeExibicao,
                    Efeito = passivasLegadas?.FirstOrDefault(legada =>
                        string.Equals(
                            legada.Nome,
                            passiva.NomeExibicao,
                            StringComparison.OrdinalIgnoreCase))?.Efeito,
                }).ToList();

            dto.StatusJson = new RacaStatusDto
            {
                status = new StatusBaseDto
                {
                    vida = configuracao.VidaBase,
                    vidaMaxima = configuracao.VidaBase,
                    estamina = configuracao.EstaminaBase,
                    estaminaMaxima = configuracao.EstaminaBase,
                    mana = configuracao.ManaBase,
                    manaMaxima = configuracao.ManaBase,
                    capacidadeCarga = configuracao.CapacidadeCargaBase,
                },
                atributoInicial = configuracao.CodigoAtributoInicial,
                passivas = passivasSistema,
            };
            return dto;
        }

        public async Task<List<RacaDto>> GetBatchAsync(List<int> ids)
        {
            List<Raca> racas = await _repository.GetBatchAsync(ids);

            return racas
                .Select(MapToDto)
                .ToList();
        }

        private static RacaStatusDto? DeserializeStatus(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                RacaStatusDto? stored = JsonSerializer.Deserialize<RacaStatusDto>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return TryNormalizeStatus(stored, out RacaStatusDto? normalized, out _)
                    ? normalized
                    : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static List<RacaVariacaoDto>? DeserializeVariacoes(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            try
            {
                List<RacaVariacaoDto>? stored = JsonSerializer.Deserialize<List<RacaVariacaoDto>>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return TryNormalizeVariacoes(stored, out List<RacaVariacaoDto>? normalized, out _)
                    ? normalized
                    : null;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private static bool TryNormalizeStatus(
            RacaStatusDto? source,
            out RacaStatusDto? normalized,
            out string? error)
        {
            normalized = null;
            error = null;

            if (source is null)
                return true;

            List<RacaPassivaDto> passivas = new();
            foreach (RacaPassivaDto passiva in source.passivas ?? new List<RacaPassivaDto>())
            {
                string nome = (passiva.Nome ?? string.Empty).Trim();
                string? efeito = string.IsNullOrWhiteSpace(passiva.Efeito) ? null : passiva.Efeito.Trim();

                if (nome.Length == 0 && efeito is null)
                    continue;

                if (nome.Length == 0)
                {
                    error = "Toda passiva deve possuir um nome.";
                    return false;
                }

                if (nome.Length > 100)
                {
                    error = "O nome da passiva deve ter no máximo 100 caracteres.";
                    return false;
                }

                if (efeito?.Length > 2000)
                {
                    error = "O efeito da passiva deve ter no máximo 2.000 caracteres.";
                    return false;
                }

                passivas.Add(new RacaPassivaDto { Nome = nome, Efeito = efeito });
            }

            normalized = new RacaStatusDto
            {
                status = source.status ?? new StatusBaseDto(),
                atributoInicial = string.IsNullOrWhiteSpace(source.atributoInicial)
                    ? null
                    : source.atributoInicial.Trim(),
                passivas = passivas.Count > 0 ? passivas : null
            };
            return true;
        }

        private static bool TryNormalizeVariacoes(
            IEnumerable<RacaVariacaoDto>? source,
            out List<RacaVariacaoDto>? normalized,
            out string? error)
        {
            normalized = null;
            error = null;

            if (source is null)
                return true;

            List<RacaVariacaoDto> result = new();
            foreach (RacaVariacaoDto variacao in source)
            {
                string nome = (variacao.Nome ?? string.Empty).Trim();
                string? descricao = string.IsNullOrWhiteSpace(variacao.Descricao) ? null : variacao.Descricao.Trim();
                string? efeito = string.IsNullOrWhiteSpace(variacao.Efeito) ? null : variacao.Efeito.Trim();
                string? imagem = string.IsNullOrWhiteSpace(variacao.Imagem) ? null : variacao.Imagem.Trim();

                if (nome.Length == 0 && descricao is null && efeito is null && imagem is null)
                    continue;

                if (nome.Length == 0)
                {
                    error = "Toda variação deve possuir um nome.";
                    return false;
                }

                if (nome.Length > 100)
                {
                    error = "O nome da variação deve ter no máximo 100 caracteres.";
                    return false;
                }

                if (descricao?.Length > 500)
                {
                    error = "A descrição da variação deve ter no máximo 500 caracteres.";
                    return false;
                }

                if (efeito?.Length > 500)
                {
                    error = "O efeito da variação deve ter no máximo 500 caracteres.";
                    return false;
                }

                if (imagem?.Length > 2048)
                {
                    error = "O caminho da imagem da variação é inválido.";
                    return false;
                }

                result.Add(new RacaVariacaoDto
                {
                    Nome = nome,
                    Descricao = descricao,
                    Efeito = efeito,
                    Imagem = imagem
                });
            }

            normalized = result.Count > 0 ? result : null;
            return true;
        }
    }
}
