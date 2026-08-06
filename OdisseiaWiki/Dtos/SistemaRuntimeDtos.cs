using OdisseiaWiki.Enums;

namespace OdisseiaWiki.Dtos;

public sealed class SistemaRuntimeConsultaDto
{
    public int? IdMesa { get; set; }
    public int? IdPersonagemJogador { get; set; }
    public SistemaEntidadeGlobalTipo? TipoEntidade { get; set; }
    public string? IdEntidade { get; set; }
    public int? IdRaca { get; set; }
    public string? CodigoTipoItem { get; set; }
    public string? CodigoCategoriaItem { get; set; }
    public string? CodigoArquetipoItem { get; set; }
}

public sealed class SistemaRuntimeContextoDto
{
    public int? IdSistemaRpg { get; set; }
    public int? IdSistemaVersao { get; set; }
    public string CodigoSistema { get; set; } = "ODISSEIA";
    public string? NomeSistema { get; set; }
    public string NumeroVersao { get; set; } = "LEGACY";
    public SistemaVersaoStatus? StatusVersao { get; set; }
    public SistemaRuntimeOrigem Origem { get; set; } = SistemaRuntimeOrigem.FallbackLegado;
    public int? IdMesa { get; set; }
    public int? IdPersonagemJogador { get; set; }
    public SistemaRuntimeVinculoEntidadeDto? Entidade { get; set; }
    public bool AcompanhaPublicacaoAtual { get; set; }
    public int? IdVersaoFixada { get; set; }
    public bool AtualizacaoDisponivel { get; set; }
    public int? IdVersaoDisponivel { get; set; }
    public string? NumeroVersaoDisponivel { get; set; }
    public bool UsaFallbackLegado { get; set; }
    public SistemaConfiguracaoGeralDto? ConfiguracaoGeral { get; set; }
    public SistemaCriacaoConfigDto? Criacao { get; set; }
    public SistemaProgressaoConfigDto? Progressao { get; set; }
    public SistemaExploracaoConfigDto? Exploracao { get; set; }
    public SistemaCombateConfigDto? Combate { get; set; }
    public SistemaPoderesConfigDto? Poderes { get; set; }
    public SistemaSobrevivenciaConfigDto? Sobrevivencia { get; set; }
    public SistemaRacaConfigDto? ConfiguracaoRacial { get; set; }
    public SistemaItensConfigDto Itens { get; set; } = new();
    public SistemaItemReferenciaEfetivaDto? ReferenciaItem { get; set; }
    public List<SistemaRuntimeProvenienciaDto> Proveniencias { get; set; } = new();
    public List<SistemaRuntimeWarningDto> Warnings { get; set; } = new();
    public List<SistemaRuntimeFallbackDto> Fallbacks { get; set; } = new();
}

public sealed class SistemaRuntimeVinculoEntidadeDto
{
    public SistemaEntidadeGlobalTipo TipoEntidade { get; set; }
    public string IdEntidade { get; set; } = null!;
    public int? IdSistemaRpg { get; set; }
    public int? IdSistemaVersao { get; set; }
    public bool AcompanharPublicacaoAtual { get; set; }
}

public sealed class SistemaRuntimeProvenienciaDto
{
    public string Caminho { get; set; } = null!;
    public SistemaValorProveniencia Origem { get; set; }
    public string? Detalhe { get; set; }
}

public sealed class SistemaRuntimeWarningDto
{
    public SistemaRuntimeWarningCodigo Codigo { get; set; }
    public string Mensagem { get; set; } = null!;
    public string? Caminho { get; set; }
    public decimal? ValorInformado { get; set; }
    public decimal? ValorMinimoReferencia { get; set; }
    public decimal? ValorMaximoReferencia { get; set; }
    public string? Referencia { get; set; }
}

public sealed class SistemaRuntimeFallbackDto
{
    public string Caminho { get; set; } = null!;
    public string Motivo { get; set; } = null!;
    public SistemaValorProveniencia Origem { get; set; } = SistemaValorProveniencia.FallbackLegado;
}

public sealed class SistemaItensConfigDto
{
    public List<SistemaItemEscopoDto> Tipos { get; set; } = new();
}

public sealed class SistemaItemEscopoDto
{
    public int IdSistemaItemEscopo { get; set; }
    public int? IdEscopoPai { get; set; }
    public SistemaItemEscopoNivel Nivel { get; set; }
    public string Codigo { get; set; } = null!;
    public string CodigoCaminho { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; }
    public List<SistemaItemCampoDto> Campos { get; set; } = new();
    public List<SistemaItemFaixaDto> Faixas { get; set; } = new();
    public List<SistemaItemReferenciaDto> Referencias { get; set; } = new();
    public List<SistemaItemEscopoDto> Filhos { get; set; } = new();
}

public sealed class SistemaItemCampoDto
{
    public int IdSistemaItemCampo { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public SistemaItemCampoTipo Tipo { get; set; }
    public string? Unidade { get; set; }
    public bool Obrigatorio { get; set; }
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public string? CodigoCaminhoOrigem { get; set; }
}

public sealed class SistemaItemFaixaDto
{
    public int IdSistemaItemFaixa { get; set; }
    public string CodigoCampo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public decimal? ValorMinimo { get; set; }
    public decimal? ValorMaximo { get; set; }
    public decimal? ValorReferencia { get; set; }
    public string? Unidade { get; set; }
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public string? CodigoCaminhoOrigem { get; set; }
}

public sealed class SistemaItemReferenciaDto
{
    public int IdSistemaItemReferencia { get; set; }
    public SistemaItemReferenciaTipo Tipo { get; set; }
    public string Codigo { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Valor { get; set; }
    public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public string? CodigoCaminhoOrigem { get; set; }
}

public sealed class SistemaItemReferenciaEfetivaDto
{
    public string? CodigoTipo { get; set; }
    public string? CodigoCategoria { get; set; }
    public string? CodigoArquetipo { get; set; }
    public string? CodigoCaminho { get; set; }
    public bool Completa { get; set; }
    public List<SistemaItemCampoDto> Campos { get; set; } = new();
    public List<SistemaItemFaixaDto> Faixas { get; set; } = new();
    public List<SistemaItemReferenciaDto> Referencias { get; set; } = new();
}

public sealed class SistemaRacaRuntimeOverrideDto
{
    public int? VidaBase { get; set; }
    public int? EstaminaBase { get; set; }
    public int? ManaBase { get; set; }
    public int? CapacidadeCargaBase { get; set; }
    public string? CodigoAtributoInicial { get; set; }
}
