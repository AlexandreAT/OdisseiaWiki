using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Services.Helpers;
using System.Text.Json;

namespace OdisseiaWiki.Services
{
    public class MesaService : IMesaService
    {
        private readonly IMesaRepository _repository;
        private readonly IAssetService _assetService;
        private readonly ISistemaRpgService _sistemaRpgService;
        private readonly ISistemaRpgResolver _sistemaRpgResolver;
        private readonly IMesaRealtimeNotifier _realtimeNotifier;

        public MesaService(
            IMesaRepository repository,
            IAssetService assetService,
            ISistemaRpgService sistemaRpgService,
            ISistemaRpgResolver sistemaRpgResolver,
            IMesaRealtimeNotifier? realtimeNotifier = null)
        {
            _repository = repository;
            _assetService = assetService;
            _sistemaRpgService = sistemaRpgService;
            _sistemaRpgResolver = sistemaRpgResolver;
            _realtimeNotifier = realtimeNotifier ?? new NullMesaRealtimeNotifier();
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

        public async Task<MesaOperacaoResultado<MesaResumoDto>> CreateSocialAsync(
            int idUsuario,
            MesaCriarDto dto)
        {
            string nome = dto.Nome?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(nome))
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "O nome da Mesa é obrigatório.");

            SistemaVersao? versao = await _repository.GetSelectableVersionAsync(dto.IdSistemaVersao);
            if (versao is null)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "Selecione uma versão publicada de um sistema ativo.");
            if (dto.IdSistemaRpg.HasValue && dto.IdSistemaRpg.Value != versao.IdSistemaRpg)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "A versão selecionada não pertence ao sistema informado.");

            string[] tags = NormalizarTags(dto.Tags);
            if (tags.Length > 10)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "Informe no máximo 10 tags.");

            DateTime agora = DateTime.UtcNow;
            Mesa mesa = await _repository.CreateAsync(new Mesa
            {
                IdusuarioCriacao = idUsuario,
                Nome = nome,
                Descricao = NormalizarTexto(dto.Descricao),
                Imagem = NormalizarTexto(dto.Imagem),
                Tags = SerializarTags(tags),
                LimiteJogadores = dto.LimiteJogadores,
                IdSistemaVersao = dto.IdSistemaVersao,
                PadraoSistema = false,
                DataCriacao = agora,
                DataAtualizacao = agora,
            });
            Mesa? detalhada = await _repository.GetDetailedByIdAsync(mesa.Idmesa);
            MesaResumoDto resumo = MapResumo(detalhada ?? mesa, idUsuario);
            await _realtimeNotifier.NotificarMesaAlteradaAsync(mesa.Idmesa);
            return MesaOperacaoResultado<MesaResumoDto>.Ok(resumo, "Mesa criada com sucesso.");
        }

        public async Task<MesaOperacaoResultado<MesaResumoDto>> UpdateSocialAsync(
            int idMesa,
            int idUsuario,
            bool admin,
            MesaAtualizarDto dto)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            Mesa? atual = await _repository.GetDetailedByIdAsync(idMesa);
            if (mesa is null || atual is null || EhMesaPadraoFixa(mesa))
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.NaoEncontrado,
                    "Mesa não encontrada.");
            if (!admin && mesa.IdusuarioCriacao != idUsuario)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Proibido,
                    "Somente o mestre pode editar esta Mesa.");

            string nome = dto.Nome?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(nome))
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "O nome da Mesa é obrigatório.");
            int membros = atual.Mesausuarios.Count;
            if (dto.LimiteJogadores < membros)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Conflito,
                    $"O limite não pode ser menor que os {membros} jogadores já aceitos.");

            SistemaVersao? versao = dto.IdSistemaVersao == atual.IdSistemaVersao
                ? atual.SistemaVersao
                : await _repository.GetSelectableVersionAsync(dto.IdSistemaVersao);
            int? idSistemaAtual = atual.SistemaVersao?.IdSistemaRpg;
            if (versao is null || !idSistemaAtual.HasValue || versao.IdSistemaRpg != idSistemaAtual.Value)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "A versão selecionada deve ser uma publicação válida do sistema original da Mesa.");

            string[] tags = NormalizarTags(dto.Tags);
            if (tags.Length > 10)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Validacao,
                    "Informe no máximo 10 tags.");

            string? imagemAnterior = mesa.Imagem;
            mesa.Nome = nome;
            mesa.Descricao = NormalizarTexto(dto.Descricao);
            mesa.Imagem = NormalizarTexto(dto.Imagem);
            mesa.Tags = SerializarTags(tags);
            mesa.LimiteJogadores = dto.LimiteJogadores;
            mesa.IdSistemaVersao = dto.IdSistemaVersao;
            mesa.DataAtualizacao = DateTime.UtcNow;
            await _repository.UpdateAsync(mesa);
            if (!string.Equals(imagemAnterior, mesa.Imagem, StringComparison.Ordinal))
                await _assetService.DeleteIfUnreferencedAsync(imagemAnterior);

            Mesa? detalhada = await _repository.GetDetailedByIdAsync(idMesa);
            await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
            return MesaOperacaoResultado<MesaResumoDto>.Ok(
                MapResumo(detalhada ?? mesa, idUsuario),
                "Mesa atualizada com sucesso.");
        }

        public async Task<MesaOperacaoResultado<MesaResumoDto>> UpdateLiveStatusAsync(
            int idMesa,
            int idUsuario,
            bool aoVivo)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            if (mesa is null || EhMesaPadraoFixa(mesa))
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.NaoEncontrado,
                    "Mesa não encontrada.");
            if (mesa.IdusuarioCriacao != idUsuario)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.Proibido,
                    "Somente o mestre pode iniciar ou encerrar a Mesa ao vivo.");

            if (mesa.AoVivo != aoVivo)
            {
                mesa.AoVivo = aoVivo;
                mesa.DataAtualizacao = DateTime.UtcNow;
                await _repository.UpdateAsync(mesa);
                await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
            }

            Mesa? detalhada = await _repository.GetDetailedByIdAsync(idMesa);
            return MesaOperacaoResultado<MesaResumoDto>.Ok(
                MapResumo(detalhada ?? mesa, idUsuario),
                aoVivo ? "Mesa iniciada ao vivo." : "Mesa encerrada.");
        }

        public async Task<MesaHubDto> GetHubAsync(
            int idUsuario,
            int paginaCriadas,
            int paginaParticipando)
        {
            const int tamanho = 3;
            paginaCriadas = Math.Max(1, paginaCriadas);
            paginaParticipando = Math.Max(1, paginaParticipando);
            (List<Mesa> criadas, int totalCriadas) = await _repository.GetOwnedPageAsync(
                idUsuario,
                paginaCriadas,
                tamanho);
            (List<Mesa> participando, int totalParticipando) = await _repository.GetParticipatingPageAsync(
                idUsuario,
                paginaParticipando,
                tamanho);
            return new MesaHubDto
            {
                Criadas = MapPagina(criadas, paginaCriadas, tamanho, totalCriadas, idUsuario),
                Participando = MapPagina(
                    participando,
                    paginaParticipando,
                    tamanho,
                    totalParticipando,
                    idUsuario),
            };
        }

        public async Task<PaginacaoResultadoDto<MesaResumoDto>> SearchAsync(
            string? termo,
            int? idSistemaRpg,
            bool somenteComVagas,
            int pagina,
            int tamanhoPagina,
            int? idUsuario)
        {
            pagina = Math.Max(1, pagina);
            tamanhoPagina = Math.Clamp(tamanhoPagina, 1, 48);
            (List<Mesa> itens, int total) = await _repository.SearchPageAsync(
                termo,
                idSistemaRpg,
                somenteComVagas,
                pagina,
                tamanhoPagina);
            return MapPagina(itens, pagina, tamanhoPagina, total, idUsuario);
        }

        public async Task<MesaOperacaoResultado<MesaResumoDto>> GetPublicPageAsync(
            int idMesa,
            int? idUsuario)
        {
            Mesa? mesa = await _repository.GetDetailedByIdAsync(idMesa);
            if (mesa is null || mesa.PadraoSistema || !mesa.IdusuarioCriacao.HasValue)
                return MesaOperacaoResultado<MesaResumoDto>.Falha(
                    MesaOperacaoErro.NaoEncontrado,
                    "Mesa não encontrada.");
            return MesaOperacaoResultado<MesaResumoDto>.Ok(MapResumo(mesa, idUsuario));
        }

        public async Task<MesaOperacaoResultado<bool>> RequestEntryAsync(
            int idMesa,
            int idUsuario,
            MesaSolicitacaoCriarDto dto)
        {
            string? mensagem = NormalizarTexto(dto.Mensagem);
            if (mensagem?.Length > 200)
                return MesaOperacaoResultado<bool>.Falha(
                    MesaOperacaoErro.Validacao,
                    "A mensagem deve ter no máximo 200 caracteres.");

            MesaParticipacaoPersistenciaResultado resultado =
                await _repository.CreateRequestAsync(idMesa, idUsuario, mensagem);
            MesaOperacaoResultado<bool> resposta = MapParticipacao(resultado, true);
            if (resposta.Sucesso)
                await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
            return resposta;
        }

        public async Task<MesaOperacaoResultado<IReadOnlyCollection<MesaSolicitacaoDto>>> GetRequestsAsync(
            int idMesa,
            int idUsuario,
            bool admin)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            if (mesa is null || mesa.PadraoSistema)
                return MesaOperacaoResultado<IReadOnlyCollection<MesaSolicitacaoDto>>.Falha(
                    MesaOperacaoErro.NaoEncontrado,
                    "Mesa não encontrada.");
            if (!admin && mesa.IdusuarioCriacao != idUsuario)
                return MesaOperacaoResultado<IReadOnlyCollection<MesaSolicitacaoDto>>.Falha(
                    MesaOperacaoErro.Proibido,
                    "Somente o mestre pode consultar os pedidos.");

            List<MesaSolicitacaoEntrada> solicitacoes = await _repository.GetRequestsAsync(idMesa);
            return MesaOperacaoResultado<IReadOnlyCollection<MesaSolicitacaoDto>>.Ok(
                solicitacoes.Select(MapSolicitacao).ToList());
        }

        public async Task<MesaOperacaoResultado<bool>> AcceptRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idUsuario,
            bool admin)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            if (mesa is null)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "Mesa não encontrada.");
            if (!admin && mesa.IdusuarioCriacao != idUsuario)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Proibido, "Somente o mestre pode aceitar pedidos.");
            int idMestrePersistencia = mesa.IdusuarioCriacao ?? idUsuario;
            MesaOperacaoResultado<bool> resposta = MapParticipacao(
                await _repository.AcceptRequestAsync(idMesa, idSolicitacao, idMestrePersistencia),
                true);
            if (resposta.Sucesso)
                await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
            return resposta;
        }

        public async Task<MesaOperacaoResultado<bool>> RefuseRequestAsync(
            int idMesa,
            int idSolicitacao,
            int idUsuario,
            bool admin)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            if (mesa is null)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "Mesa não encontrada.");
            if (!admin && mesa.IdusuarioCriacao != idUsuario)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Proibido, "Somente o mestre pode recusar pedidos.");
            int idMestrePersistencia = mesa.IdusuarioCriacao ?? idUsuario;
            MesaOperacaoResultado<bool> resposta = MapParticipacao(
                await _repository.RefuseRequestAsync(idMesa, idSolicitacao, idMestrePersistencia),
                true);
            if (resposta.Sucesso)
                await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
            return resposta;
        }

        public async Task<MesaOperacaoResultado<IReadOnlyCollection<MesaJogadorDto>>> GetMembersAsync(
            int idMesa,
            int idUsuario,
            bool admin)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            if (mesa is null || mesa.PadraoSistema)
                return MesaOperacaoResultado<IReadOnlyCollection<MesaJogadorDto>>.Falha(
                    MesaOperacaoErro.NaoEncontrado,
                    "Mesa não encontrada.");
            if (!admin && mesa.IdusuarioCriacao != idUsuario)
                return MesaOperacaoResultado<IReadOnlyCollection<MesaJogadorDto>>.Falha(
                    MesaOperacaoErro.Proibido,
                    "Somente o mestre pode consultar os jogadores.");

            List<Mesausuario> membros = await _repository.GetMembersAsync(idMesa);
            IReadOnlyDictionary<int, int> personagensPorUsuario =
                await _repository.GetMemberCharacterCountsAsync(idMesa);
            return MesaOperacaoResultado<IReadOnlyCollection<MesaJogadorDto>>.Ok(
                membros.Select(vinculo => new MesaJogadorDto
                {
                    IdUsuario = vinculo.Idusuario ?? 0,
                    Nome = vinculo.IdusuarioNavigation?.Nome ??
                        vinculo.IdusuarioNavigation?.Nickname ?? string.Empty,
                    Imagem = vinculo.IdusuarioNavigation?.ImagemUrl,
                    DataEntrada = vinculo.DataEntrada,
                    Personagens = vinculo.Idusuario is int idMembro &&
                        personagensPorUsuario.TryGetValue(idMembro, out int quantidade)
                            ? quantidade
                            : 0,
                }).ToList());
        }

        public async Task<MesaOperacaoResultado<bool>> ExpelMemberAsync(
            int idMesa,
            int idUsuarioAlvo,
            int idUsuarioMestre,
            bool admin,
            MesaExpulsarDto dto)
        {
            string motivo = dto.Motivo?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(motivo) || motivo.Length > 500)
                return MesaOperacaoResultado<bool>.Falha(
                    MesaOperacaoErro.Validacao,
                    "Informe um motivo com até 500 caracteres.");
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            if (mesa is null)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "Mesa não encontrada.");
            if (!admin && mesa.IdusuarioCriacao != idUsuarioMestre)
                return MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Proibido, "Somente o mestre pode expulsar jogadores.");
            int idMestrePersistencia = mesa.IdusuarioCriacao ?? idUsuarioMestre;
            MesaOperacaoResultado<bool> resposta = MapParticipacao(
                await _repository.ExpelMemberAsync(
                    idMesa,
                    idUsuarioAlvo,
                    idMestrePersistencia,
                    motivo),
                true);
            if (resposta.Sucesso)
            {
                await _realtimeNotifier.RevogarAcessoUsuarioAsync(idMesa, idUsuarioAlvo);
                await _realtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
            }
            return resposta;
        }

        public async Task<IReadOnlyCollection<MesaExpulsaoDto>> GetExpulsionRecordsAsync(int idUsuario)
            => (await _repository.GetExpulsionRecordsAsync(idUsuario))
                .Select(registro => new MesaExpulsaoDto
                {
                    IdMesa = registro.Idmesa ?? 0,
                    MesaNome = registro.NomeMesa,
                    Motivo = registro.Motivo,
                    DataExpulsao = registro.DataExpulsao,
                })
                .ToList();

        public Task<Mesa?> GetByIdAsync(int id)
            => _repository.GetByIdAsync(id);

        public Task<List<Mesa>> GetAccessibleAsync(int idUsuario)
            => _repository.GetAccessibleByUsuarioIdAsync(idUsuario);

        public Task<bool> IsOwnerAsync(int idMesa, int idUsuario)
            => _repository.IsOwnerAsync(idMesa, idUsuario);

        public Task<bool> CanUseAsync(int idMesa, int idUsuario)
            => _repository.UsuarioPodeUsarMesaAsync(idMesa, idUsuario);

        public async Task<bool> CanAccessLiveAsync(int idMesa, int idUsuario)
        {
            Mesa? mesa = await _repository.GetByIdAsync(idMesa);
            return mesa?.AoVivo == true &&
                await _repository.UsuarioPodeAcessarMesaSocialAsync(idMesa, idUsuario);
        }

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

        private static PaginacaoResultadoDto<MesaResumoDto> MapPagina(
            IReadOnlyCollection<Mesa> mesas,
            int pagina,
            int tamanho,
            int total,
            int? idUsuario) => new()
        {
            Itens = mesas.Select(mesa => MapResumo(mesa, idUsuario)).ToList(),
            Pagina = pagina,
            TamanhoPagina = tamanho,
            TotalItens = total,
        };

        private static MesaResumoDto MapResumo(Mesa mesa, int? idUsuario)
        {
            int jogadores = mesa.Mesausuarios.Count;
            bool mestre = idUsuario.HasValue && mesa.IdusuarioCriacao == idUsuario.Value;
            bool participa = idUsuario.HasValue && mesa.Mesausuarios.Any(vinculo => vinculo.Idusuario == idUsuario.Value);
            bool solicitou = idUsuario.HasValue && mesa.SolicitacoesEntrada.Any(item => item.Idusuario == idUsuario.Value);
            return new MesaResumoDto
            {
                IdMesa = mesa.Idmesa,
                Nome = mesa.Nome,
                Imagem = mesa.Imagem,
                Descricao = mesa.Descricao,
                Tags = DeserializarTags(mesa.Tags),
                IdUsuarioCriacao = mesa.IdusuarioCriacao,
                MestreNome = mesa.IdusuarioCriacaoNavigation?.Nome ??
                    mesa.IdusuarioCriacaoNavigation?.Nickname ??
                    (mesa.PadraoSistema ? "Sistema" : "Mestre removido"),
                MestreImagem = mesa.IdusuarioCriacaoNavigation?.ImagemUrl,
                IdSistemaRpg = mesa.SistemaVersao?.IdSistemaRpg,
                SistemaNome = mesa.SistemaVersao?.SistemaRpg?.Nome ?? string.Empty,
                IdSistemaVersao = mesa.IdSistemaVersao,
                NumeroVersao = mesa.SistemaVersao?.NumeroVersao,
                JogadoresAtuais = jogadores,
                LimiteJogadores = mesa.LimiteJogadores,
                SolicitacoesPendentes = mestre ? mesa.SolicitacoesEntrada.Count : 0,
                PapelUsuario = mestre
                    ? "Mestre"
                    : participa
                        ? "Participante"
                        : solicitou
                            ? "Pendente"
                            : "Visitante",
                PodeSolicitarEntrada = idUsuario.HasValue &&
                    !mestre &&
                    !participa &&
                    !solicitou &&
                    jogadores < mesa.LimiteJogadores,
                SolicitacaoPendente = solicitou,
                WikiDisponivel = false,
                AoVivo = mesa.AoVivo,
                DataCriacao = mesa.DataCriacao,
                DataAtualizacao = mesa.DataAtualizacao,
            };
        }

        private static MesaSolicitacaoDto MapSolicitacao(MesaSolicitacaoEntrada solicitacao) => new()
        {
            IdSolicitacao = solicitacao.IdMesaSolicitacaoEntrada,
            IdMesa = solicitacao.Idmesa,
            IdUsuario = solicitacao.Idusuario,
            UsuarioNome = solicitacao.Usuario.Nome ?? solicitacao.Usuario.Nickname,
            UsuarioImagem = solicitacao.Usuario.ImagemUrl,
            Mensagem = solicitacao.Mensagem,
            DataSolicitacao = solicitacao.DataSolicitacao,
            DataCadastroUsuario = solicitacao.Usuario.DataRegistro,
        };

        private static MesaPessoaResumoDto MapPessoa(Usuario? usuario) => new()
        {
            Idusuario = usuario?.Idusuario ?? 0,
            Nome = usuario?.Nome ?? usuario?.Nickname ?? string.Empty,
            Imagem = usuario?.ImagemUrl,
        };

        private static MesaOperacaoResultado<bool> MapParticipacao(
            MesaParticipacaoPersistenciaResultado resultado,
            bool dados) => resultado switch
        {
            MesaParticipacaoPersistenciaResultado.Sucesso => MesaOperacaoResultado<bool>.Ok(dados),
            MesaParticipacaoPersistenciaResultado.MesaNaoEncontrada =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "Mesa não encontrada."),
            MesaParticipacaoPersistenciaResultado.SolicitacaoNaoEncontrada =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "Solicitação não encontrada."),
            MesaParticipacaoPersistenciaResultado.UsuarioNaoParticipa =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.NaoEncontrado, "O usuário não participa desta Mesa."),
            MesaParticipacaoPersistenciaResultado.MestreNaoAutorizado =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Proibido, "Somente o mestre pode realizar esta ação."),
            MesaParticipacaoPersistenciaResultado.MestreNaoPodeSolicitarOuSerExpulso =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "O mestre não pode realizar esta ação sobre a própria Mesa."),
            MesaParticipacaoPersistenciaResultado.UsuarioJaParticipa =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "O usuário já participa desta Mesa."),
            MesaParticipacaoPersistenciaResultado.SolicitacaoDuplicada =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "Já existe uma solicitação pendente para esta Mesa."),
            MesaParticipacaoPersistenciaResultado.MesaLotada =>
                MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "A Mesa não possui vagas disponíveis."),
            _ => MesaOperacaoResultado<bool>.Falha(MesaOperacaoErro.Conflito, "A operação não pôde ser concluída devido a uma alteração concorrente."),
        };

        private static string? NormalizarTexto(string? valor)
            => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

        private static string[] NormalizarTags(IEnumerable<string>? tags)
            => (tags ?? Array.Empty<string>())
                .Select(tag => tag?.Trim())
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Select(tag => tag!.Length <= 40 ? tag : tag[..40])
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

        private static string? SerializarTags(IReadOnlyCollection<string> tags)
            => tags.Count == 0 ? null : JsonSerializer.Serialize(tags);

        private static IReadOnlyCollection<string> DeserializarTags(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return Array.Empty<string>();
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
            }
            catch (JsonException)
            {
                return json.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            }
        }
    }
}
