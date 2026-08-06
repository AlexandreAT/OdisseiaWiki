using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using System.Text.Json;

namespace OdisseiaWiki.Services.Helpers;

internal static class SistemaRpgMapper
{
    private static readonly JsonSerializerOptions RaceJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static SistemaRpgResumoDto ToResumo(SistemaRpg entity, int quantidadeMesas = 0) => new()
    {
        IdSistemaRpg = entity.IdSistemaRpg,
        Codigo = entity.Codigo,
        Nome = entity.Nome,
        Descricao = entity.Descricao,
        Ativo = entity.Ativo,
        IdVersaoPublicada = entity.IdVersaoPublicada,
        NumeroVersaoPublicada = entity.VersaoPublicada?.NumeroVersao,
        QuantidadeVersoes = entity.Versoes.Count,
        QuantidadeMesas = quantidadeMesas,
        DataCriacao = entity.DataCriacao,
        DataAtualizacao = entity.DataAtualizacao,
    };

    public static SistemaVersaoResumoDto ToResumo(SistemaVersao entity, int quantidadeMesas = 0) => new()
    {
        IdSistemaVersao = entity.IdSistemaVersao,
        IdSistemaRpg = entity.IdSistemaRpg,
        NumeroVersao = entity.NumeroVersao,
        Status = entity.Status,
        IdVersaoBase = entity.IdVersaoBase,
        Changelog = entity.Changelog,
        DataCriacao = entity.DataCriacao,
        DataAtualizacao = entity.DataAtualizacao,
        DataPublicacao = entity.DataPublicacao,
        DataArquivamento = entity.DataArquivamento,
        QuantidadeMesas = quantidadeMesas,
    };

    public static SistemaConfiguracaoGeralDto ToGeral(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasGerais>(
            entity, SistemaModuloTipo.RegrasBase);
        return new SistemaConfiguracaoGeralDto
        {
            DadoTesteGeral = regras.DadoTesteGeral,
            UsaVantagem = regras.UsaVantagem,
            UsaDesvantagem = regras.UsaDesvantagem,
            CriticoNatural = regras.CriticoNatural,
            FalhaCriticaNatural = regras.FalhaCriticaNatural,
            RegraArredondamento = regras.RegraArredondamento,
            RegraEspecificaPrevalece = regras.RegraEspecificaPrevalece,
            AutoridadeMestre = regras.AutoridadeMestre,
            ObservacoesRegrasFundamentais = regras.ObservacoesRegrasFundamentais,
            Modulos = entity.Modulos.OrderBy(m => m.Ordem).Select(m => new SistemaModuloDto
            {
                IdSistemaModulo = m.IdSistemaModulo,
                TipoModulo = m.TipoModulo,
                Habilitado = m.Habilitado,
                SchemaVersion = m.SchemaVersion,
                Ordem = m.Ordem,
            }).ToList(),
        };
    }

    public static SistemaCriacaoConfigDto ToCriacao(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCriacao>(
            entity, SistemaModuloTipo.CriacaoPersonagem);
        return new SistemaCriacaoConfigDto
        {
            NivelInicial = regras.NivelInicial,
            PontosIniciais = regras.PontosIniciais,
            PontosAtributoIniciais = regras.PontosAtributoIniciais,
            PontosSkillIniciais = regras.PontosSkillIniciais,
            MaximoSkillsIniciais = regras.MaximoSkillsIniciais,
            MaximoMagiasIniciais = regras.MaximoMagiasIniciais,
            MaximoUltimatesIniciais = regras.MaximoUltimatesIniciais,
            Racas = entity.Racas.OrderBy(r => r.Ordem).Select(ToRaca).ToList(),
            Atributos = entity.Atributos.OrderBy(a => a.Ordem).Select(ToAtributo).ToList(),
            Recursos = entity.Recursos.OrderBy(r => r.Ordem).Select(ToRecurso).ToList(),
        };
    }

