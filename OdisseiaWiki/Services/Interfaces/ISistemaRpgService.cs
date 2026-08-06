using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services.Interfaces;

public interface ISistemaRpgService
{
    Task<List<SistemaRpgResumoDto>> ObterTodosAsync(bool incluirInativos = false);
    Task<SistemaOperacaoResultado<SistemaRpgDetalheDto>> ObterAsync(int idSistemaRpg, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaRpgResumoDto>> CriarAsync(SistemaRpgCreateDto dto);
    Task<SistemaOperacaoResultado<SistemaRpgResumoDto>> AtualizarAsync(int idSistemaRpg, SistemaRpgUpdateDto dto);
    Task<SistemaOperacaoResultado<bool>> ExcluirAsync(int idSistemaRpg);

    Task<SistemaOperacaoResultado<List<SistemaVersaoResumoDto>>> ObterVersoesAsync(int idSistemaRpg, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaVersaoDetalheDto>> ObterVersaoAsync(int idSistemaRpg, int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> CriarVersaoAsync(int idSistemaRpg, SistemaVersaoCreateDto dto);
    Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> DuplicarVersaoAsync(int idSistemaVersao, SistemaVersaoDuplicarDto dto);
    Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> PublicarVersaoAsync(int idSistemaVersao);
    Task<SistemaOperacaoResultado<SistemaPatchNoteDto>> ObterPatchNoteAsync(int idSistemaVersao);
    Task<SistemaOperacaoResultado<SistemaVersaoResumoDto>> ArquivarVersaoAsync(int idSistemaVersao);
    Task<SistemaOperacaoResultado<bool>> ExcluirVersaoAsync(int idSistemaRpg, int idSistemaVersao);

    Task<SistemaOperacaoResultado<SistemaConfiguracaoGeralDto>> ObterConfiguracaoGeralAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaConfiguracaoGeralDto>> AtualizarConfiguracaoGeralAsync(int idSistemaVersao, SistemaConfiguracaoGeralDto dto);
    Task<SistemaOperacaoResultado<SistemaCriacaoConfigDto>> ObterCriacaoAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaCriacaoConfigDto>> AtualizarCriacaoAsync(int idSistemaVersao, SistemaCriacaoConfigDto dto);
    Task<SistemaOperacaoResultado<SistemaProgressaoConfigDto>> ObterProgressaoAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaProgressaoConfigDto>> AtualizarProgressaoAsync(int idSistemaVersao, SistemaProgressaoConfigDto dto);
    Task<SistemaOperacaoResultado<SistemaExploracaoConfigDto>> ObterExploracaoAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaExploracaoConfigDto>> AtualizarExploracaoAsync(int idSistemaVersao, SistemaExploracaoConfigDto dto);
    Task<SistemaOperacaoResultado<SistemaCombateConfigDto>> ObterCombateAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaCombateConfigDto>> AtualizarCombateAsync(int idSistemaVersao, SistemaCombateConfigDto dto);
    Task<SistemaOperacaoResultado<SistemaPoderesConfigDto>> ObterPoderesAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaPoderesConfigDto>> AtualizarPoderesAsync(int idSistemaVersao, SistemaPoderesConfigDto dto);
    Task<SistemaOperacaoResultado<SistemaSobrevivenciaConfigDto>> ObterSobrevivenciaAsync(int idSistemaVersao, bool incluirRascunhos = false);
    Task<SistemaOperacaoResultado<SistemaSobrevivenciaConfigDto>> AtualizarSobrevivenciaAsync(int idSistemaVersao, SistemaSobrevivenciaConfigDto dto);

    Task<SistemaOperacaoResultado<bool>> ValidarVersaoSelecionavelAsync(int idSistemaVersao);
    Task<SistemaOperacaoResultado<MesaMigracaoPreviewDto>> ObterPreviaMigracaoMesaAsync(
        int idMesa,
        int idSistemaVersaoDestino);
    Task<SistemaOperacaoResultado<SistemaResolvidoDto>> MigrarMesaAsync(
        int idMesa,
        int idSistemaVersao,
        bool confirmarPreservacaoValores);
}

public interface ISistemaRpgResolver
{
    Task<SistemaResolvidoDto> ResolverAsync(int? idMesa = null);
    Task<SistemaRuntimeContextoDto> ResolverContextoAsync(SistemaRuntimeConsultaDto consulta);
    Task<SistemaRuntimeContextoDto> ResolverContextoAsync(
        SistemaRuntimeConsultaDto consulta,
        SistemaEntidadeGlobalVinculoSnapshot vinculoProposto);
}

public interface ISistemaRpgSeeder
{
    Task SeedAsync();
}
