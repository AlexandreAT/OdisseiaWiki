using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public sealed class SistemaPatchNoteDto
{
    public int IdSistemaPatchNote { get; set; }
    public int IdSistemaRpg { get; set; }
    public string CodigoSistema { get; set; } = null!;
    public string NomeSistema { get; set; } = null!;
    public int? IdVersaoAnterior { get; set; }
    public string? NumeroVersaoAnterior { get; set; }
    public int IdSistemaVersao { get; set; }
    public string NumeroVersaoNova { get; set; } = null!;
    public DateTime DataGeracao { get; set; }
    public string Titulo { get; set; } = null!;
    public string Resumo { get; set; } = null!;
    public bool VersaoInicial { get; set; }
    public List<SistemaPatchGrupoDto> Grupos { get; set; } = new();
}

public sealed class SistemaPatchGrupoDto
{
    public string Modulo { get; set; } = null!;
    public string Titulo { get; set; } = null!;
    public SistemaPatchImpacto Impacto { get; set; }
    public List<SistemaPatchAlteracaoDto> Alteracoes { get; set; } = new();
}

public sealed class SistemaPatchAlteracaoDto
{
    public string Modulo { get; set; } = null!;
    public string Entidade { get; set; } = null!;
    public string? Identidade { get; set; }
    public string Campo { get; set; } = null!;
    public JsonElement? ValorAnterior { get; set; }
    public JsonElement? ValorNovo { get; set; }
    public SistemaPatchAlteracaoTipo Tipo { get; set; }
    public SistemaPatchImpacto Impacto { get; set; }
    public string Descricao { get; set; } = null!;
}

public sealed class MesaMigracaoPreviewRequestDto
{
    [Range(1, int.MaxValue)]
    public int IdSistemaVersaoDestino { get; set; }
}

public sealed class MesaMigracaoPreviewDto
{
    public int IdMesa { get; set; }
    public string NomeMesa { get; set; } = null!;
    public int? IdSistemaVersaoOrigem { get; set; }
    public string NumeroVersaoOrigem { get; set; } = "LEGACY";
    public int IdSistemaVersaoDestino { get; set; }
    public string NumeroVersaoDestino { get; set; } = null!;
    public bool RequerConfirmacaoExplicita { get; set; } = true;
    public bool AlteraSomenteVersaoDaMesa { get; set; } = true;
    public List<string> ValoresPreservados { get; set; } = new();
    public SistemaPatchNoteDto Comparacao { get; set; } = new();
    public List<SistemaMigracaoAvisoDto> Avisos { get; set; } = new();
    public SistemaMigracaoResumoMesaDto ResumoMesa { get; set; } = new();
}

public sealed class SistemaMigracaoAvisoDto
{
    public string Codigo { get; set; } = null!;
    public SistemaMigracaoAvisoNivel Nivel { get; set; }
    public string Categoria { get; set; } = null!;
    public string Mensagem { get; set; } = null!;
    public string? Entidade { get; set; }
    public string? Identidade { get; set; }
    public int Quantidade { get; set; } = 1;
}

public sealed class SistemaMigracaoResumoMesaDto
{
    public int QuantidadePersonagens { get; set; }
    public int QuantidadeOverrides { get; set; }
    public int QuantidadeItensInventario { get; set; }
    public int QuantidadeAvisos { get; set; }
    public int QuantidadeBloqueios { get; set; }
}