    public static SistemaRacaConfigDto FromWikiRace(Raca race, int order = 1)
    {
        RacaStatusDto? status = null;
        if (!string.IsNullOrWhiteSpace(race.StatusJson))
        {
            try
            {
                status = JsonSerializer.Deserialize<RacaStatusDto>(race.StatusJson, RaceJsonOptions);
            }
            catch (JsonException)
            {
                // A entidade continua sendo a fonte oficial. Dados inválidos ficam
                // zerados para serem corrigidos no formulário da própria raça.
            }
        }

        StatusBaseDto resources = status?.status ?? new StatusBaseDto();
        return new SistemaRacaConfigDto
        {
            IdRaca = race.Idraca,
            CodigoRaca = SistemaRpgConfiguration.NormalizarCodigo(null, race.Nome),
            NomeRaca = race.Nome,
            Jogavel = true,
            VidaBase = resources.vidaMaxima > 0 ? resources.vidaMaxima : resources.vida,
            EstaminaBase = resources.estaminaMaxima > 0 ? resources.estaminaMaxima : resources.estamina,
            ManaBase = resources.manaMaxima > 0 ? resources.manaMaxima : resources.mana,
            CapacidadeCargaBase = resources.capacidadeCarga,
            CodigoAtributoInicial = string.IsNullOrWhiteSpace(status?.atributoInicial)
                ? null
                : SistemaRpgConfiguration.NormalizarCodigo(null, status.atributoInicial),
            Passivas = status?.passivas is { Count: > 0 }
                ? string.Join("\n", status.passivas.Select(passiva =>
                    string.IsNullOrWhiteSpace(passiva.Efeito)
                        ? passiva.Nome
                        : $"{passiva.Nome}: {passiva.Efeito}"))
                : null,
            NivelDesbloqueio = 1,
            Ordem = order,
            PassivasVinculadas = status?.passivas?
                .Where(passiva => !string.IsNullOrWhiteSpace(passiva.Nome))
                .Select((passiva, index) => new SistemaRacaPassivaDto
                {
                    CodigoPassiva = SistemaRpgConfiguration.NormalizarCodigo(null, passiva.Nome!),
                    NomeExibicao = passiva.Nome!.Trim(),
                    Ordem = index + 1,
                    NivelDesbloqueio = 1,
                })
                .ToList() ?? new List<SistemaRacaPassivaDto>(),
        };
    }

    public static SistemaProgressaoConfigDto ToProgressao(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasProgressao>(
            entity, SistemaModuloTipo.Progressao);
        return new SistemaProgressaoConfigDto
        {
            NivelMaximo = regras.NivelMaximo,
            PermiteXpExcedente = regras.PermiteXpExcedente,
            Niveis = entity.Niveis.OrderBy(n => n.Ordem).ThenBy(n => n.Nivel).Select(n => new SistemaNivelDto
            {
                IdSistemaNivel = n.IdSistemaNivel,
                Nivel = n.Nivel,
                XpParaProximoNivel = n.XpParaProximoNivel,
                PontosNivel = n.PontosNivel,
                PontosAtributo = n.PontosAtributo,
                PontosSkill = n.PontosSkill,
                PontosUltimate = n.PontosUltimate,
                PermiteNovaMagia = n.PermiteNovaMagia,
                PermiteNovaSkill = n.PermiteNovaSkill,
                Observacao = n.Observacao,
                Ordem = n.Ordem,
            }).ToList(),
            Marcos = entity.MarcosNivel.OrderBy(m => m.Ordem).Select(m => new SistemaMarcoNivelDto
            {
                IdSistemaMarcoNivel = m.IdSistemaMarcoNivel,
                Nivel = m.Nivel,
                Codigo = m.Codigo,
                Nome = m.Nome,
                Descricao = m.Descricao,
                TipoRecompensa = m.TipoRecompensa,
                ConfiguracaoJson = m.ConfiguracaoJson,
                Ordem = m.Ordem,
            }).ToList(),
            FontesExperiencia = entity.FontesExperiencia.OrderBy(f => f.Ordem).Select(f => new SistemaFonteExperienciaDto
            {
                IdSistemaFonteExperiencia = f.IdSistemaFonteExperiencia,
                Codigo = f.Codigo,
                Nome = f.Nome,
                TipoTeste = f.TipoTeste,
                Formula = f.Formula,
                ValorMinimo = f.ValorMinimo,
                ValorMaximo = f.ValorMaximo,
                UsaVantagem = f.UsaVantagem,
                Descricao = f.Descricao,
                ConfiguracaoJson = f.ConfiguracaoJson,
                Ordem = f.Ordem,
            }).ToList(),
        };
    }

