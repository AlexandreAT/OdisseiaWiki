using System.Text.Json;
using System.Globalization;
using System.Text;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgResolver
{
    private static readonly JsonSerializerOptions RuntimeJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public Task<SistemaRuntimeContextoDto> ResolverContextoAsync(SistemaRuntimeConsultaDto consulta) =>
        ResolverContextoCoreAsync(consulta, vinculoProposto: null);

    public Task<SistemaRuntimeContextoDto> ResolverContextoAsync(
        SistemaRuntimeConsultaDto consulta,
        SistemaEntidadeGlobalVinculoSnapshot vinculoProposto)
    {
        ArgumentNullException.ThrowIfNull(vinculoProposto);
        return ResolverContextoCoreAsync(consulta, vinculoProposto);
    }

    private async Task<SistemaRuntimeContextoDto> ResolverContextoCoreAsync(
        SistemaRuntimeConsultaDto consulta,
        SistemaEntidadeGlobalVinculoSnapshot? vinculoProposto)
    {
        ArgumentNullException.ThrowIfNull(consulta);

        if (vinculoProposto is not null &&
            (consulta.TipoEntidade != vinculoProposto.TipoEntidade ||
             !string.Equals(consulta.IdEntidade?.Trim(), vinculoProposto.IdEntidade, StringComparison.Ordinal)))
        {
            throw new ArgumentException(
                "O vínculo proposto precisa identificar a mesma entidade da consulta.",
                nameof(vinculoProposto));
        }

        SistemaRuntimeContextoDto contexto = new() { IdMesa = consulta.IdMesa };
        SistemaVersao? versao = null;

        if (consulta.IdPersonagemJogador.HasValue)
            versao = await ResolverVersaoPersonagemJogadorAsync(
                consulta.IdPersonagemJogador.Value,
                contexto);

        if (versao is null && consulta.IdMesa.HasValue)
            versao = await ResolverVersaoMesaAsync(consulta.IdMesa.Value, contexto);

        if (versao is null && consulta.TipoEntidade.HasValue && !string.IsNullOrWhiteSpace(consulta.IdEntidade))
        {
            versao = await ResolverVersaoEntidadeAsync(
                consulta.TipoEntidade.Value,
                consulta.IdEntidade.Trim(),
                contexto,
                vinculoProposto);
        }

        if (versao is null)
            versao = await ResolverSistemaPadraoAsync(contexto, preservarVersaoLegada: consulta.IdMesa.HasValue);

        if (versao is null)
        {
            AdicionarFallback(contexto, "sistema", "Nenhuma versão publicada válida pôde ser resolvida.");
            return contexto;
        }

        PreencherContextoVersionado(contexto, versao);
        await ResolverRacaAsync(contexto, consulta);
        await ResolverEValidarValoresExplicitosAsync(contexto, consulta, vinculoProposto);
        return contexto;
    }

    private async Task<SistemaVersao?> ResolverVersaoPersonagemJogadorAsync(
        int idPersonagemJogador,
        SistemaRuntimeContextoDto contexto)
    {
        PersonagemJogador? personagem = await _repository.GetPlayerCharacterAsync(idPersonagemJogador);
        contexto.IdPersonagemJogador = idPersonagemJogador;

        if (personagem is null)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.EntidadeNaoEncontrada,
                "O personagem de jogador informado não foi encontrado.",
                "personagemJogador");
            return null;
        }

        contexto.IdMesa = personagem.Idmesa;
        SistemaVersao? versaoDisponivel = await ResolverVersaoAtualDaMesaAsync(personagem.Mesa);
        SistemaVersao? versaoFixada = personagem.IdSistemaVersao.HasValue
            ? await _repository.GetVersionAsync(
                personagem.IdSistemaVersao.Value,
                includeConfiguration: true)
            : null;

        if (versaoFixada is null || versaoFixada.Status == SistemaVersaoStatus.Rascunho)
        {
            if (personagem.IdSistemaVersao.HasValue)
            {
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.PublicacaoAtualIndisponivel,
                    "A versão fixada na ficha não está disponível; foi usada a versão atual da Mesa.",
                    "personagemJogador.idSistemaVersao");
            }
            else
            {
                AdicionarFallback(
                    contexto,
                    "personagemJogador.idSistemaVersao",
                    "Esta ficha antiga ainda não possui uma versão própria; foi usada a versão atual da Mesa.");
            }

            versaoFixada = versaoDisponivel;
        }

        if (versaoFixada is null)
            return null;

        contexto.Origem = SistemaRuntimeOrigem.VersaoFixadaPersonagemJogador;
        contexto.AcompanhaPublicacaoAtual = false;
        contexto.IdVersaoFixada = versaoFixada.IdSistemaVersao;

        if (versaoDisponivel is not null &&
            versaoDisponivel.IdSistemaVersao != versaoFixada.IdSistemaVersao)
        {
            contexto.AtualizacaoDisponivel = true;
            contexto.IdVersaoDisponivel = versaoDisponivel.IdSistemaVersao;
            contexto.NumeroVersaoDisponivel = versaoDisponivel.NumeroVersao;
        }

        return versaoFixada;
    }

    private async Task<SistemaVersao?> ResolverVersaoAtualDaMesaAsync(Mesa mesa)
    {
        if (MesaAcompanhaPublicacaoPadrao(mesa))
        {
            SistemaRpg? sistemaPadrao = await _repository.GetByCodeAsync(
                SistemaRpgConfiguration.CodigoPadrao);
            if (sistemaPadrao is { Ativo: true, IdVersaoPublicada: not null })
            {
                SistemaVersao? publicada = await _repository.GetVersionAsync(
                    sistemaPadrao.IdVersaoPublicada.Value,
                    includeConfiguration: true);
                if (publicada is { Status: SistemaVersaoStatus.Publicado })
                    return publicada;
            }
        }

        if (!mesa.IdSistemaVersao.HasValue)
            return null;

        SistemaVersao? versaoMesa = await _repository.GetVersionAsync(
            mesa.IdSistemaVersao.Value,
            includeConfiguration: true);
        return versaoMesa is { Status: not SistemaVersaoStatus.Rascunho }
            ? versaoMesa
            : null;
    }

    private async Task<SistemaVersao?> ResolverVersaoMesaAsync(
        int idMesa,
        SistemaRuntimeContextoDto contexto)
    {
        Mesa? mesa = await _repository.GetMesaAsync(idMesa);
        if (mesa is null)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.MesaNaoEncontrada,
                "A mesa informada não foi encontrada; será utilizado o sistema padrão.",
                "mesa");
            return null;
        }

        if (MesaAcompanhaPublicacaoPadrao(mesa))
        {
            SistemaRpg? sistemaPadrao = await _repository.GetByCodeAsync(
                SistemaRpgConfiguration.CodigoPadrao);
            if (sistemaPadrao is { Ativo: true, IdVersaoPublicada: not null })
            {
                SistemaVersao? publicacaoAtual = await _repository.GetVersionAsync(
                    sistemaPadrao.IdVersaoPublicada.Value,
                    includeConfiguration: true);
                if (publicacaoAtual is { Status: SistemaVersaoStatus.Publicado })
                {
                    contexto.Origem = SistemaRuntimeOrigem.Mesa;
                    contexto.AcompanhaPublicacaoAtual = true;
                    contexto.IdVersaoFixada = null;
                    return publicacaoAtual;
                }
            }

            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.PublicacaoAtualIndisponivel,
                "A publicação atual do Sistema ODISSEIA não está disponível; será preservada a última versão válida da Mesa Padrão.",
                "mesa.idSistemaVersao");
        }

        if (!mesa.IdSistemaVersao.HasValue)
            return null;

        SistemaVersao? versao = await _repository.GetVersionAsync(
            mesa.IdSistemaVersao.Value,
            includeConfiguration: true);
        if (versao is null)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.PublicacaoAtualIndisponivel,
                "A versão vinculada à mesa não está disponível; será utilizado o fallback compatível.",
                "mesa.idSistemaVersao");
            return null;
        }

        if (versao.Status == SistemaVersaoStatus.Rascunho)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.VersaoRascunhoIgnorada,
                "Uma versão em rascunho nunca pode alimentar o runtime da mesa.",
                "mesa.idSistemaVersao");
            return null;
        }

        contexto.Origem = SistemaRuntimeOrigem.Mesa;
        contexto.AcompanhaPublicacaoAtual = false;
        contexto.IdVersaoFixada = versao.IdSistemaVersao;
        return versao;
    }

    private async Task<SistemaVersao?> ResolverVersaoEntidadeAsync(
        SistemaEntidadeGlobalTipo tipoEntidade,
        string idEntidade,
        SistemaRuntimeContextoDto contexto,
        SistemaEntidadeGlobalVinculoSnapshot? vinculoProposto = null)
    {
        SistemaEntidadeGlobalVinculoSnapshot? vinculo = vinculoProposto ?? await _repository
            .GetGlobalEntityBindingAsync(tipoEntidade, idEntidade);
        if (vinculo is null)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.EntidadeNaoEncontrada,
                "A entidade global informada não foi encontrada; será utilizado o sistema padrão.",
                "entidade");
            return null;
        }

        contexto.Entidade = new SistemaRuntimeVinculoEntidadeDto
        {
            TipoEntidade = vinculo.TipoEntidade,
            IdEntidade = vinculo.IdEntidade,
            IdSistemaRpg = vinculo.IdSistemaRpg,
            IdSistemaVersao = vinculo.IdSistemaVersao,
            AcompanharPublicacaoAtual = vinculo.AcompanharPublicacaoAtual,
        };

        // Ausência de IDs é o estado compatível de entidades antigas: ODISSEIA/publicação atual.
        if (!vinculo.IdSistemaRpg.HasValue && !vinculo.IdSistemaVersao.HasValue)
            return null;

        if (vinculo.AcompanharPublicacaoAtual)
        {
            if (!vinculo.IdSistemaRpg.HasValue)
            {
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.VinculoInconsistente,
                    "O vínculo acompanha publicações, mas não informa o sistema.",
                    "entidade.idSistemaRpg");
                return null;
            }

            SistemaRpg? sistema = await _repository.GetByIdAsync(vinculo.IdSistemaRpg.Value);
            if (sistema is null)
            {
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.SistemaNaoEncontrado,
                    "O sistema vinculado à entidade não foi encontrado.",
                    "entidade.idSistemaRpg");
                return null;
            }

            if (sistema.VersaoPublicada is null)
            {
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.PublicacaoAtualIndisponivel,
                    "O sistema vinculado ainda não possui uma publicação atual.",
                    "entidade.idSistemaRpg");
                return null;
            }

            SistemaVersao? publicada = await _repository.GetVersionAsync(
                sistema.VersaoPublicada.IdSistemaVersao,
                includeConfiguration: true);
            if (publicada is not { Status: SistemaVersaoStatus.Publicado })
            {
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.PublicacaoAtualIndisponivel,
                    "A publicação atual do sistema vinculado não é válida para o runtime.",
                    "entidade.idSistemaRpg");
                return null;
            }

            contexto.Origem = SistemaRuntimeOrigem.PublicacaoAtualEntidade;
            contexto.AcompanhaPublicacaoAtual = true;
            return publicada;
        }

        if (!vinculo.IdSistemaRpg.HasValue || !vinculo.IdSistemaVersao.HasValue)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.VinculoInconsistente,
                "Uma entidade que não acompanha publicações deve possuir sistema e versão fixada.",
                "entidade");
            return null;
        }

        SistemaVersao? fixa = await _repository.GetVersionAsync(
            vinculo.IdSistemaVersao.Value,
            includeConfiguration: true);
        if (fixa is null || fixa.IdSistemaRpg != vinculo.IdSistemaRpg.Value)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.VinculoInconsistente,
                "A versão fixada não pertence ao sistema vinculado ou não existe.",
                "entidade.idSistemaVersao");
            return null;
        }

        if (fixa.Status == SistemaVersaoStatus.Rascunho)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.VersaoRascunhoIgnorada,
                "Uma versão em rascunho não pode ser fixada para gameplay normal.",
                "entidade.idSistemaVersao");
            return null;
        }

        contexto.Origem = SistemaRuntimeOrigem.VersaoFixadaEntidade;
        contexto.AcompanhaPublicacaoAtual = false;
        contexto.IdVersaoFixada = fixa.IdSistemaVersao;
        return fixa;
    }

    private async Task<SistemaVersao?> ResolverSistemaPadraoAsync(
        SistemaRuntimeContextoDto contexto,
        bool preservarVersaoLegada)
    {
        SistemaRpg? sistema = await _repository.GetByCodeAsync(SistemaRpgConfiguration.CodigoPadrao);
        if (sistema is not { Ativo: true })
            return null;

        SistemaVersao? versao;
        if (preservarVersaoLegada)
        {
            SistemaVersao? baseLegada = await _repository.GetVersionByNumberAsync(
                sistema.IdSistemaRpg,
                SistemaRpgConfiguration.VersaoPadrao);
            versao = baseLegada is { Status: not SistemaVersaoStatus.Rascunho }
                ? await _repository.GetVersionAsync(baseLegada.IdSistemaVersao, includeConfiguration: true)
                : null;
        }
        else
        {
            versao = sistema.VersaoPublicada is null
                ? null
                : await _repository.GetVersionAsync(
                    sistema.VersaoPublicada.IdSistemaVersao,
                    includeConfiguration: true);
        }

        if (versao is null || versao.Status == SistemaVersaoStatus.Rascunho)
            return null;

        contexto.Origem = SistemaRuntimeOrigem.SistemaPadrao;
        contexto.AcompanhaPublicacaoAtual = !preservarVersaoLegada;
        contexto.IdVersaoFixada = preservarVersaoLegada ? versao.IdSistemaVersao : null;
        return versao;
    }

    private static void PreencherContextoVersionado(
        SistemaRuntimeContextoDto contexto,
        SistemaVersao versao)
    {
        contexto.IdSistemaRpg = versao.IdSistemaRpg;
        contexto.IdSistemaVersao = versao.IdSistemaVersao;
        contexto.CodigoSistema = versao.SistemaRpg.Codigo;
        contexto.NomeSistema = versao.SistemaRpg.Nome;
        contexto.NumeroVersao = versao.NumeroVersao;
        contexto.StatusVersao = versao.Status;
        contexto.UsaFallbackLegado = false;
        contexto.ConfiguracaoGeral = SistemaRpgMapper.ToGeral(versao);
        contexto.Criacao = SistemaRpgMapper.ToCriacao(versao);
        contexto.Progressao = SistemaRpgMapper.ToProgressao(versao);
        contexto.Exploracao = SistemaRpgMapper.ToExploracao(versao);
        contexto.Combate = SistemaRpgMapper.ToCombate(versao);
        contexto.Poderes = SistemaRpgMapper.ToPoderes(versao);
        contexto.Sobrevivencia = SistemaRpgMapper.ToSobrevivencia(versao);
        contexto.Itens = SistemaRpgMapper.ToItens(versao);

        foreach (string caminho in new[]
        {
            "configuracaoGeral",
            "criacao",
            "progressao",
            "exploracao",
            "combate",
            "poderes",
            "sobrevivencia",
            "itens",
        })
        {
            contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
            {
                Caminho = caminho,
                Origem = SistemaValorProveniencia.Sistema,
                Detalhe = $"{versao.SistemaRpg.Codigo}/{versao.NumeroVersao}",
            });
        }
    }

    private async Task ResolverRacaAsync(
        SistemaRuntimeContextoDto contexto,
        SistemaRuntimeConsultaDto consulta)
    {
        int? idRaca = consulta.IdRaca;
        if (!idRaca.HasValue && consulta.TipoEntidade == SistemaEntidadeGlobalTipo.Raca)
            idRaca = int.TryParse(consulta.IdEntidade, out int idEntidadeRaca) ? idEntidadeRaca : null;

        if (!idRaca.HasValue)
            return;

        bool sistemaPadrao = string.Equals(
            contexto.CodigoSistema,
            SistemaRpgConfiguration.CodigoPadrao,
            StringComparison.OrdinalIgnoreCase);

        if (sistemaPadrao)
        {
            Raca? racaWiki = await _repository.GetRaceRuntimeAsync(idRaca.Value);
            if (racaWiki is not null)
            {
                contexto.ConfiguracaoRacial = SistemaRpgMapper.FromWikiRace(racaWiki);
                AdicionarProvenienciaRacial(
                    contexto,
                    SistemaValorProveniencia.ValorExplicitoEntidade);
            }
            else
            {
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.EntidadeNaoEncontrada,
                    "A raça informada não foi encontrada na Wiki.",
                    "configuracaoRacial");
            }
        }
        else
        {
            SistemaRacaConfigDto? configuracao = contexto.Criacao?.Racas
                .FirstOrDefault(raca => raca.IdRaca == idRaca.Value);
            if (configuracao is not null)
            {
                contexto.ConfiguracaoRacial = configuracao;
                AdicionarProvenienciaRacial(contexto, SistemaValorProveniencia.Sistema);
            }
            else
            {
                Raca? racaCompatibilidade = await _repository.GetRaceRuntimeAsync(idRaca.Value);
                contexto.ConfiguracaoRacial = racaCompatibilidade is null
                    ? null
                    : SistemaRpgMapper.FromWikiRace(racaCompatibilidade);
                AdicionarWarning(
                    contexto,
                    SistemaRuntimeWarningCodigo.ConfiguracaoRacialAusente,
                    "A versão efetiva não possui configuração mecânica para esta raça.",
                    "configuracaoRacial");

                if (contexto.ConfiguracaoRacial is not null)
                {
                    AdicionarFallback(
                        contexto,
                        "configuracaoRacial",
                        "Os valores da raça foram usados apenas para compatibilidade com este Sistema.");
                    AdicionarProvenienciaRacial(contexto, SistemaValorProveniencia.FallbackLegado);
                }
            }
        }

        if (contexto.ConfiguracaoRacial is null || !consulta.IdMesa.HasValue)
            return;

        MesaEntidadeConfig? overrideMesa = await _repository.GetMesaEntityConfigAsync(
            consulta.IdMesa.Value,
            MesaEntidadeTipo.Raca,
            idRaca.Value.ToString());
        if (overrideMesa is null)
            return;

        if (!TryLerOverrideRacial(overrideMesa.ConfigJson, out SistemaRacaRuntimeOverrideDto? delta))
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.OverrideMesaInvalido,
                "O override racial da mesa não possui um schema reconhecido e foi ignorado.",
                "configuracaoRacial");
            return;
        }

        AplicarOverrideRacial(contexto, delta!);
    }

    private static bool TryLerOverrideRacial(
        string json,
        out SistemaRacaRuntimeOverrideDto? overrideRacial)
    {
        overrideRacial = null;
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
                return false;

            JsonElement root = document.RootElement;
            JsonElement statusRoot = root;
            if (TryGetProperty(root, "statusJson", out JsonElement statusJson))
                statusRoot = statusJson;
            if (TryGetProperty(statusRoot, "status", out JsonElement status))
                statusRoot = status;

            SistemaRacaRuntimeOverrideDto delta = new()
            {
                VidaBase = LerInteiro(root, "vidaBase") ??
                    LerInteiro(statusRoot, "vidaMaxima") ??
                    LerInteiro(statusRoot, "vida"),
                EstaminaBase = LerInteiro(root, "estaminaBase") ??
                    LerInteiro(statusRoot, "estaminaMaxima") ??
                    LerInteiro(statusRoot, "estamina"),
                ManaBase = LerInteiro(root, "manaBase") ??
                    LerInteiro(statusRoot, "manaMaxima") ??
                    LerInteiro(statusRoot, "mana"),
                CapacidadeCargaBase = LerInteiro(root, "capacidadeCargaBase") ??
                    LerInteiro(statusRoot, "capacidadeCarga"),
                CodigoAtributoInicial = LerTexto(root, "codigoAtributoInicial") ??
                    LerTexto(root, "atributoInicial") ??
                    LerTexto(statusJson.ValueKind == JsonValueKind.Object ? statusJson : root, "atributoInicial"),
            };

            if (new[] { delta.VidaBase, delta.EstaminaBase, delta.ManaBase, delta.CapacidadeCargaBase }
                .Any(value => value < 0))
                return false;

            bool possuiValor = delta.VidaBase.HasValue ||
                delta.EstaminaBase.HasValue ||
                delta.ManaBase.HasValue ||
                delta.CapacidadeCargaBase.HasValue ||
                !string.IsNullOrWhiteSpace(delta.CodigoAtributoInicial);
            overrideRacial = possuiValor ? delta : null;
            return possuiValor;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static void AplicarOverrideRacial(
        SistemaRuntimeContextoDto contexto,
        SistemaRacaRuntimeOverrideDto delta)
    {
        SistemaRacaConfigDto raca = contexto.ConfiguracaoRacial!;
        Aplicar(delta.VidaBase, value => raca.VidaBase = value, "configuracaoRacial.vidaBase");
        Aplicar(delta.EstaminaBase, value => raca.EstaminaBase = value, "configuracaoRacial.estaminaBase");
        Aplicar(delta.ManaBase, value => raca.ManaBase = value, "configuracaoRacial.manaBase");
        Aplicar(
            delta.CapacidadeCargaBase,
            value => raca.CapacidadeCargaBase = value,
            "configuracaoRacial.capacidadeCargaBase");

        if (!string.IsNullOrWhiteSpace(delta.CodigoAtributoInicial))
        {
            raca.CodigoAtributoInicial = delta.CodigoAtributoInicial.Trim();
            contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
            {
                Caminho = "configuracaoRacial.codigoAtributoInicial",
                Origem = SistemaValorProveniencia.OverrideMesa,
            });
        }

        void Aplicar(int? valor, Action<int> atribuir, string caminho)
        {
            if (!valor.HasValue)
                return;
            atribuir(valor.Value);
            contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
            {
                Caminho = caminho,
                Origem = SistemaValorProveniencia.OverrideMesa,
            });
        }
    }

    private static void AdicionarProvenienciaRacial(
        SistemaRuntimeContextoDto contexto,
        SistemaValorProveniencia origem)
    {
        foreach (string campo in new[]
        {
            "vidaBase",
            "estaminaBase",
            "manaBase",
            "capacidadeCargaBase",
            "codigoAtributoInicial",
            "passivasVinculadas",
        })
        {
            contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
            {
                Caminho = $"configuracaoRacial.{campo}",
                Origem = origem,
            });
        }
    }

    private static void ResolverItem(
        SistemaRuntimeContextoDto contexto,
        SistemaRuntimeConsultaDto consulta)
    {
        bool contextoItem = consulta.TipoEntidade == SistemaEntidadeGlobalTipo.Item ||
            !string.IsNullOrWhiteSpace(consulta.CodigoTipoItem) ||
            !string.IsNullOrWhiteSpace(consulta.CodigoCategoriaItem) ||
            !string.IsNullOrWhiteSpace(consulta.CodigoArquetipoItem);
        if (!contextoItem)
            return;

        if (contexto.Itens.Tipos.Count == 0)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.CatalogoItemAusente,
                "A versão efetiva ainda não possui referências gerais de itens.",
                "itens");
            AdicionarFallback(
                contexto,
                "itens",
                "O consumidor deve preservar as constantes legadas até existir uma referência versionada.");
            return;
        }

        if (string.IsNullOrWhiteSpace(consulta.CodigoTipoItem))
            return;

        List<SistemaItemEscopoDto> caminho = new();
        SistemaItemEscopoDto? tipo = Encontrar(
            contexto.Itens.Tipos,
            consulta.CodigoTipoItem,
            SistemaItemEscopoNivel.Tipo);
        if (tipo is null)
        {
            EscopoAusente("tipo", consulta.CodigoTipoItem!);
            return;
        }
        caminho.Add(tipo);

        SistemaItemEscopoDto? categoria = null;
        if (!string.IsNullOrWhiteSpace(consulta.CodigoCategoriaItem))
        {
            categoria = Encontrar(tipo.Filhos, consulta.CodigoCategoriaItem, SistemaItemEscopoNivel.Categoria);
            if (categoria is null)
            {
                EscopoAusente("categoria", consulta.CodigoCategoriaItem!);
                contexto.ReferenciaItem = CriarReferencia(caminho, consulta, completa: false);
                return;
            }
            caminho.Add(categoria);
        }

        if (!string.IsNullOrWhiteSpace(consulta.CodigoArquetipoItem))
        {
            List<SistemaItemEscopoDto>? caminhoArquetipo = categoria is null
                ? EncontrarCaminho(
                    tipo.Filhos,
                    consulta.CodigoArquetipoItem,
                    SistemaItemEscopoNivel.Arquetipo)
                : EncontrarCaminho(
                    categoria.Filhos,
                    consulta.CodigoArquetipoItem,
                    SistemaItemEscopoNivel.Arquetipo);
            SistemaItemEscopoDto? arquetipo = caminhoArquetipo?.LastOrDefault();
            if (arquetipo is null)
            {
                EscopoAusente("arquétipo", consulta.CodigoArquetipoItem!);
                contexto.ReferenciaItem = CriarReferencia(caminho, consulta, completa: false);
                return;
            }
            foreach (SistemaItemEscopoDto escopo in caminhoArquetipo!)
            {
                if (caminho.All(item => item.IdSistemaItemEscopo != escopo.IdSistemaItemEscopo))
                    caminho.Add(escopo);
            }
        }

        contexto.ReferenciaItem = CriarReferencia(caminho, consulta, completa: true);

        void EscopoAusente(string nivel, string codigo)
        {
            AdicionarWarning(
                contexto,
                SistemaRuntimeWarningCodigo.EscopoItemNaoEncontrado,
                $"A referência de {nivel} '{codigo}' não existe na versão efetiva.",
                "referenciaItem");
            AdicionarFallback(
                contexto,
                "referenciaItem",
                "O item mantém seus valores explícitos e o consumidor pode usar a referência legada.");
        }
    }

    private static SistemaItemEscopoDto? Encontrar(
        IEnumerable<SistemaItemEscopoDto> escopos,
        string? codigo,
        SistemaItemEscopoNivel nivel) =>
        escopos.FirstOrDefault(escopo =>
            escopo.Nivel == nivel &&
            string.Equals(escopo.Codigo, codigo?.Trim(), StringComparison.OrdinalIgnoreCase));

    private static List<SistemaItemEscopoDto>? EncontrarCaminho(
        IEnumerable<SistemaItemEscopoDto> escopos,
        string? codigo,
        SistemaItemEscopoNivel nivel)
    {
        foreach (SistemaItemEscopoDto escopo in escopos)
        {
            if (escopo.Nivel == nivel &&
                string.Equals(escopo.Codigo, codigo?.Trim(), StringComparison.OrdinalIgnoreCase))
                return new List<SistemaItemEscopoDto> { escopo };

            List<SistemaItemEscopoDto>? descendente = EncontrarCaminho(escopo.Filhos, codigo, nivel);
            if (descendente is not null)
            {
                descendente.Insert(0, escopo);
                return descendente;
            }
        }

        return null;
    }

    private static SistemaItemReferenciaEfetivaDto CriarReferencia(
        IReadOnlyList<SistemaItemEscopoDto> caminho,
        SistemaRuntimeConsultaDto consulta,
        bool completa)
    {
        Dictionary<string, SistemaItemCampoDto> campos = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, SistemaItemFaixaDto> faixas = new(StringComparer.OrdinalIgnoreCase);
        Dictionary<string, SistemaItemReferenciaDto> referencias = new(StringComparer.OrdinalIgnoreCase);
        foreach (SistemaItemEscopoDto escopo in caminho)
        {
            foreach (SistemaItemCampoDto campo in escopo.Campos)
                campos[campo.Codigo] = campo;
            foreach (SistemaItemFaixaDto faixa in escopo.Faixas)
                faixas[faixa.CodigoCampo] = faixa;
            foreach (SistemaItemReferenciaDto referencia in escopo.Referencias)
                referencias[$"{referencia.Tipo}:{referencia.Codigo}"] = referencia;
        }

        return new SistemaItemReferenciaEfetivaDto
        {
            CodigoTipo = caminho.FirstOrDefault(item => item.Nivel == SistemaItemEscopoNivel.Tipo)?.Codigo
                ?? consulta.CodigoTipoItem?.Trim(),
            CodigoCategoria = caminho.FirstOrDefault(item => item.Nivel == SistemaItemEscopoNivel.Categoria)?.Codigo
                ?? consulta.CodigoCategoriaItem?.Trim(),
            CodigoArquetipo = caminho.FirstOrDefault(item => item.Nivel == SistemaItemEscopoNivel.Arquetipo)?.Codigo
                ?? consulta.CodigoArquetipoItem?.Trim(),
            CodigoCaminho = caminho.LastOrDefault()?.CodigoCaminho,
            Completa = completa,
            Campos = campos.Values.OrderBy(campo => campo.Ordem).ToList(),
            Faixas = faixas.Values.OrderBy(faixa => faixa.Ordem).ToList(),
            Referencias = referencias.Values.OrderBy(referencia => referencia.Ordem).ToList(),
        };
    }

    private async Task ResolverEValidarValoresExplicitosAsync(
        SistemaRuntimeContextoDto contexto,
        SistemaRuntimeConsultaDto consulta,
        SistemaEntidadeGlobalVinculoSnapshot? vinculoProposto = null)
    {
        SistemaEntidadeGlobalVinculoSnapshot? entidade = vinculoProposto;
        if (entidade is null && consulta.TipoEntidade.HasValue && !string.IsNullOrWhiteSpace(consulta.IdEntidade))
        {
            entidade = await _repository.GetGlobalEntityBindingAsync(
                consulta.TipoEntidade.Value,
                consulta.IdEntidade.Trim());
        }

        if (entidade?.TipoEntidade == SistemaEntidadeGlobalTipo.Item)
        {
            InferirEscopoItem(consulta, entidade);
            ResolverItem(contexto, consulta);
            ValidarItemExplicito(contexto, entidade);
            return;
        }

        ResolverItem(contexto, consulta);
        if (entidade?.TipoEntidade == SistemaEntidadeGlobalTipo.Npc)
            ValidarNpcExplicito(contexto, entidade);
    }

    private static void InferirEscopoItem(
        SistemaRuntimeConsultaDto consulta,
        SistemaEntidadeGlobalVinculoSnapshot item)
    {
        consulta.CodigoTipoItem ??= item.TipoItem?.ToString();
        if (!string.IsNullOrWhiteSpace(consulta.CodigoArquetipoItem) ||
            string.IsNullOrWhiteSpace(item.EstadoJson))
            return;

        try
        {
            using JsonDocument document = JsonDocument.Parse(item.EstadoJson);
            consulta.CodigoCategoriaItem ??= LerTexto(document.RootElement, "codigoCategoria") ??
                LerTexto(document.RootElement, "categoria");
            consulta.CodigoArquetipoItem = LerTexto(document.RootElement, "codigoArquetipo") ??
                LerTexto(document.RootElement, "arquetipo") ??
                LerTexto(document.RootElement, "tipoArma") ??
                LerTexto(document.RootElement, "tipoTraje") ??
                LerTexto(document.RootElement, "parteCorpo") ??
                LerTexto(document.RootElement, "subtipo");
        }
        catch (JsonException)
        {
            // JSON legado inválido continua preservado; o catálogo cai no fallback diagnosticável.
        }
    }

    private static void ValidarItemExplicito(
        SistemaRuntimeContextoDto contexto,
        SistemaEntidadeGlobalVinculoSnapshot item)
    {
        if (contexto.ReferenciaItem is null || string.IsNullOrWhiteSpace(item.EstadoJson))
            return;

        List<ValorJson> valores = LerValoresNumericos(item.EstadoJson);
        foreach (SistemaItemFaixaDto faixa in contexto.ReferenciaItem.Faixas)
        {
            string codigoNormalizado = NormalizarCodigo(faixa.CodigoCampo);
            IEnumerable<ValorJson> correspondentes = valores.Where(valor =>
                NormalizarCodigo(valor.Nome) == codigoNormalizado ||
                NormalizarCodigo(valor.Caminho) == codigoNormalizado);
            foreach (ValorJson valor in correspondentes)
            {
                decimal? maximo = faixa.ValorMaximo ?? faixa.ValorReferencia;
                bool abaixo = faixa.ValorMinimo.HasValue && valor.Valor < faixa.ValorMinimo.Value;
                bool acima = maximo.HasValue && valor.Valor > maximo.Value;
                if (!abaixo && !acima)
                    continue;

                contexto.Warnings.Add(new SistemaRuntimeWarningDto
                {
                    Codigo = SistemaRuntimeWarningCodigo.ValorForaReferencia,
                    Caminho = $"entidade.atributosJson.{valor.Caminho}",
                    Mensagem = "O valor explícito do item está fora da referência conhecida do Sistema e foi preservado.",
                    ValorInformado = valor.Valor,
                    ValorMinimoReferencia = faixa.ValorMinimo,
                    ValorMaximoReferencia = maximo,
                    Referencia = faixa.Nome,
                });
                contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
                {
                    Caminho = $"entidade.atributosJson.{valor.Caminho}",
                    Origem = SistemaValorProveniencia.ValorExplicitoEntidade,
                    Detalhe = "Exceção válida preservada; a referência do Sistema não sobrescreve o item.",
                });
            }
        }
    }

    private static void ValidarNpcExplicito(
        SistemaRuntimeContextoDto contexto,
        SistemaEntidadeGlobalVinculoSnapshot npc)
    {
        if (!string.IsNullOrWhiteSpace(npc.EstadoJson))
        {
            List<ValorJson> valores = LerValoresNumericos(npc.EstadoJson);
            ValorJson? nivel = valores.FirstOrDefault(valor =>
                string.Equals(valor.Nome, "nivel", StringComparison.OrdinalIgnoreCase));
            if (nivel is not null &&
                contexto.Progressao is not null &&
                nivel.Valor > contexto.Progressao.NivelMaximo)
            {
                AdicionarWarningReferencia(
                    contexto,
                    "entidade.statusJson.nivel",
                    nivel.Valor,
                    null,
                    contexto.Progressao.NivelMaximo,
                    "Nível máximo do Sistema",
                    "O nível explícito do NPC excede a referência do Sistema e foi preservado.");
            }

            if (contexto.Criacao is not null)
            {
                foreach (SistemaAtributoConfigDto atributo in contexto.Criacao.Atributos)
                {
                    decimal limite = atributo.ValorMaximoAbsoluto ?? atributo.ValorMaximoNatural;
                    foreach (ValorJson valor in valores.Where(valor =>
                        NormalizarCodigo(valor.Nome) == NormalizarCodigo(atributo.Codigo) &&
                        valor.Caminho.Contains("atributos", StringComparison.OrdinalIgnoreCase) &&
                        valor.Valor > limite))
                    {
                        AdicionarWarningReferencia(
                            contexto,
                            $"entidade.statusJson.{valor.Caminho}",
                            valor.Valor,
                            atributo.ValorMinimo,
                            limite,
                            atributo.Nome,
                            "O atributo explícito do NPC excede a referência do Sistema e foi preservado.");
                    }
                }

                foreach (SistemaRecursoConfigDto recurso in contexto.Criacao.Recursos.Where(item => item.ValorMaximo.HasValue))
                {
                    foreach (ValorJson valor in valores.Where(valor =>
                        NormalizarCodigo(valor.Nome).StartsWith(NormalizarCodigo(recurso.Codigo), StringComparison.Ordinal) &&
                        valor.Caminho.Contains("status", StringComparison.OrdinalIgnoreCase) &&
                        valor.Valor > recurso.ValorMaximo!.Value))
                    {
                        AdicionarWarningReferencia(
                            contexto,
                            $"entidade.statusJson.{valor.Caminho}",
                            valor.Valor,
                            recurso.ValorMinimo,
                            recurso.ValorMaximo,
                            recurso.Nome,
                            "O recurso explícito do NPC excede a referência do Sistema e foi preservado.");
                    }
                }
            }
        }

        SistemaSkillConfigDto? limites = contexto.Poderes?.SkillConfig;
        if (limites is null)
            return;

        int? quantidadeSkills = ContarArrayJson(npc.SkillsJson);
        if (quantidadeSkills > limites.MaximoSkills)
        {
            AdicionarWarningReferencia(
                contexto,
                "entidade.skills",
                quantidadeSkills.Value,
                0,
                limites.MaximoSkills,
                "Máximo de skills",
                "O NPC possui mais skills que a referência do Sistema; suas escolhas foram preservadas.");
        }

        int? quantidadeMagias = ContarArrayJson(npc.MagiasJson);
        int limiteMagias = limites.MaximoMagias ?? contexto.Poderes?.LimiteMagias ?? 0;
        if (quantidadeMagias > limiteMagias)
        {
            AdicionarWarningReferencia(
                contexto,
                "entidade.magias",
                quantidadeMagias.Value,
                0,
                limiteMagias,
                "Máximo de magias",
                "O NPC possui mais magias que a referência do Sistema; suas escolhas foram preservadas.");
        }
    }

    private static void AdicionarWarningReferencia(
        SistemaRuntimeContextoDto contexto,
        string caminho,
        decimal valor,
        decimal? minimo,
        decimal? maximo,
        string referencia,
        string mensagem)
    {
        contexto.Warnings.Add(new SistemaRuntimeWarningDto
        {
            Codigo = SistemaRuntimeWarningCodigo.ValorForaReferencia,
            Caminho = caminho,
            Mensagem = mensagem,
            ValorInformado = valor,
            ValorMinimoReferencia = minimo,
            ValorMaximoReferencia = maximo,
            Referencia = referencia,
        });
        contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
        {
            Caminho = caminho,
            Origem = SistemaValorProveniencia.ValorExplicitoEntidade,
            Detalhe = "Valor editável preservado apesar do warning.",
        });
    }

    private static int? ContarArrayJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            return document.RootElement.ValueKind == JsonValueKind.Array
                ? document.RootElement.GetArrayLength()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static List<ValorJson> LerValoresNumericos(string json)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            List<ValorJson> valores = new();
            Visitar(document.RootElement, string.Empty, valores);
            return valores;
        }
        catch (JsonException)
        {
            return new List<ValorJson>();
        }

        static void Visitar(JsonElement element, string caminho, List<ValorJson> valores)
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (JsonProperty property in element.EnumerateObject())
                {
                    string proximo = string.IsNullOrWhiteSpace(caminho)
                        ? property.Name
                        : $"{caminho}.{property.Name}";
                    if (property.Value.ValueKind == JsonValueKind.Number &&
                        property.Value.TryGetDecimal(out decimal numero))
                    {
                        valores.Add(new ValorJson(property.Name, proximo, numero));
                    }
                    else
                    {
                        Visitar(property.Value, proximo, valores);
                    }
                }
            }
            else if (element.ValueKind == JsonValueKind.Array)
            {
                int index = 0;
                foreach (JsonElement item in element.EnumerateArray())
                    Visitar(item, $"{caminho}[{index++}]", valores);
            }
        }
    }

    private static string NormalizarCodigo(string valor)
    {
        string decomposed = valor.Normalize(NormalizationForm.FormD);
        StringBuilder builder = new(decomposed.Length);
        foreach (char character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark ||
                !char.IsLetterOrDigit(character))
                continue;
            builder.Append(char.ToUpperInvariant(character));
        }
        return builder.ToString();
    }

    private sealed record ValorJson(string Nome, string Caminho, decimal Valor);

    private static int? LerInteiro(JsonElement element, string nome)
    {
        if (!TryGetProperty(element, nome, out JsonElement property))
            return null;
        if (property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out int value))
            return value;
        return property.ValueKind == JsonValueKind.String && int.TryParse(property.GetString(), out value)
            ? value
            : null;
    }

    private static string? LerTexto(JsonElement element, string nome) =>
        TryGetProperty(element, nome, out JsonElement property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;

    private static bool TryGetProperty(JsonElement element, string nome, out JsonElement property)
    {
        property = default;
        if (element.ValueKind != JsonValueKind.Object)
            return false;

        foreach (JsonProperty item in element.EnumerateObject())
        {
            if (string.Equals(item.Name, nome, StringComparison.OrdinalIgnoreCase))
            {
                property = item.Value;
                return true;
            }
        }

        return false;
    }

    private static void AdicionarWarning(
        SistemaRuntimeContextoDto contexto,
        SistemaRuntimeWarningCodigo codigo,
        string mensagem,
        string? caminho = null) => contexto.Warnings.Add(new SistemaRuntimeWarningDto
    {
        Codigo = codigo,
        Mensagem = mensagem,
        Caminho = caminho,
    });

    private static void AdicionarFallback(
        SistemaRuntimeContextoDto contexto,
        string caminho,
        string motivo)
    {
        contexto.UsaFallbackLegado = true;
        contexto.Fallbacks.Add(new SistemaRuntimeFallbackDto
        {
            Caminho = caminho,
            Motivo = motivo,
        });
        AdicionarWarning(
            contexto,
            SistemaRuntimeWarningCodigo.FallbackLegadoUtilizado,
            motivo,
            caminho);
        contexto.Proveniencias.Add(new SistemaRuntimeProvenienciaDto
        {
            Caminho = caminho,
            Origem = SistemaValorProveniencia.FallbackLegado,
            Detalhe = motivo,
        });
    }
}
