using Microsoft.Extensions.Logging;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgService : ISistemaRpgService
{
    private readonly ISistemaRpgRepository _repository;
    private readonly ISistemaRpgResolver _resolver;
    private readonly ILogger<SistemaRpgService> _logger;

    public SistemaRpgService(
        ISistemaRpgRepository repository,
        ISistemaRpgResolver resolver,
        ILogger<SistemaRpgService> logger)
    {
        _repository = repository;
        _resolver = resolver;
        _logger = logger;
    }

    public async Task<List<SistemaRpgResumoDto>> ObterTodosAsync(bool incluirInativos = false)
    {
        List<SistemaRpg> sistemas = await _repository.GetAllAsync(incluirInativos);
        List<SistemaRpgResumoDto> resultado = new(sistemas.Count);
        foreach (SistemaRpg sistema in sistemas)
        {
            int quantidadeMesas = await _repository.CountMesasBySystemAsync(sistema.IdSistemaRpg);
            resultado.Add(SistemaRpgMapper.ToResumo(sistema, quantidadeMesas));
        }
        return resultado;
    }

    public async Task<SistemaOperacaoResultado<SistemaRpgDetalheDto>> ObterAsync(
        int idSistemaRpg,
        bool incluirRascunhos = false)
    {
        SistemaRpg? sistema = await _repository.GetByIdAsync(idSistemaRpg);
        if (sistema is null || (!sistema.Ativo && !incluirRascunhos))
            return NaoEncontrado<SistemaRpgDetalheDto>("Sistema de RPG não encontrado.");

        List<SistemaVersao> versoes = sistema.Versoes
            .Where(v => incluirRascunhos || v.Status != SistemaVersaoStatus.Rascunho)
            .OrderByDescending(v => v.DataCriacao)
            .ToList();
        int quantidadeMesas = await _repository.CountMesasBySystemAsync(idSistemaRpg);
        SistemaRpgResumoDto resumo = SistemaRpgMapper.ToResumo(sistema, quantidadeMesas);
        SistemaRpgDetalheDto detalhe = new()
        {
            IdSistemaRpg = resumo.IdSistemaRpg,
            Codigo = resumo.Codigo,
            Nome = resumo.Nome,
            Descricao = resumo.Descricao,
            Ativo = resumo.Ativo,
            IdVersaoPublicada = resumo.IdVersaoPublicada,
            NumeroVersaoPublicada = resumo.NumeroVersaoPublicada,
            QuantidadeVersoes = resumo.QuantidadeVersoes,
            QuantidadeMesas = resumo.QuantidadeMesas,
            DataCriacao = resumo.DataCriacao,
            DataAtualizacao = resumo.DataAtualizacao,
        };
        foreach (SistemaVersao versao in versoes)
        {
            detalhe.Versoes.Add(SistemaRpgMapper.ToResumo(
                versao,
                await _repository.CountMesasByVersionAsync(versao.IdSistemaVersao)));
        }
        return SistemaOperacaoResultado<SistemaRpgDetalheDto>.Ok(detalhe);
    }

    public async Task<SistemaOperacaoResultado<SistemaRpgResumoDto>> CriarAsync(SistemaRpgCreateDto dto)
    {
        string codigo = dto.Codigo.Trim().ToUpperInvariant();
        string nome = dto.Nome.Trim();
        if (!SistemaRpgConfiguration.CodigoValido(codigo))
            return Validacao<SistemaRpgResumoDto>("O código deve começar por letra e conter somente letras maiúsculas, números ou sublinhado.");
        if (string.IsNullOrWhiteSpace(nome))
            return Validacao<SistemaRpgResumoDto>("O nome do sistema é obrigatório.");
        if (await _repository.SystemCodeExistsAsync(codigo))
            return Conflito<SistemaRpgResumoDto>("Já existe um sistema com esse código.");

        SistemaRpg sistema = new()
        {
            Codigo = codigo,
            Nome = nome,
            Descricao = Limpar(dto.Descricao),
            Ativo = dto.Ativo,
            DataCriacao = DateTime.UtcNow,
            DataAtualizacao = DateTime.UtcNow,
        };
        await _repository.AddSystemAsync(sistema);
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<SistemaRpgResumoDto>.Ok(SistemaRpgMapper.ToResumo(sistema));
    }

    public async Task<SistemaOperacaoResultado<SistemaRpgResumoDto>> AtualizarAsync(
        int idSistemaRpg,
        SistemaRpgUpdateDto dto)
    {
        SistemaRpg? sistema = await _repository.GetByIdAsync(idSistemaRpg, tracked: true);
        if (sistema is null)
            return NaoEncontrado<SistemaRpgResumoDto>("Sistema de RPG não encontrado.");
        if (string.IsNullOrWhiteSpace(dto.Nome))
            return Validacao<SistemaRpgResumoDto>("O nome do sistema é obrigatório.");

        sistema.Nome = dto.Nome.Trim();
        sistema.Descricao = Limpar(dto.Descricao);
        sistema.Ativo = dto.Ativo;
        sistema.DataAtualizacao = DateTime.UtcNow;
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<SistemaRpgResumoDto>.Ok(
            SistemaRpgMapper.ToResumo(sistema, await _repository.CountMesasBySystemAsync(idSistemaRpg)));
    }

    public async Task<SistemaOperacaoResultado<bool>> ExcluirAsync(int idSistemaRpg)
    {
        SistemaRpg? sistema = await _repository.GetByIdAsync(idSistemaRpg, tracked: true);
        if (sistema is null)
            return NaoEncontrado<bool>("Sistema de RPG não encontrado.");
        if (await _repository.CountMesasBySystemAsync(idSistemaRpg) > 0)
            return Conflito<bool>("O sistema não pode ser excluído porque está associado a mesas.");
        if (sistema.Versoes.Any(v => v.Status != SistemaVersaoStatus.Rascunho))
            return Conflito<bool>("Um sistema com histórico publicado não pode ser excluído; desative-o.");

        _repository.RemoveSystem(sistema);
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<bool>.Ok(true);
    }

    public async Task<SistemaOperacaoResultado<List<SistemaVersaoResumoDto>>> ObterVersoesAsync(
        int idSistemaRpg,
        bool incluirRascunhos = false)
    {
        SistemaRpg? sistema = await _repository.GetByIdAsync(idSistemaRpg);
        if (sistema is null)
            return NaoEncontrado<List<SistemaVersaoResumoDto>>("Sistema de RPG não encontrado.");

        List<SistemaVersao> versoes = await _repository.GetVersionsAsync(idSistemaRpg);
        List<SistemaVersaoResumoDto> resultado = new();
        foreach (SistemaVersao versao in versoes.Where(v => incluirRascunhos || v.Status != SistemaVersaoStatus.Rascunho))
        {
            resultado.Add(SistemaRpgMapper.ToResumo(
                versao,
                await _repository.CountMesasByVersionAsync(versao.IdSistemaVersao)));
        }
        return SistemaOperacaoResultado<List<SistemaVersaoResumoDto>>.Ok(resultado);
    }

    public async Task<SistemaOperacaoResultado<SistemaVersaoDetalheDto>> ObterVersaoAsync(
        int idSistemaRpg,
        int idSistemaVersao,
        bool incluirRascunhos = false)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao, includeConfiguration: true);
        if (versao is null || versao.IdSistemaRpg != idSistemaRpg ||
            (versao.Status == SistemaVersaoStatus.Rascunho && !incluirRascunhos))
            return NaoEncontrado<SistemaVersaoDetalheDto>("Versão do sistema não encontrada.");
        return SistemaOperacaoResultado<SistemaVersaoDetalheDto>.Ok(await MapearDetalheAsync(versao));
    }

    public async Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> CriarVersaoAsync(
        int idSistemaRpg,
        SistemaVersaoCreateDto dto)
    {
        SistemaRpg? sistema = await _repository.GetByIdAsync(idSistemaRpg);
        if (sistema is null)
            return NaoEncontrado<SistemaVersaoResumoDto>("Sistema de RPG não encontrado.");
        string numero = dto.NumeroVersao.Trim();
        if (!SistemaRpgConfiguration.VersaoValida(numero))
            return Validacao<SistemaVersaoResumoDto>("A versão deve usar o formato semântico, por exemplo 1.0 ou 1.0.0.");
        if (await _repository.VersionNumberExistsAsync(idSistemaRpg, numero))
            return Conflito<SistemaVersaoResumoDto>("Já existe uma versão com esse número neste sistema.");

        SistemaVersao? baseVersion = null;
        if (dto.IdVersaoBase.HasValue)
        {
            baseVersion = await _repository.GetVersionAsync(dto.IdVersaoBase.Value, includeConfiguration: true);
            if (baseVersion is null || baseVersion.IdSistemaRpg != idSistemaRpg)
                return Validacao<SistemaVersaoResumoDto>("A versão base não pertence ao sistema informado.");
        }

        SistemaVersao versao = NovaVersao(idSistemaRpg, numero, dto.Changelog, dto.IdVersaoBase);
        if (baseVersion is not null)
            ClonarConfiguracao(baseVersion, versao);
        else
            CriarModulosPadrao(versao);

        await _repository.AddVersionAsync(versao);
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<SistemaVersaoResumoDto>.Ok(SistemaRpgMapper.ToResumo(versao));
    }

    public async Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> DuplicarVersaoAsync(
        int idSistemaVersao,
        SistemaVersaoDuplicarDto dto)
    {
        SistemaVersao? origem = await _repository.GetVersionAsync(idSistemaVersao, includeConfiguration: true);
        if (origem is null)
            return NaoEncontrado<SistemaVersaoResumoDto>("Versão do sistema não encontrada.");
        string numero = dto.NumeroVersao.Trim();
        if (!SistemaRpgConfiguration.VersaoValida(numero))
            return Validacao<SistemaVersaoResumoDto>("A versão deve usar o formato semântico, por exemplo 1.0 ou 1.0.0.");
        if (await _repository.VersionNumberExistsAsync(origem.IdSistemaRpg, numero))
            return Conflito<SistemaVersaoResumoDto>("Já existe uma versão com esse número neste sistema.");

        SistemaVersao copia = NovaVersao(origem.IdSistemaRpg, numero, dto.Changelog, origem.IdSistemaVersao);
        ClonarConfiguracao(origem, copia);
        await _repository.AddVersionAsync(copia);
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<SistemaVersaoResumoDto>.Ok(SistemaRpgMapper.ToResumo(copia));
    }

    public async Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> PublicarVersaoAsync(int idSistemaVersao)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao, includeConfiguration: true, tracked: true);
        if (versao is null)
            return NaoEncontrado<SistemaVersaoResumoDto>("Versão do sistema não encontrada.");
        if (versao.Status != SistemaVersaoStatus.Rascunho)
            return Conflito<SistemaVersaoResumoDto>("Somente uma versão em rascunho pode ser publicada.");

        List<string> erros = ValidarPublicacao(versao);
        if (erros.Count > 0)
            return Validacao<SistemaVersaoResumoDto>(string.Join(" ", erros));

        await _repository.ExecuteInTransactionAsync(async () =>
        {
            SistemaRpg sistema = versao.SistemaRpg;
            DateTime agora = DateTime.UtcNow;
            if (sistema.VersaoPublicada is not null && sistema.VersaoPublicada.IdSistemaVersao != versao.IdSistemaVersao)
            {
                sistema.VersaoPublicada.Status = SistemaVersaoStatus.Arquivado;
                sistema.VersaoPublicada.DataArquivamento = agora;
                sistema.VersaoPublicada.DataAtualizacao = agora;
            }
            versao.Status = SistemaVersaoStatus.Publicado;
            versao.DataPublicacao = agora;
            versao.DataArquivamento = null;
            versao.DataAtualizacao = agora;
            sistema.VersaoPublicada = versao;
            sistema.IdVersaoPublicada = versao.IdSistemaVersao;
            sistema.DataAtualizacao = agora;
            await _repository.SaveChangesAsync();
        });
        return SistemaOperacaoResultado<SistemaVersaoResumoDto>.Ok(
            SistemaRpgMapper.ToResumo(versao, await _repository.CountMesasByVersionAsync(idSistemaVersao)));
    }

    public async Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> ArquivarVersaoAsync(int idSistemaVersao)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao, tracked: true);
        if (versao is null)
            return NaoEncontrado<SistemaVersaoResumoDto>("Versão do sistema não encontrada.");
        if (versao.Status != SistemaVersaoStatus.Publicado)
            return Conflito<SistemaVersaoResumoDto>("Somente uma versão publicada pode ser arquivada.");
        await _repository.ExecuteInTransactionAsync(async () =>
        {
            DateTime agora = DateTime.UtcNow;
            SistemaRpg sistema = versao.SistemaRpg;
            if (sistema.IdVersaoPublicada == idSistemaVersao)
            {
                sistema.IdVersaoPublicada = null;
                sistema.VersaoPublicada = null;
                sistema.DataAtualizacao = agora;
            }

            versao.Status = SistemaVersaoStatus.Arquivado;
            versao.DataArquivamento = agora;
            versao.DataAtualizacao = agora;
            await _repository.SaveChangesAsync();
        });
        return SistemaOperacaoResultado<SistemaVersaoResumoDto>.Ok(
            SistemaRpgMapper.ToResumo(versao, await _repository.CountMesasByVersionAsync(idSistemaVersao)));
    }

    public async Task<SistemaOperacaoResultado<bool>> ExcluirVersaoAsync(int idSistemaRpg, int idSistemaVersao)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao, tracked: true);
        if (versao is null || versao.IdSistemaRpg != idSistemaRpg)
            return NaoEncontrado<bool>("Versão do sistema não encontrada.");
        if (versao.Status != SistemaVersaoStatus.Rascunho)
            return Conflito<bool>("Somente versões em rascunho podem ser excluídas.");
        if (await _repository.CountMesasByVersionAsync(idSistemaVersao) > 0)
            return Conflito<bool>("A versão está associada a mesas e não pode ser excluída.");
        if (await _repository.HasDerivedVersionsAsync(idSistemaVersao))
            return Conflito<bool>("A versão é base de outra versão e não pode ser excluída.");

        _repository.RemoveVersion(versao);
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<bool>.Ok(true);
    }

    public async Task<SistemaOperacaoResultado<bool>> ValidarVersaoSelecionavelAsync(int idSistemaVersao)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao);
        if (versao is null)
            return NaoEncontrado<bool>("Versão do sistema não encontrada.");
        if (versao.Status != SistemaVersaoStatus.Publicado || !versao.SistemaRpg.Ativo)
            return Validacao<bool>("Somente uma versão publicada de um sistema ativo pode ser vinculada a uma mesa.");
        return SistemaOperacaoResultado<bool>.Ok(true);
    }

    public async Task<SistemaOperacaoResultado<SistemaResolvidoDto>> MigrarMesaAsync(
        int idMesa,
        int idSistemaVersao)
    {
        Mesa? mesa = await _repository.GetMesaAsync(idMesa, tracked: true);
        if (mesa is null)
            return NaoEncontrado<SistemaResolvidoDto>("Mesa não encontrada.");
        SistemaOperacaoResultado<bool> validacao = await ValidarVersaoSelecionavelAsync(idSistemaVersao);
        if (!validacao.Sucesso)
            return SistemaOperacaoResultado<SistemaResolvidoDto>.Falha(validacao.MensagemErro!, validacao.TipoErro);

        mesa.IdSistemaVersao = idSistemaVersao;
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<SistemaResolvidoDto>.Ok(await _resolver.ResolverAsync(idMesa));
    }

    private async Task<SistemaVersaoDetalheDto> MapearDetalheAsync(SistemaVersao versao)
    {
        SistemaVersaoResumoDto resumo = SistemaRpgMapper.ToResumo(
            versao,
            await _repository.CountMesasByVersionAsync(versao.IdSistemaVersao));
        return new SistemaVersaoDetalheDto
        {
            IdSistemaVersao = resumo.IdSistemaVersao,
            IdSistemaRpg = resumo.IdSistemaRpg,
            NumeroVersao = resumo.NumeroVersao,
            Status = resumo.Status,
            IdVersaoBase = resumo.IdVersaoBase,
            Changelog = resumo.Changelog,
            DataCriacao = resumo.DataCriacao,
            DataAtualizacao = resumo.DataAtualizacao,
            DataPublicacao = resumo.DataPublicacao,
            DataArquivamento = resumo.DataArquivamento,
            QuantidadeMesas = resumo.QuantidadeMesas,
            CodigoSistema = versao.SistemaRpg.Codigo,
            NomeSistema = versao.SistemaRpg.Nome,
            ConfiguracaoGeral = SistemaRpgMapper.ToGeral(versao),
            Criacao = SistemaRpgMapper.ToCriacao(versao),
            Progressao = SistemaRpgMapper.ToProgressao(versao),
            Exploracao = SistemaRpgMapper.ToExploracao(versao),
            Combate = SistemaRpgMapper.ToCombate(versao),
            Poderes = SistemaRpgMapper.ToPoderes(versao),
            Sobrevivencia = SistemaRpgMapper.ToSobrevivencia(versao),
        };
    }

    private static SistemaVersao NovaVersao(
        int idSistemaRpg,
        string numero,
        string? changelog,
        int? idVersaoBase) => new()
    {
        IdSistemaRpg = idSistemaRpg,
        NumeroVersao = numero,
        IdVersaoBase = idVersaoBase,
        Changelog = Limpar(changelog),
        Status = SistemaVersaoStatus.Rascunho,
        DataCriacao = DateTime.UtcNow,
        DataAtualizacao = DateTime.UtcNow,
    };

    private static string? Limpar(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static SistemaOperacaoResultado<T> Validacao<T>(string mensagem) =>
        SistemaOperacaoResultado<T>.Falha(mensagem, SistemaOperacaoErro.Validacao);
    private static SistemaOperacaoResultado<T> NaoEncontrado<T>(string mensagem) =>
        SistemaOperacaoResultado<T>.Falha(mensagem, SistemaOperacaoErro.NaoEncontrado);
    private static SistemaOperacaoResultado<T> Conflito<T>(string mensagem) =>
        SistemaOperacaoResultado<T>.Falha(mensagem, SistemaOperacaoErro.Conflito);
}