    public static SistemaExploracaoConfigDto ToExploracao(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasExploracao>(
            entity, SistemaModuloTipo.Exploracao);
        return new SistemaExploracaoConfigDto
        {
            CargaUsaLimite = regras.CargaUsaLimite,
            PenalidadeExcessoCarga = regras.PenalidadeExcessoCarga,
            FurtividadeObservacoes = regras.FurtividadeObservacoes,
            Movimento = entity.Movimento is null ? null : new SistemaMovimentoConfigDto
            {
                IdSistemaMovimentoConfig = entity.Movimento.IdSistemaMovimentoConfig,
                UsaGrid = entity.Movimento.UsaGrid,
                MetrosPorQuadrado = entity.Movimento.MetrosPorQuadrado,
                MovimentoGratuito = entity.Movimento.MovimentoGratuito,
                CustoEstaminaPorQuadrado = entity.Movimento.CustoEstaminaPorQuadrado,
                MaximoQuadradosTurno = entity.Movimento.MaximoQuadradosTurno,
                PermiteMoverAposAtaque = entity.Movimento.PermiteMoverAposAtaque,
                Observacoes = entity.Movimento.Observacoes,
            },
            PontosAcao = entity.PontosAcao is null ? null : new SistemaPontosAcaoConfigDto
            {
                IdSistemaPontosAcaoConfig = entity.PontosAcao.IdSistemaPontosAcaoConfig,
                Habilitado = entity.PontosAcao.Habilitado,
                PontosPorTurno = entity.PontosAcao.PontosPorTurno,
                SegundosPorPonto = entity.PontosAcao.SegundosPorPonto,
                PermiteAcumular = entity.PontosAcao.PermiteAcumular,
                LimiteAcumulado = entity.PontosAcao.LimiteAcumulado,
            },
            Acoes = entity.Acoes.OrderBy(a => a.Ordem).Select(a => new SistemaAcaoConfigDto
            {
                IdSistemaAcaoConfig = a.IdSistemaAcaoConfig,
                Codigo = a.Codigo,
                Nome = a.Nome,
                Tipo = a.Tipo,
                CustoPontosAcao = a.CustoPontosAcao,
                CustoEstamina = a.CustoEstamina,
                CustoMana = a.CustoMana,
                EncerraTurno = a.EncerraTurno,
                PermiteCombo = a.PermiteCombo,
                ExigeAlvo = a.ExigeAlvo,
                Formula = a.Formula,
                Descricao = a.Descricao,
                Ordem = a.Ordem,
                ConfiguracaoJson = a.ConfiguracaoJson,
            }).ToList(),
        };
    }

    public static SistemaCombateConfigDto ToCombate(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasCombate>(
            entity, SistemaModuloTipo.Combate);
        return new SistemaCombateConfigDto
        {
            UsaIniciativa = regras.UsaIniciativa,
            FormulaIniciativa = regras.FormulaIniciativa,
            SegundosPorTurno = regras.SegundosPorTurno,
            RegraDeclaracaoAcoes = regras.RegraDeclaracaoAcoes,
            ResultadosDado = entity.ResultadosDado.OrderBy(r => r.Ordem).Select(r => new SistemaResultadoDadoDto
            {
                IdSistemaResultadoDado = r.IdSistemaResultadoDado,
                CodigoTeste = r.CodigoTeste,
                NomeTeste = r.NomeTeste,
                Dado = r.Dado,
                QuantidadeDados = r.QuantidadeDados,
                ResultadoMinimo = r.ResultadoMinimo,
                ResultadoMaximo = r.ResultadoMaximo,
                ExigeNatural = r.ExigeNatural,
                CodigoResultado = r.CodigoResultado,
                NomeResultado = r.NomeResultado,
                Descricao = r.Descricao,
                EfeitoJson = r.EfeitoJson,
                Ordem = r.Ordem,
            }).ToList(),
            TiposDano = entity.TiposDano.OrderBy(t => t.Ordem).Select(t => new SistemaTipoDanoDto
            {
                IdSistemaTipoDano = t.IdSistemaTipoDano,
                Codigo = t.Codigo,
                Nome = t.Nome,
                Descricao = t.Descricao,
                IgnoraArmadura = t.IgnoraArmadura,
                IgnoraProtecao = t.IgnoraProtecao,
                IgnoraEscudo = t.IgnoraEscudo,
                Periodico = t.Periodico,
                Area = t.Area,
                ConfiguracaoJson = t.ConfiguracaoJson,
                Ordem = t.Ordem,
            }).ToList(),
            TiposDefesa = entity.TiposDefesa.OrderBy(t => t.Ordem).Select(t => new SistemaTipoDefesaDto
            {
                IdSistemaTipoDefesa = t.IdSistemaTipoDefesa,
                Codigo = t.Codigo,
                Nome = t.Nome,
                Descricao = t.Descricao,
                OrdemAplicacao = t.OrdemAplicacao,
                TipoComportamento = t.TipoComportamento,
                Formula = t.Formula,
                ConfiguracaoJson = t.ConfiguracaoJson,
                Ordem = t.Ordem,
            }).ToList(),
        };
    }

