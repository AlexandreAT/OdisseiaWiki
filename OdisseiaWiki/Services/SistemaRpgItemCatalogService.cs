using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class SistemaRpgItemCatalogService : ISistemaRpgItemCatalogService
{
    private readonly ISistemaRpgRepository _repository;

    public SistemaRpgItemCatalogService(ISistemaRpgRepository repository) => _repository = repository;

    public async Task<SistemaOperacaoResultado<SistemaItensConfigDto>> ObterAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(
            idSistemaVersao,
            includeConfiguration: true);
        if (versao is null || (!incluirRascunhos && versao.Status == SistemaVersaoStatus.Rascunho))
            return NaoEncontrado("Versão de sistema não encontrada.");

        return SistemaOperacaoResultado<SistemaItensConfigDto>.Ok(
            SistemaRpgMapper.ToItens(versao, incluirInativos: incluirRascunhos));
    }

    public async Task<SistemaOperacaoResultado<SistemaItensConfigDto>> AtualizarAsync(
        int idSistemaVersao,
        SistemaItensConfigDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        SistemaVersao? versao = await _repository.GetVersionAsync(
            idSistemaVersao,
            includeConfiguration: true,
            tracked: true);
        if (versao is null)
            return NaoEncontrado("Versão de sistema não encontrada.");
        if (versao.Status != SistemaVersaoStatus.Rascunho)
        {
            return SistemaOperacaoResultado<SistemaItensConfigDto>.Falha(
                "Versões publicadas ou arquivadas são imutáveis; duplique a versão antes de editar o catálogo.",
                SistemaOperacaoErro.Conflito);
        }

        List<string> erros = Validar(dto);
        if (erros.Count > 0)
        {
            return SistemaOperacaoResultado<SistemaItensConfigDto>.Falha(
                string.Join(" ", erros.Distinct(StringComparer.Ordinal)));
        }

        _repository.RemoveRange(versao.ItemEscopos.Cast<object>().ToList());
        versao.ItemEscopos = Mapear(dto, versao);
        versao.DataAtualizacao = DateTime.UtcNow;
        await _repository.SaveChangesAsync();
        return SistemaOperacaoResultado<SistemaItensConfigDto>.Ok(SistemaRpgMapper.ToItens(versao, incluirInativos: true));
    }

    internal static List<string> Validar(SistemaItensConfigDto dto)
    {
        List<string> erros = new();
        if (dto.Tipos is null)
        {
            erros.Add("A lista de tipos do catalogo nao pode ser nula.");
            return erros;
        }

        ValidarEstruturaCatalogo(dto.Tipos, null, erros);
        if (erros.Count > 0)
            return erros;

        HashSet<string> caminhos = new(StringComparer.OrdinalIgnoreCase);
        foreach (SistemaItemEscopoDto tipo in dto.Tipos)
        {
            ValidarEscopo(
                tipo,
                SistemaItemEscopoNivel.Tipo,
                null,
                new HashSet<string>(StringComparer.OrdinalIgnoreCase),
                caminhos,
                erros);
        }

        return erros;
    }

    internal static List<SistemaItemEscopo> ClonarCatalogo(IEnumerable<SistemaItemEscopo> origem)
    {
        List<SistemaItemEscopo> itensOriginais = origem.ToList();
        Dictionary<int, SistemaItemEscopo> clones = itensOriginais.ToDictionary(
            item => item.IdSistemaItemEscopo,
            item => new SistemaItemEscopo
            {
                Nivel = item.Nivel,
                Codigo = item.Codigo,
                CodigoCaminho = item.CodigoCaminho,
                Nome = item.Nome,
                Descricao = item.Descricao,
                Ordem = item.Ordem,
                Ativo = item.Ativo,
                Campos = item.Campos.Select(campo => new SistemaItemCampo
                {
                    Codigo = campo.Codigo,
                    Nome = campo.Nome,
                    Tipo = campo.Tipo,
                    Unidade = campo.Unidade,
                    Obrigatorio = campo.Obrigatorio,
                    Descricao = campo.Descricao,
                    Ordem = campo.Ordem,
                }).ToList(),
                Faixas = item.Faixas.Select(faixa => new SistemaItemFaixa
                {
                    CodigoCampo = faixa.CodigoCampo,
                    Nome = faixa.Nome,
                    ValorMinimo = faixa.ValorMinimo,
                    ValorMaximo = faixa.ValorMaximo,
                    ValorReferencia = faixa.ValorReferencia,
                    Unidade = faixa.Unidade,
                    Descricao = faixa.Descricao,
                    Ordem = faixa.Ordem,
                }).ToList(),
                Referencias = item.Referencias.Select(referencia => new SistemaItemReferencia
                {
                    Tipo = referencia.Tipo,
                    Codigo = referencia.Codigo,
                    Nome = referencia.Nome,
                    Valor = referencia.Valor,
                    Descricao = referencia.Descricao,
                    Ordem = referencia.Ordem,
                }).ToList(),
            });

        foreach (SistemaItemEscopo original in itensOriginais.Where(item => item.IdEscopoPai.HasValue))
        {
            if (!clones.TryGetValue(original.IdEscopoPai!.Value, out SistemaItemEscopo? pai))
                continue;
            SistemaItemEscopo filho = clones[original.IdSistemaItemEscopo];
            filho.EscopoPai = pai;
            pai.Filhos.Add(filho);
        }

        return clones.Values.ToList();
    }

    private static List<SistemaItemEscopo> Mapear(
        SistemaItensConfigDto dto,
        SistemaVersao versao)
    {
        List<SistemaItemEscopo> resultado = new();
        foreach (SistemaItemEscopoDto tipo in dto.Tipos)
            MapearEscopo(tipo, SistemaItemEscopoNivel.Tipo, null, null, versao, resultado);
        return resultado;
    }

    private static void MapearEscopo(
        SistemaItemEscopoDto dto,
        SistemaItemEscopoNivel nivel,
        SistemaItemEscopo? pai,
        string? caminhoPai,
        SistemaVersao versao,
        ICollection<SistemaItemEscopo> resultado)
    {
        string codigo = SistemaRpgConfiguration.NormalizarCodigo(dto.Codigo, dto.Nome);
        string caminho = string.IsNullOrWhiteSpace(caminhoPai) ? codigo : $"{caminhoPai}/{codigo}";
        SistemaItemEscopo entidade = new()
        {
            SistemaVersao = versao,
            IdSistemaVersao = versao.IdSistemaVersao,
            EscopoPai = pai,
            Nivel = nivel,
            Codigo = codigo,
            CodigoCaminho = caminho,
            Nome = dto.Nome.Trim(),
            Descricao = Limpar(dto.Descricao),
            Ordem = dto.Ordem,
            Ativo = dto.Ativo,
            Campos = dto.Campos.Select(campo => new SistemaItemCampo
            {
                Codigo = SistemaRpgConfiguration.NormalizarCodigo(campo.Codigo, campo.Nome),
                Nome = campo.Nome.Trim(),
                Tipo = campo.Tipo,
                Unidade = Limpar(campo.Unidade),
                Obrigatorio = campo.Obrigatorio,
                Descricao = Limpar(campo.Descricao),
                Ordem = campo.Ordem,
            }).ToList(),
            Faixas = dto.Faixas.Select(faixa => new SistemaItemFaixa
            {
                CodigoCampo = SistemaRpgConfiguration.NormalizarCodigo(faixa.CodigoCampo, faixa.Nome),
                Nome = faixa.Nome.Trim(),
                ValorMinimo = faixa.ValorMinimo,
                ValorMaximo = faixa.ValorMaximo,
                ValorReferencia = faixa.ValorReferencia,
                Unidade = Limpar(faixa.Unidade),
                Descricao = Limpar(faixa.Descricao),
                Ordem = faixa.Ordem,
            }).ToList(),
            Referencias = dto.Referencias.Select(referencia => new SistemaItemReferencia
            {
                Tipo = referencia.Tipo,
                Codigo = SistemaRpgConfiguration.NormalizarCodigo(referencia.Codigo, referencia.Nome),
                Nome = referencia.Nome.Trim(),
                Valor = Limpar(referencia.Valor),
                Descricao = Limpar(referencia.Descricao),
                Ordem = referencia.Ordem,
            }).ToList(),
        };
        resultado.Add(entidade);

        SistemaItemEscopoNivel? nivelFilho = nivel switch
        {
            SistemaItemEscopoNivel.Tipo => SistemaItemEscopoNivel.Categoria,
            SistemaItemEscopoNivel.Categoria => SistemaItemEscopoNivel.Arquetipo,
            _ => null,
        };
        if (!nivelFilho.HasValue)
            return;

        foreach (SistemaItemEscopoDto filho in dto.Filhos)
            MapearEscopo(filho, nivelFilho.Value, entidade, caminho, versao, resultado);
    }

    private static void ValidarEstruturaCatalogo(
        IEnumerable<SistemaItemEscopoDto> escopos,
        string? caminhoPai,
        ICollection<string> erros)
    {
        foreach (SistemaItemEscopoDto dto in escopos)
        {
            if (!Enum.IsDefined(dto.Nivel))
                erros.Add($"O escopo {dto.Nome ?? "sem nome"} possui nivel invalido.");
            if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nome))
                continue;

            if (dto.Codigo.Length > 50 || dto.Nome.Length > 150)
                erros.Add($"O escopo {dto.Nome} excede o tamanho maximo permitido.");

            string codigo = SistemaRpgConfiguration.NormalizarCodigo(dto.Codigo, dto.Nome);
            string caminho = string.IsNullOrWhiteSpace(caminhoPai) ? codigo : $"{caminhoPai}/{codigo}";
            if (caminho.Length > 200)
                erros.Add($"O caminho de item {caminho} excede 200 caracteres.");

            if (dto.Campos is null)
            {
                erros.Add($"A lista de campos do escopo {dto.Nome} nao pode ser nula.");
                continue;
            }
            foreach (SistemaItemCampoDto campo in dto.Campos)
            {
                if (string.IsNullOrWhiteSpace(campo.Codigo) || string.IsNullOrWhiteSpace(campo.Nome))
                {
                    erros.Add($"Todo campo do escopo {dto.Nome} deve possuir codigo e nome.");
                    continue;
                }
                if (!Enum.IsDefined(campo.Tipo))
                    erros.Add($"O campo {campo.Nome ?? "sem nome"} possui tipo invalido.");
                if ((!string.IsNullOrWhiteSpace(campo.Codigo) && campo.Codigo.Length > 50) ||
                    (!string.IsNullOrWhiteSpace(campo.Nome) && campo.Nome.Length > 150) ||
                    campo.Unidade?.Length > 50)
                    erros.Add($"O campo {campo.Nome ?? "sem nome"} excede o tamanho maximo permitido.");
            }

            if (dto.Faixas is null)
            {
                erros.Add($"A lista de faixas do escopo {dto.Nome} nao pode ser nula.");
                continue;
            }
            foreach (SistemaItemFaixaDto faixa in dto.Faixas)
            {
                if (string.IsNullOrWhiteSpace(faixa.CodigoCampo) || string.IsNullOrWhiteSpace(faixa.Nome))
                {
                    erros.Add($"Toda faixa do escopo {dto.Nome} deve possuir codigo de campo e nome.");
                    continue;
                }
                if (faixa.CodigoCampo.Length > 50 || faixa.Nome.Length > 150 || faixa.Unidade?.Length > 50)
                    erros.Add($"A faixa {faixa.Nome} excede o tamanho maximo permitido.");
            }

            if (dto.Referencias is null)
            {
                erros.Add($"A lista de referencias do escopo {dto.Nome} nao pode ser nula.");
                continue;
            }
            foreach (SistemaItemReferenciaDto referencia in dto.Referencias)
            {
                if (string.IsNullOrWhiteSpace(referencia.Codigo) || string.IsNullOrWhiteSpace(referencia.Nome))
                {
                    erros.Add($"Toda referencia do escopo {dto.Nome} deve possuir codigo e nome.");
                    continue;
                }
                if (!Enum.IsDefined(referencia.Tipo))
                    erros.Add($"A referencia {referencia.Nome ?? "sem nome"} possui tipo invalido.");
                if ((!string.IsNullOrWhiteSpace(referencia.Codigo) && referencia.Codigo.Length > 50) ||
                    (!string.IsNullOrWhiteSpace(referencia.Nome) && referencia.Nome.Length > 150) ||
                    referencia.Valor?.Length > 250)
                    erros.Add($"A referencia {referencia.Nome ?? "sem nome"} excede o tamanho maximo permitido.");
            }

            if (dto.Filhos is null)
            {
                erros.Add($"A lista de filhos do escopo {dto.Nome} nao pode ser nula.");
                continue;
            }
            ValidarEstruturaCatalogo(dto.Filhos, caminho, erros);
        }
    }

    private static void ValidarEscopo(
        SistemaItemEscopoDto dto,
        SistemaItemEscopoNivel nivelEsperado,
        string? caminhoPai,
        HashSet<string> camposHerdados,
        HashSet<string> caminhos,
        ICollection<string> erros)
    {
        if (dto.Nivel != nivelEsperado)
            erros.Add($"O escopo {dto.Nome ?? "sem nome"} deve estar no nível {nivelEsperado}.");
        if (string.IsNullOrWhiteSpace(dto.Codigo) || string.IsNullOrWhiteSpace(dto.Nome))
        {
            erros.Add("Todo tipo, categoria e arquétipo de item deve possuir código e nome.");
            return;
        }
        if (dto.Codigo.Length > 50 || dto.Nome.Length > 150)
            erros.Add($"O escopo {dto.Nome} excede o tamanho máximo de código ou nome.");
        if (dto.Ordem < 0)
            erros.Add($"A ordem do escopo {dto.Nome} não pode ser negativa.");

        string codigo = SistemaRpgConfiguration.NormalizarCodigo(dto.Codigo, dto.Nome);
        string caminho = string.IsNullOrWhiteSpace(caminhoPai) ? codigo : $"{caminhoPai}/{codigo}";
        if (!caminhos.Add(caminho))
            erros.Add($"O caminho de item {caminho} está duplicado.");

        HashSet<string> campos = new(camposHerdados, StringComparer.OrdinalIgnoreCase);
        HashSet<string> camposLocais = new(StringComparer.OrdinalIgnoreCase);
        foreach (SistemaItemCampoDto campo in dto.Campos)
        {
            if (string.IsNullOrWhiteSpace(campo.Codigo) || string.IsNullOrWhiteSpace(campo.Nome))
                erros.Add($"Todo campo do escopo {dto.Nome} deve possuir código e nome.");
            string codigoCampo = SistemaRpgConfiguration.NormalizarCodigo(campo.Codigo, campo.Nome);
            if (!camposLocais.Add(codigoCampo))
                erros.Add($"O campo {codigoCampo} está duplicado no escopo {dto.Nome}.");
            campos.Add(codigoCampo);
            if (campo.Ordem < 0)
                erros.Add($"A ordem do campo {campo.Nome} não pode ser negativa.");
        }

        HashSet<string> faixas = new(StringComparer.OrdinalIgnoreCase);
        foreach (SistemaItemFaixaDto faixa in dto.Faixas)
        {
            string codigoCampo = SistemaRpgConfiguration.NormalizarCodigo(faixa.CodigoCampo, faixa.Nome);
            if (!faixas.Add(codigoCampo))
                erros.Add($"A faixa do campo {codigoCampo} está duplicada no escopo {dto.Nome}.");
            if (!campos.Contains(codigoCampo))
                erros.Add($"A faixa {faixa.Nome} referencia o campo inexistente {codigoCampo}.");
            if (faixa.ValorMinimo.HasValue && faixa.ValorMaximo.HasValue &&
                faixa.ValorMinimo > faixa.ValorMaximo)
                erros.Add($"A faixa {faixa.Nome} possui mínimo maior que o máximo.");
            if (faixa.ValorReferencia.HasValue &&
                ((faixa.ValorMinimo.HasValue && faixa.ValorReferencia < faixa.ValorMinimo) ||
                 (faixa.ValorMaximo.HasValue && faixa.ValorReferencia > faixa.ValorMaximo)))
                erros.Add($"A referência de {faixa.Nome} deve ficar dentro da faixa conhecida.");
        }

        if (dto.Referencias
            .GroupBy(item => $"{item.Tipo}:{SistemaRpgConfiguration.NormalizarCodigo(item.Codigo, item.Nome)}")
            .Any(group => group.Count() > 1))
            erros.Add($"Há referências duplicadas no escopo {dto.Nome}.");
        if (dto.Referencias.Any(item => string.IsNullOrWhiteSpace(item.Codigo) || string.IsNullOrWhiteSpace(item.Nome)))
            erros.Add($"Toda referência do escopo {dto.Nome} deve possuir código e nome.");

        SistemaItemEscopoNivel? nivelFilho = nivelEsperado switch
        {
            SistemaItemEscopoNivel.Tipo => SistemaItemEscopoNivel.Categoria,
            SistemaItemEscopoNivel.Categoria => SistemaItemEscopoNivel.Arquetipo,
            _ => null,
        };
        if (!nivelFilho.HasValue && dto.Filhos.Count > 0)
        {
            erros.Add($"O arquétipo {dto.Nome} não pode possuir outro nível de escopo.");
            return;
        }

        foreach (SistemaItemEscopoDto filho in dto.Filhos)
            ValidarEscopo(filho, nivelFilho!.Value, caminho, campos, caminhos, erros);
    }

    private static string? Limpar(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static SistemaOperacaoResultado<SistemaItensConfigDto> NaoEncontrado(string mensagem) =>
        SistemaOperacaoResultado<SistemaItensConfigDto>.Falha(mensagem, SistemaOperacaoErro.NaoEncontrado);
}
