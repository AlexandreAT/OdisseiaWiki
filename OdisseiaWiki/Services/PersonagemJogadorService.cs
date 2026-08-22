using OdisseiaWiki.Dtos;
using OdisseiaWiki.Helpers;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;
using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Services
{
    public class PersonagemJogadorService : IPersonagemJogadorService
    {
        private readonly IPersonagemJogadorRepository _repository;
        private readonly IMesaRepository _mesaRepository;
        private readonly IMesaService _mesaService;
        private readonly IAssetService _assetService;
        private readonly ISistemaRpgResolver _sistemaResolver;

        public PersonagemJogadorService(
            IPersonagemJogadorRepository repository,
            IMesaRepository mesaRepository,
            IMesaService mesaService,
            IAssetService assetService,
            ISistemaRpgResolver sistemaResolver)
        {
            _repository = repository;
            _mesaRepository = mesaRepository;
            _mesaService = mesaService;
            _assetService = assetService;
            _sistemaResolver = sistemaResolver;
        }

        public async Task<ResultPersonagemJogador> CreateAsync(PersonagemJogadorDto personagemDto)
        {
            if (string.IsNullOrWhiteSpace(personagemDto.Nome))
                return ResultFail("O nome é obrigatório.");

            var validacaoMesa = await ValidarMesaAsync(personagemDto.Idmesa, personagemDto.Idusuario);
            if (!validacaoMesa.Sucesso)
                return ResultFail(validacaoMesa.MensagemErro!);
            personagemDto.Idmesa = validacaoMesa.Idmesa;
            SistemaRuntimeContextoDto contexto = await ResolverContextoAsync(
                personagemDto.Idmesa,
                personagemDto.Idraca);
            personagemDto.StatusJson = AplicarDefaultsDeCriacao(personagemDto.StatusJson, contexto);

            PersonagemJogador personagem = MapDtoToModel(personagemDto);
            personagem.Idcidade = personagem.Idcidade == 0 ? null : personagem.Idcidade;
            personagem.IdSistemaVersao = contexto.IdSistemaVersao;

            PersonagemJogador criado = await _repository.CreateAsync(personagem);
            return ResultOk(criado, "Personagem criado com sucesso.");
        }

        public async Task<ResultPersonagemJogador> UpdateAsync(int id, PersonagemJogadorDto personagemDto)
        {
            PersonagemJogador? personagem = await _repository.GetByIdAsync(id);
            if (personagem == null)
                return ResultFail($"PersonagemJogador com id {id} não encontrado.");

            var idUsuario = personagemDto.Idusuario > 0 ? personagemDto.Idusuario : personagem.Idusuario;
            var validacaoMesa = await ValidarMesaAsync(personagemDto.Idmesa, idUsuario);
            if (!validacaoMesa.Sucesso)
                return ResultFail(validacaoMesa.MensagemErro!);
            bool mesaAlterada = personagem.Idmesa != validacaoMesa.Idmesa;
            personagemDto.Idmesa = validacaoMesa.Idmesa;
            personagemDto.Idusuario = idUsuario;

            HashSet<string> oldAssets = ExtractAssets(personagem);

            personagem = MapDtoToModel(personagemDto, personagem);
            personagem.Idcidade = personagem.Idcidade == 0 ? null : personagem.Idcidade;
            if (mesaAlterada)
            {
                SistemaRuntimeContextoDto novoContexto = await ResolverContextoAsync(
                    personagem.Idmesa,
                    personagem.Idraca);
                personagem.IdSistemaVersao = novoContexto.IdSistemaVersao;
            }

            PersonagemJogador atualizado = await _repository.UpdateAsync(personagem);
            await AssetReferenceHelper.DeleteRemovedAsync(
                _assetService,
                oldAssets,
                ExtractAssets(atualizado));
            return ResultOk(atualizado, "Personagem atualizado com sucesso.");
        }

        public async Task<List<PersonagemJogadorDto>> GetAllAsync()
        {
            List<PersonagemJogador> personagens = await _repository.GetAllAsync();
            return await MapListToDtoAsync(personagens);
        }

        public async Task<List<PersonagemJogadorDto>> GetByIdsAsync(IReadOnlyCollection<int> ids)
        {
            List<PersonagemJogador> personagens = await _repository.GetByIdsAsync(ids);
            return await MapListToDtoAsync(personagens);
        }

        public async Task<List<PersonagemJogadorDto>> GetByUsuarioIdAsync(int usuarioId)
        {
            List<PersonagemJogador> personagens = await _repository.GetByUsuarioIdAsync(usuarioId);
            return await MapListToDtoAsync(personagens);
        }

        public async Task<PersonagemJogadorDto?> GetByIdAsync(int id)
        {
            PersonagemJogador? personagem = await _repository.GetByIdWithDetailsAsync(id);
            if (personagem is null)
                return null;

            Dictionary<int, List<Proficiencia>> proficiencias =
                await _repository.GetProficienciasByPersonagemIdsAsync(new[] { id });

            SistemaRuntimeContextoDto contexto = await ResolverContextoPersonagemAsync(personagem);
            contexto = PrepararContextoDaFicha(personagem, contexto) ?? contexto;
            return MapToDto(
                personagem,
                proficiencias.GetValueOrDefault(id) ?? new List<Proficiencia>(),
                contexto);
        }

        public async Task<bool?> AtualizarVisivelAsync(int id, bool visivel)
        {
            PersonagemJogador? personagem = await _repository.GetByIdAsync(id);
            if (personagem is null)
                return null;

            personagem.Visivel = visivel;
            PersonagemJogador atualizado = await _repository.UpdateAsync(personagem);
            return atualizado.Visivel;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            PersonagemJogador? personagem = await _repository.GetByIdAsync(id);
            if (personagem is null)
                return false;

            HashSet<string> assets = ExtractAssets(personagem);
            bool deleted = await _repository.DeleteAsync(id);
            if (deleted)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            return deleted;
        }

        public async Task<ResultPersonagemJogador> AtualizarSistemaAsync(int id)
        {
            PersonagemJogador? personagem = await _repository.GetByIdAsync(id);
            if (personagem is null)
                return ResultFail($"PersonagemJogador com id {id} não encontrado.");

            SistemaRuntimeContextoDto contextoMesa = await ResolverContextoAsync(
                personagem.Idmesa,
                personagem.Idraca);
            // Um fallback pontual (por exemplo, uma raça ainda sem configuração
            // mecânica na versão) não invalida a publicação resolvida da Mesa.
            if (!contextoMesa.IdSistemaVersao.HasValue)
                return ResultFail("A Mesa não possui uma versão válida publicada para atualizar esta ficha.");

            if (personagem.IdSistemaVersao == contextoMesa.IdSistemaVersao)
                return ResultOk(personagem, "O personagem já utiliza a versão atual da Mesa.");

            personagem.IdSistemaVersao = contextoMesa.IdSistemaVersao;
            PersonagemJogador atualizado = await _repository.UpdateAsync(personagem);
            return ResultOk(
                atualizado,
                $"Sistema do personagem atualizado manualmente para a versão {contextoMesa.NumeroVersao}. Os valores salvos da ficha foram preservados.");
        }

        public async Task<int> DeleteManyAsync(IReadOnlyCollection<int> ids)
        {
            int[] normalizedIds = ids.Where(id => id > 0).Distinct().ToArray();
            if (normalizedIds.Length == 0)
                return 0;

            List<PersonagemJogador> personagens = await _repository.GetByIdsAsync(normalizedIds);
            HashSet<string> assets = personagens
                .SelectMany(ExtractAssets)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            int deleted = await _repository.DeleteManyAsync(normalizedIds);
            if (deleted > 0)
                await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);

            return deleted;
        }

        private static HashSet<string> ExtractAssets(PersonagemJogador personagem)
            => AssetReferenceHelper.Extract(
                personagem.Imagem,
                personagem.GaleriaImagem,
                personagem.InventarioJson,
                personagem.Skills,
                personagem.Magia,
                personagem.Historia,
                personagem.Implantes,
                personagem.Ultimate);

        private async Task<(bool Sucesso, int Idmesa, string? MensagemErro)> ValidarMesaAsync(int idMesa, int idUsuario)
        {
            if (idUsuario <= 0)
                return (false, 0, "Usuário inválido.");

            if (idMesa <= 0)
            {
                var mesaPadrao = await _mesaService.ObterMesaPadraoAsync();
                return (true, mesaPadrao.Idmesa, null);
            }

            if (await _mesaRepository.GetByIdAsync(idMesa) is null)
                return (false, 0, "Mesa não encontrada.");

            if (!await _mesaRepository.UsuarioPodeUsarMesaAsync(idMesa, idUsuario))
                return (false, 0, "Usuário sem permissão para utilizar esta mesa.");

            return (true, idMesa, null);
        }

        private static PersonagemJogador MapDtoToModel(PersonagemJogadorDto personagemDto, PersonagemJogador? personagem = null)
        {
            personagem ??= new PersonagemJogador
            {
                DataCriacao = personagemDto.DataCriacao != default
                    ? personagemDto.DataCriacao
                    : DateTime.UtcNow
            };

            personagem.Nome = personagemDto.Nome ?? personagem.Nome;
            personagem.Idraca = personagemDto.Idraca;
            personagem.Idcidade = personagemDto.Idcidade;
            personagem.Idmesa = personagemDto.Idmesa;
            personagem.Idusuario = personagemDto.Idusuario;
            personagem.Visivel = personagemDto.Visivel;

            personagem.Alinhamento = personagemDto.Alinhamento ?? personagem.Alinhamento;
            personagem.Historia = personagemDto.Historia.HasValue 
                ? RichTextHelper.SerializeRichText(personagemDto.Historia) 
                : personagem.Historia;
            personagem.Imagem = personagemDto.Imagem ?? personagem.Imagem;
            personagem.GaleriaImagem = personagemDto.GaleriaImagem != null
                ? JsonSerializer.Serialize(personagemDto.GaleriaImagem)
                : personagem.GaleriaImagem;
            personagem.Nanites = personagemDto.Nanites?.ToString() ?? personagem.Nanites;
            personagem.InfoSecundariasJson = personagemDto.InfoSecundariasJson ?? personagem.InfoSecundariasJson;

            personagem.Costumes = personagemDto.Costumes != null ? JsonSerializer.Serialize(personagemDto.Costumes) : personagem.Costumes;
            personagem.Tracos = personagemDto.Tracos != null ? JsonSerializer.Serialize(personagemDto.Tracos) : personagem.Tracos;
            personagem.InventarioJson = personagemDto.InventarioJson != null ? JsonSerializer.Serialize(personagemDto.InventarioJson) : personagem.InventarioJson;
            personagem.Skills = personagemDto.Skills != null ? JsonSerializer.Serialize(personagemDto.Skills) : personagem.Skills;
            personagem.Magia = personagemDto.Magia != null ? JsonSerializer.Serialize(personagemDto.Magia) : personagem.Magia;
            personagem.StatusJson = personagemDto.StatusJson != null ? JsonSerializer.Serialize(personagemDto.StatusJson) : personagem.StatusJson;
            personagem.PersonagemsVinculados = personagemDto.PersonagemsVinculados != null ? JsonSerializer.Serialize(personagemDto.PersonagemsVinculados) : personagem.PersonagemsVinculados;
            personagem.Implantes = personagemDto.Implantes != null ? JsonSerializer.Serialize(personagemDto.Implantes) : personagem.Implantes;
            personagem.Idpassiva = personagemDto.Idpassiva ?? personagem.Idpassiva;
            personagem.Ultimate = personagemDto.Ultimate ?? personagem.Ultimate;

            return personagem;
        }

        private static ResultPersonagemJogador ResultFail(string mensagem) => new() { Sucesso = false, MensagemErro = mensagem };

        private static ResultPersonagemJogador ResultOk(PersonagemJogador personagem, string mensagem) => new()
        {
            Sucesso = true,
            Mensagem = mensagem,
            Personagem = new PersonagemJogadorResumoDto
            {
                IdpersonagemJogador = personagem.IdpersonagemJogador,
                Idusuario = personagem.Idusuario,
                Idmesa = personagem.Idmesa,
                Idraca = personagem.Idraca,
                Idcidade = personagem.Idcidade,
                Visivel = personagem.Visivel,
                Nome = personagem.Nome,
                Imagem = personagem.Imagem,
                DataCriacao = personagem.DataCriacao,
            },
        };

        private async Task<List<PersonagemJogadorDto>> MapListToDtoAsync(List<PersonagemJogador> personagens)
        {
            Dictionary<int, List<Proficiencia>> proficiencias =
                await _repository.GetProficienciasByPersonagemIdsAsync(
                    personagens.Select(personagem => personagem.IdpersonagemJogador));

            Dictionary<int, SistemaRuntimeContextoDto> contextos = new();
            foreach (PersonagemJogador personagem in personagens)
                contextos[personagem.IdpersonagemJogador] = await ResolverContextoPersonagemAsync(personagem);

            return personagens
                .Select(personagem => MapToDto(
                    personagem,
                    proficiencias.GetValueOrDefault(personagem.IdpersonagemJogador) ?? new List<Proficiencia>(),
                    PrepararContextoDaFicha(
                        personagem,
                        contextos.GetValueOrDefault(personagem.IdpersonagemJogador))))
                .ToList();
        }

        private static PersonagemJogadorDto MapToDto(
            PersonagemJogador personagem,
            IReadOnlyCollection<Proficiencia>? proficiencias = null,
            SistemaRuntimeContextoDto? sistemaRuntime = null) => new()
        {
            IdpersonagemJogador = personagem.IdpersonagemJogador,
            Idusuario = personagem.Idusuario,
            Idmesa = personagem.Idmesa,
            IdSistemaVersao = personagem.IdSistemaVersao,
            Visivel = personagem.Visivel,
            Idraca = personagem.Idraca,
            Idcidade = personagem.Idcidade,
            Nome = personagem.Nome,
            Alinhamento = personagem.Alinhamento,
            Historia = RichTextHelper.DeserializeRichText(personagem.Historia),
            Imagem = personagem.Imagem,
            GaleriaImagem = Deserialize<List<string>>(personagem.GaleriaImagem),
            Nanites = int.TryParse(personagem.Nanites, out int nanites) ? nanites : null,
            InfoSecundariasJson = personagem.InfoSecundariasJson,
            Costumes = Deserialize<List<string>>(personagem.Costumes),
            Tracos = Deserialize<List<string>>(personagem.Tracos),
            InventarioJson = Deserialize<object>(personagem.InventarioJson),
            Skills = Deserialize<object>(personagem.Skills),
            Magia = Deserialize<object>(personagem.Magia),
            StatusJson = Deserialize<object>(personagem.StatusJson),
            PersonagemsVinculados = Deserialize<List<string>>(personagem.PersonagemsVinculados),
            Implantes = Deserialize<List<string>>(personagem.Implantes),
            Ultimate = personagem.Ultimate,
            Idpassiva = personagem.Idpassiva,
            DataCriacao = personagem.DataCriacao,
            RacaNome = personagem.IdracaNavigation?.Nome,
            CidadeNome = personagem.IdcidadeNavigation?.Nome,
            MesaNome = personagem.Mesa?.Nome,
            AutorNome = personagem.Usuario?.Nome ?? personagem.Usuario?.Nickname,
            Visibilidade = PersonagemVisibilidadeDefaults.FromEntity(
                personagem.ConfiguracaoVisibilidade,
                personagemJogador: true),
            SistemaRuntime = sistemaRuntime,
            Proficiencias = proficiencias?
                .Select(proficiencia => new ProficienciaResumoDto
                {
                    Idproficiencia = proficiencia.Idproficiencia,
                    Nome = proficiencia.Nome,
                    Descricao = proficiencia.Descricao,
                })
                .ToList() ?? new List<ProficienciaResumoDto>(),
        };

        private Task<SistemaRuntimeContextoDto> ResolverContextoAsync(int idMesa, int idRaca) =>
            _sistemaResolver.ResolverContextoAsync(new SistemaRuntimeConsultaDto
            {
                IdMesa = idMesa,
                IdRaca = idRaca > 0 ? idRaca : null,
            });

        private Task<SistemaRuntimeContextoDto> ResolverContextoPersonagemAsync(
            PersonagemJogador personagem) =>
            _sistemaResolver.ResolverContextoAsync(new SistemaRuntimeConsultaDto
            {
                IdPersonagemJogador = personagem.IdpersonagemJogador,
                IdRaca = personagem.Idraca > 0 ? personagem.Idraca : null,
            });

        private static SistemaRuntimeContextoDto? PrepararContextoDaFicha(
            PersonagemJogador personagem,
            SistemaRuntimeContextoDto? contextoBase)
        {
            if (contextoBase is null)
                return null;

            SistemaRuntimeContextoDto contexto = JsonSerializer.Deserialize<SistemaRuntimeContextoDto>(
                JsonSerializer.Serialize(contextoBase)) ?? contextoBase;
            JsonObject status = ParseStoredObject(personagem.StatusJson);

            int nivel = LerInteiro(status["nivel"]);
            int nivelMaximo = contexto.Progressao?.NivelMaximo ?? 0;
            if (nivelMaximo > 0 && nivel > nivelMaximo)
            {
                AdicionarWarningExplicito(
                    contexto,
                    "statusJson.nivel",
                    nivel,
                    nivelMaximo,
                    "O nível salvo está acima da referência da versão efetiva e foi preservado.");
            }

            JsonObject recursos = status["status"] as JsonObject ?? new JsonObject();
            SistemaRacaConfigDto? raca = contexto.ConfiguracaoRacial;
            if (raca is not null)
            {
                CompararDefaultRacial(contexto, recursos, "vidaMaxima", raca.VidaBase);
                CompararDefaultRacial(contexto, recursos, "estaminaMaxima", raca.EstaminaBase);
                CompararDefaultRacial(contexto, recursos, "manaMaxima", raca.ManaBase);
                CompararDefaultRacial(contexto, recursos, "capacidadeCarga", raca.CapacidadeCargaBase);
            }

            int skills = ContarItensJson(personagem.Skills);
            int limiteSkills = contexto.Poderes?.SkillConfig?.MaximoSkills ?? 0;
            if (limiteSkills > 0 && skills > limiteSkills)
            {
                AdicionarWarningExplicito(
                    contexto,
                    "skills",
                    skills,
                    limiteSkills,
                    "A ficha possui mais skills que o limite da versão efetiva; as escolhas foram preservadas.");
            }

            int magias = ContarItensJson(personagem.Magia);
            int limiteMagias = contexto.Poderes?.LimiteMagias ?? 0;
            if (limiteMagias <= 0)
            {
                limiteMagias = contexto.Poderes?.SkillConfig?.MaximoMagias ?? 0;
            }
            if (limiteMagias > 0 && magias > limiteMagias)
            {
                AdicionarWarningExplicito(
                    contexto,
                    "magias",
                    magias,
                    limiteMagias,
                    "A ficha possui mais magias que o limite da versão efetiva; as escolhas foram preservadas.");
            }

            return contexto;
        }

        private static void CompararDefaultRacial(
            SistemaRuntimeContextoDto contexto,
            JsonObject recursos,
            string campo,
            int referencia)
        {
            int valor = LerInteiro(recursos[campo]);
            if (referencia <= 0 || valor <= 0 || valor == referencia)
                return;

            AdicionarWarningExplicito(
                contexto,
                $"statusJson.status.{campo}",
                valor,
                referencia,
                "O valor salvo difere do default racial atual e foi preservado.");
        }

        private static void AdicionarWarningExplicito(
            SistemaRuntimeContextoDto contexto,
            string caminho,
            decimal valor,
            decimal referencia,
            string mensagem)
        {
            contexto.Warnings.Add(new SistemaRuntimeWarningDto
            {
                Codigo = SistemaRuntimeWarningCodigo.ValorForaReferencia,
                Caminho = caminho,
                Mensagem = mensagem,
                ValorInformado = valor,
                ValorMaximoReferencia = referencia,
                Referencia = referencia.ToString(System.Globalization.CultureInfo.InvariantCulture),
            });
            contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
            {
                Caminho = caminho,
                Origem = SistemaValorProveniencia.ValorExplicitoEntidade,
                Detalhe = "Valor persistido na ficha",
            });
        }

        private static JsonObject ParseStoredObject(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return new JsonObject();

            try
            {
                return JsonNode.Parse(value) as JsonObject ?? new JsonObject();
            }
            catch (JsonException)
            {
                return new JsonObject();
            }
        }

        private static int ContarItensJson(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return 0;

            try
            {
                return JsonNode.Parse(value) is JsonArray array ? array.Count : 0;
            }
            catch (JsonException)
            {
                return 0;
            }
        }

        private static object AplicarDefaultsDeCriacao(
            object? statusJson,
            SistemaRuntimeContextoDto contexto)
        {
            JsonObject raiz = ParseObject(statusJson);
            JsonObject status = GetOrCreateObject(raiz, "status");
            SistemaRacaConfigDto? raca = contexto.ConfiguracaoRacial;

            AplicarRecurso(status, "vida", "vidaMaxima", raca?.VidaBase);
            AplicarRecurso(status, "estamina", "estaminaMaxima", raca?.EstaminaBase);
            AplicarRecurso(status, "mana", "manaMaxima", raca?.ManaBase);
            SetDefaultNumber(status, "capacidadeCarga", raca?.CapacidadeCargaBase);

            SetDefaultNumber(raiz, "nivel", contexto.Criacao?.NivelInicial ?? 1);
            SetDefaultNumber(raiz, "xp", 0, substituirZero: false);
            SetDefaultNumber(raiz, "pontos", contexto.Criacao?.PontosIniciais ?? 0, substituirZero: false);

            JsonObject atributos = GetOrCreateObject(raiz, "atributos");
            foreach (SistemaAtributoConfigDto atributo in contexto.Criacao?.Atributos
                .Where(item => item.Ativo)
                .OrderBy(item => item.Ordem) ?? Enumerable.Empty<SistemaAtributoConfigDto>())
            {
                string grupo = atributo.Grupo switch
                {
                    SistemaAtributoGrupo.Principal => "principais",
                    SistemaAtributoGrupo.Secundario => "secundarios",
                    SistemaAtributoGrupo.Defesa => "defesas",
                    _ => "outros",
                };
                SetDefaultNumber(
                    GetOrCreateObject(atributos, grupo),
                    atributo.Codigo,
                    atributo.ValorComum);
            }

            JsonObject defesas = GetOrCreateObject(raiz, "defesas");
            foreach (SistemaTipoDefesaDto defesa in contexto.Combate?.TiposDefesa
                .OrderBy(item => item.Ordem) ?? Enumerable.Empty<SistemaTipoDefesaDto>())
            {
                SetDefaultNumber(defesas, defesa.Codigo, 0, substituirZero: false);
            }

            return JsonSerializer.Deserialize<object>(raiz.ToJsonString())!;
        }

        private static JsonObject ParseObject(object? value)
        {
            if (value is null)
                return new JsonObject();

            try
            {
                return JsonNode.Parse(JsonSerializer.Serialize(value)) as JsonObject ?? new JsonObject();
            }
            catch (JsonException)
            {
                return new JsonObject();
            }
        }

        private static JsonObject GetOrCreateObject(JsonObject parent, string propertyName)
        {
            if (parent[propertyName] is JsonObject existing)
                return existing;

            JsonObject created = new();
            parent[propertyName] = created;
            return created;
        }

        private static void AplicarRecurso(
            JsonObject status,
            string atual,
            string maximo,
            int? valorRacial)
        {
            int referencia = valorRacial.GetValueOrDefault();
            int valorMaximo = LerInteiro(status[maximo]);
            int valorAtual = LerInteiro(status[atual]);

            if (valorMaximo <= 0)
                valorMaximo = valorAtual > 0 ? valorAtual : referencia;
            if (valorAtual <= 0)
                valorAtual = valorMaximo > 0 ? valorMaximo : referencia;

            status[maximo] = valorMaximo;
            status[atual] = valorAtual;
        }

        private static void SetDefaultNumber(
            JsonObject parent,
            string propertyName,
            int? defaultValue,
            bool substituirZero = true)
        {
            if (!defaultValue.HasValue)
                return;

            JsonNode? current = parent[propertyName];
            if (current is null || (substituirZero && LerInteiro(current) == 0))
                parent[propertyName] = defaultValue.Value;
        }

        private static int LerInteiro(JsonNode? value)
        {
            if (value is JsonValue jsonValue && jsonValue.TryGetValue(out int integer))
                return integer;

            return 0;
        }

        private static T? Deserialize<T>(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return default;

            try
            {
                return JsonSerializer.Deserialize<T>(value);
            }
            catch (JsonException)
            {
                return default;
            }
        }
    }
}