    public static SistemaPoderesConfigDto ToPoderes(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasPoderes>(
            entity, SistemaModuloTipo.Poderes);
        return new SistemaPoderesConfigDto
        {
            LimiteMagias = regras.LimiteMagias,
            PermiteMagiasCompostas = regras.PermiteMagiasCompostas,
            RegraAprendizadoMagia = regras.RegraAprendizadoMagia,
            TiposMagia = entity.TiposMagia.OrderBy(t => t.Ordem).Select(t => new SistemaTipoMagiaDto
            {
                IdSistemaTipoMagia = t.IdSistemaTipoMagia,
                Codigo = t.Codigo,
                Nome = t.Nome,
                Descricao = t.Descricao,
                Cor = t.Cor,
                Afinidade = t.Afinidade,
                CustoBase = t.CustoBase,
                Ordem = t.Ordem,
                ConfiguracaoJson = t.ConfiguracaoJson,
            }).ToList(),
            SkillConfig = entity.SkillConfig is null ? null : new SistemaSkillConfigDto
            {
                IdSistemaSkillConfig = entity.SkillConfig.IdSistemaSkillConfig,
                MaximoSkills = entity.SkillConfig.MaximoSkills,
                NivelMaximoSkill = entity.SkillConfig.NivelMaximoSkill,
                MaximoUltimates = entity.SkillConfig.MaximoUltimates,
                NivelDesbloqueioUltimate = entity.SkillConfig.NivelDesbloqueioUltimate,
                MaximoMagias = entity.SkillConfig.MaximoMagias,
                UsaCooldown = entity.SkillConfig.UsaCooldown,
                PermiteArtesEtericas = entity.SkillConfig.PermiteArtesEtericas,
                Observacoes = entity.SkillConfig.Observacoes,
            },
        };
    }

    public static SistemaSobrevivenciaConfigDto ToSobrevivencia(SistemaVersao entity)
    {
        var regras = SistemaRpgConfiguration.LerRegras<SistemaRpgConfiguration.RegrasSobrevivencia>(
            entity, SistemaModuloTipo.Sobrevivencia);
        return new SistemaSobrevivenciaConfigDto
        {
            RegraLoot = regras.RegraLoot,
            RegraRefeicoes = regras.RegraRefeicoes,
            Condicoes = entity.Condicoes.OrderBy(c => c.Ordem).Select(c => new SistemaCondicaoDto
            {
                IdSistemaCondicao = c.IdSistemaCondicao,
                Codigo = c.Codigo,
                Nome = c.Nome,
                Descricao = c.Descricao,
                Tipo = c.Tipo,
                DuracaoPadrao = c.DuracaoPadrao,
                UnidadeDuracao = c.UnidadeDuracao,
                Empilhavel = c.Empilhavel,
                RemocaoAutomatica = c.RemocaoAutomatica,
                PermiteSobrescrever = c.PermiteSobrescrever,
                ValorPadrao = c.ValorPadrao,
                ConfiguracaoPadraoJson = c.ConfiguracaoPadraoJson,
                Ordem = c.Ordem,
            }).ToList(),
            Descansos = entity.Descansos.OrderBy(d => d.Ordem).Select(d => new SistemaDescansoConfigDto
            {
                IdSistemaDescansoConfig = d.IdSistemaDescansoConfig,
                Tipo = d.Tipo,
                Nome = d.Nome,
                DuracaoMinimaMinutos = d.DuracaoMinimaMinutos,
                DuracaoMaximaMinutos = d.DuracaoMaximaMinutos,
                RecuperacaoVida = d.RecuperacaoVida,
                RecuperacaoMana = d.RecuperacaoMana,
                RecuperacaoEstamina = d.RecuperacaoEstamina,
                TipoRecuperacao = d.TipoRecuperacao,
                ExigeGuarda = d.ExigeGuarda,
                IntervaloTesteGuardaMinutos = d.IntervaloTesteGuardaMinutos,
                PermiteAtividades = d.PermiteAtividades,
                ConfiguracaoJson = d.ConfiguracaoJson,
                Ordem = d.Ordem,
            }).ToList(),
            Morte = entity.Morte is null ? null : new SistemaMorteConfigDto
            {
                IdSistemaMorteConfig = entity.Morte.IdSistemaMorteConfig,
                LimiteBeiraDaMorte = entity.Morte.LimiteBeiraDaMorte,
                QuantidadeTestesCombate = entity.Morte.QuantidadeTestesCombate,
                QuantidadeTestesForaCombate = entity.Morte.QuantidadeTestesForaCombate,
                SucessosNecessarios = entity.Morte.SucessosNecessarios,
                DadoSobrevivencia = entity.Morte.DadoSobrevivencia,
                ResultadoMinimoSucesso = entity.Morte.ResultadoMinimoSucesso,
                LimiteVidaDesmembramento = entity.Morte.LimiteVidaDesmembramento,
                MultiplicadorDanoDesmembramento = entity.Morte.MultiplicadorDanoDesmembramento,
                LimiteVidaInstaKill = entity.Morte.LimiteVidaInstaKill,
                MultiplicadorDanoInstaKill = entity.Morte.MultiplicadorDanoInstaKill,
                PermiteEstabilizacaoManual = entity.Morte.PermiteEstabilizacaoManual,
                Observacoes = entity.Morte.Observacoes,
            },
        };
    }

    public static SistemaItensConfigDto ToItens(SistemaVersao entity, bool incluirInativos = false)
    {
        List<SistemaItemEscopo> escopos = entity.ItemEscopos
            .Where(item => incluirInativos || item.Ativo)
            .OrderBy(item => item.Ordem)
            .ThenBy(item => item.Nome)
            .ToList();
        Dictionary<int, List<SistemaItemEscopo>> porPai = escopos
            .Where(item => item.IdEscopoPai.HasValue)
            .GroupBy(item => item.IdEscopoPai!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());

        return new SistemaItensConfigDto
        {
            Tipos = escopos
                .Where(item => item.Nivel == SistemaItemEscopoNivel.Tipo && item.IdEscopoPai is null)
                .Select(item => ToItemEscopo(item, porPai, new HashSet<int>()))
                .ToList(),
        };
    }

    private static SistemaItemEscopoDto ToItemEscopo(
        SistemaItemEscopo item,
        IReadOnlyDictionary<int, List<SistemaItemEscopo>> porPai,
        HashSet<int> visitados)
    {
        if (!visitados.Add(item.IdSistemaItemEscopo))
            return ToItemEscopoSemFilhos(item);

        SistemaItemEscopoDto dto = ToItemEscopoSemFilhos(item);
        if (porPai.TryGetValue(item.IdSistemaItemEscopo, out List<SistemaItemEscopo>? filhos))
        {
            dto.Filhos = filhos
                .OrderBy(filho => filho.Ordem)
                .ThenBy(filho => filho.Nome)
                .Select(filho => ToItemEscopo(filho, porPai, new HashSet<int>(visitados)))
                .ToList();
        }

        return dto;
    }

    private static SistemaItemEscopoDto ToItemEscopoSemFilhos(SistemaItemEscopo item) => new()
    {
        IdSistemaItemEscopo = item.IdSistemaItemEscopo,
        IdEscopoPai = item.IdEscopoPai,
        Nivel = item.Nivel,
        Codigo = item.Codigo,
        CodigoCaminho = item.CodigoCaminho,
        Nome = item.Nome,
        Descricao = item.Descricao,
        Ordem = item.Ordem,
        Ativo = item.Ativo,
        Campos = item.Campos.OrderBy(campo => campo.Ordem).Select(campo => new SistemaItemCampoDto
        {
            IdSistemaItemCampo = campo.IdSistemaItemCampo,
            Codigo = campo.Codigo,
            Nome = campo.Nome,
            Tipo = campo.Tipo,
            Unidade = campo.Unidade,
            Obrigatorio = campo.Obrigatorio,
            Descricao = campo.Descricao,
            Ordem = campo.Ordem,
            CodigoCaminhoOrigem = item.CodigoCaminho,
        }).ToList(),
        Faixas = item.Faixas.OrderBy(faixa => faixa.Ordem).Select(faixa => new SistemaItemFaixaDto
        {
            IdSistemaItemFaixa = faixa.IdSistemaItemFaixa,
            CodigoCampo = faixa.CodigoCampo,
            Nome = faixa.Nome,
            ValorMinimo = faixa.ValorMinimo,
            ValorMaximo = faixa.ValorMaximo,
            ValorReferencia = faixa.ValorReferencia,
            Unidade = faixa.Unidade,
            Descricao = faixa.Descricao,
            Ordem = faixa.Ordem,
            CodigoCaminhoOrigem = item.CodigoCaminho,
        }).ToList(),
        Referencias = item.Referencias.OrderBy(referencia => referencia.Ordem).Select(referencia => new SistemaItemReferenciaDto
        {
            IdSistemaItemReferencia = referencia.IdSistemaItemReferencia,
            Tipo = referencia.Tipo,
            Codigo = referencia.Codigo,
            Nome = referencia.Nome,
            Valor = referencia.Valor,
            Descricao = referencia.Descricao,
            Ordem = referencia.Ordem,
            CodigoCaminhoOrigem = item.CodigoCaminho,
        }).ToList(),
    };

    private static SistemaRacaConfigDto ToRaca(SistemaRacaConfig r)
    {
        var extras = SistemaRpgConfiguration.LerExtrasRaca(r);
        return new SistemaRacaConfigDto
        {
            IdSistemaRacaConfig = r.IdSistemaRacaConfig,
            IdRaca = r.IdRaca,
            CodigoRaca = r.CodigoRaca,
            NomeRaca = r.NomeExibicao,
            Jogavel = r.Jogavel,
            VidaBase = r.VidaBase,
            EstaminaBase = r.EstaminaBase,
            ManaBase = r.ManaBase,
            CapacidadeCargaBase = r.CapacidadeCargaBase,
            CodigoAtributoInicial = r.CodigoAtributoInicial,
            Passivas = extras.Passivas,
            Variantes = extras.Variantes,
            NivelDesbloqueio = extras.NivelDesbloqueio,
            Observacoes = extras.Observacoes,
            Ordem = r.Ordem,
            PassivasVinculadas = r.Passivas.OrderBy(p => p.Ordem).Select(p => new SistemaRacaPassivaDto
            {
                IdSistemaRacaPassiva = p.IdSistemaRacaPassiva,
                IdPassiva = p.IdPassiva,
                CodigoPassiva = p.CodigoPassiva,
                NomeExibicao = p.NomeExibicao,
                Variante = p.Variante,
                Ordem = p.Ordem,
                NivelDesbloqueio = p.NivelDesbloqueio,
            }).ToList(),
        };
    }

    private static SistemaAtributoConfigDto ToAtributo(SistemaAtributoConfig a) => new()
    {
        IdSistemaAtributo = a.IdSistemaAtributoConfig,
        Codigo = a.CodigoAtributo,
        Nome = a.Nome,
        Grupo = a.Grupo,
        ValorMinimo = a.ValorMinimo,
        ValorMaximoNatural = a.ValorMaximoNatural,
        ValorMaximoAbsoluto = a.ValorMaximoAbsoluto,
        ValorComum = a.ValorComum,
        FormulaTeste = a.FormulaTeste,
        LimiteUso = a.LimiteUso,
        TipoLimiteUso = a.TipoLimiteUso,
        Descricao = a.Descricao,
        Ordem = a.Ordem,
        Ativo = a.Ativo,
    };

    private static SistemaRecursoConfigDto ToRecurso(SistemaRecursoConfig r) => new()
    {
        IdSistemaRecurso = r.IdSistemaRecursoConfig,
        Codigo = r.Codigo,
        Nome = r.Nome,
        ValorMinimo = r.ValorMinimo,
        ValorPadrao = r.ValorPadrao,
        ValorMaximo = r.ValorMaximo,
        PermiteValorNegativo = r.PermiteValorNegativo,
        RecuperacaoPadrao = r.RecuperacaoPadrao,
        RecuperacaoDescansoSimples = r.RecuperacaoDescansoSimples,
        RecuperacaoDescansoNormal = r.RecuperacaoDescansoNormal,
        RecuperacaoDescansoLongo = r.RecuperacaoDescansoLongo,
        CondicaoAoZerar = r.CondicaoAoZerar,
        FormulaValorInicial = r.FormulaValorInicial,
        FormulaValorMaximo = r.FormulaValorMaximo,
        Formula = r.Formula,
        Ordem = r.Ordem,
        Ativo = r.Ativo,
    };
}
