using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgService
{
    public Task<SistemaOperacaoResultado<SistemaConfiguracaoGeralDto>> ObterConfiguracaoGeralAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToGeral);

    public async Task<SistemaOperacaoResultado<SistemaConfiguracaoGeralDto>> AtualizarConfiguracaoGeralAsync(
        int idSistemaVersao,
        SistemaConfiguracaoGeralDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaConfiguracaoGeralDto>(lookup);
        List<string> erros = ValidarGeral(dto);
        if (erros.Count > 0)
            return Validacao<SistemaConfiguracaoGeralDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        Dictionary<SistemaModuloTipo, string?> configuracoes = versao.Modulos
            .GroupBy(m => m.TipoModulo)
            .ToDictionary(g => g.Key, g => g.First().ConfiguracaoJson);
        _repository.RemoveRange(versao.Modulos.Cast<object>().ToList());
        versao.Modulos = dto.Modulos.Select(m => new SistemaModulo
        {
            IdSistemaVersao = idSistemaVersao,
            TipoModulo = m.TipoModulo,
            Habilitado = m.Habilitado,
            SchemaVersion = 1,
            ConfiguracaoJson = configuracoes.GetValueOrDefault(m.TipoModulo),
            Ordem = m.Ordem,
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.RegrasBase, new SistemaRpgConfiguration.RegrasGerais
        {
            DadoTesteGeral = dto.DadoTesteGeral.Trim().ToUpperInvariant(),
            UsaVantagem = dto.UsaVantagem,
            UsaDesvantagem = dto.UsaDesvantagem,
            CriticoNatural = dto.CriticoNatural,
            FalhaCriticaNatural = dto.FalhaCriticaNatural,
            RegraArredondamento = dto.RegraArredondamento.Trim(),
            RegraEspecificaPrevalece = dto.RegraEspecificaPrevalece,
            AutoridadeMestre = dto.AutoridadeMestre,
            ObservacoesRegrasFundamentais = Limpar(dto.ObservacoesRegrasFundamentais),
        }, 1);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaConfiguracaoGeralDto>.Ok(SistemaRpgMapper.ToGeral(versao));
    }

    public Task<SistemaOperacaoResultado<SistemaCriacaoConfigDto>> ObterCriacaoAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToCriacao);

    public async Task<SistemaOperacaoResultado<SistemaCriacaoConfigDto>> AtualizarCriacaoAsync(
        int idSistemaVersao,
        SistemaCriacaoConfigDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaCriacaoConfigDto>(lookup);
        List<string> erros = await ValidarCriacaoAsync(dto);
        if (erros.Count > 0)
            return Validacao<SistemaCriacaoConfigDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        _repository.RemoveRange(versao.Racas.Cast<object>()
            .Concat(versao.Atributos.Cast<object>())
            .Concat(versao.Recursos.Cast<object>()).ToList());
        versao.Racas = dto.Racas.Select(r => new SistemaRacaConfig
        {
            IdSistemaVersao = idSistemaVersao,
            IdRaca = r.IdRaca,
            CodigoRaca = SistemaRpgConfiguration.NormalizarCodigo(r.CodigoRaca, r.NomeRaca ?? "RACA"),
            NomeExibicao = r.NomeRaca!.Trim(),
            Jogavel = r.Jogavel,
            VidaBase = r.VidaBase,
            EstaminaBase = r.EstaminaBase,
            ManaBase = r.ManaBase,
            CapacidadeCargaBase = r.CapacidadeCargaBase,
            CodigoAtributoInicial = Limpar(r.CodigoAtributoInicial)?.ToUpperInvariant(),
            ConfiguracaoJson = SistemaRpgConfiguration.GravarExtrasRaca(r),
            Ordem = r.Ordem,
            Passivas = r.PassivasVinculadas.Select(p => new SistemaRacaPassiva
            {
                IdPassiva = p.IdPassiva,
                CodigoPassiva = SistemaRpgConfiguration.NormalizarCodigo(p.CodigoPassiva, p.NomeExibicao),
                NomeExibicao = p.NomeExibicao.Trim(),
                Variante = Limpar(p.Variante),
                Ordem = p.Ordem,
                NivelDesbloqueio = p.NivelDesbloqueio,
            }).ToList(),
        }).ToList();
        versao.Atributos = dto.Atributos.Select(a => new SistemaAtributoConfig
        {
            IdSistemaVersao = idSistemaVersao,
            CodigoAtributo = SistemaRpgConfiguration.NormalizarCodigo(a.Codigo, a.Nome),
            Nome = a.Nome.Trim(),
            Grupo = a.Grupo,
            ValorMinimo = a.ValorMinimo,
            ValorMaximoNatural = a.ValorMaximoNatural,
            ValorMaximoAbsoluto = a.ValorMaximoAbsoluto,
            ValorComum = a.ValorComum,
            FormulaTeste = Limpar(a.FormulaTeste),
            LimiteUso = a.LimiteUso,
            TipoLimiteUso = Limpar(a.TipoLimiteUso),
            Descricao = Limpar(a.Descricao),
            Ordem = a.Ordem,
            Ativo = a.Ativo,
        }).ToList();
        versao.Recursos = dto.Recursos.Select(r => new SistemaRecursoConfig
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(r.Codigo, r.Nome),
            Nome = r.Nome.Trim(),
            ValorMinimo = r.ValorMinimo,
            ValorPadrao = r.ValorPadrao,
            ValorMaximo = r.ValorMaximo,
            PermiteValorNegativo = r.PermiteValorNegativo,
            RecuperacaoPadrao = r.RecuperacaoPadrao,
            RecuperacaoDescansoSimples = r.RecuperacaoDescansoSimples,
            RecuperacaoDescansoNormal = r.RecuperacaoDescansoNormal,
            RecuperacaoDescansoLongo = r.RecuperacaoDescansoLongo,
            CondicaoAoZerar = Limpar(r.CondicaoAoZerar),
            FormulaValorInicial = Limpar(r.FormulaValorInicial),
            FormulaValorMaximo = Limpar(r.FormulaValorMaximo),
            Formula = Limpar(r.Formula),
            Ordem = r.Ordem,
            Ativo = r.Ativo,
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.CriacaoPersonagem, new SistemaRpgConfiguration.RegrasCriacao
        {
            NivelInicial = dto.NivelInicial,
            PontosIniciais = dto.PontosIniciais,
            PontosAtributoIniciais = dto.PontosAtributoIniciais,
            PontosSkillIniciais = dto.PontosSkillIniciais,
            MaximoSkillsIniciais = dto.MaximoSkillsIniciais,
            MaximoMagiasIniciais = dto.MaximoMagiasIniciais,
            MaximoUltimatesIniciais = dto.MaximoUltimatesIniciais,
        }, 2);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaCriacaoConfigDto>.Ok(SistemaRpgMapper.ToCriacao(versao));
    }

    public Task<SistemaOperacaoResultado<SistemaProgressaoConfigDto>> ObterProgressaoAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToProgressao);

    public async Task<SistemaOperacaoResultado<SistemaProgressaoConfigDto>> AtualizarProgressaoAsync(
        int idSistemaVersao,
        SistemaProgressaoConfigDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaProgressaoConfigDto>(lookup);
        List<string> erros = ValidarProgressao(dto);
        if (erros.Count > 0)
            return Validacao<SistemaProgressaoConfigDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        _repository.RemoveRange(versao.Niveis.Cast<object>()
            .Concat(versao.MarcosNivel.Cast<object>())
            .Concat(versao.FontesExperiencia.Cast<object>()).ToList());
        versao.Niveis = dto.Niveis.Select(n => new SistemaNivel
        {
            IdSistemaVersao = idSistemaVersao,
            Nivel = n.Nivel,
            XpParaProximoNivel = n.XpParaProximoNivel,
            PontosNivel = n.PontosNivel,
            PontosAtributo = n.PontosAtributo,
            PontosSkill = n.PontosSkill,
            PontosUltimate = n.PontosUltimate,
            PermiteNovaMagia = n.PermiteNovaMagia,
            PermiteNovaSkill = n.PermiteNovaSkill,
            Observacao = Limpar(n.Observacao),
            Ordem = n.Ordem,
        }).ToList();
        versao.MarcosNivel = dto.Marcos.Select(m => new SistemaMarcoNivel
        {
            IdSistemaVersao = idSistemaVersao,
            Nivel = m.Nivel,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(m.Codigo, m.Nome),
            Nome = m.Nome.Trim(),
            Descricao = Limpar(m.Descricao),
            TipoRecompensa = m.TipoRecompensa.Trim(),
            ConfiguracaoJson = Limpar(m.ConfiguracaoJson),
            Ordem = m.Ordem,
        }).ToList();
        versao.FontesExperiencia = dto.FontesExperiencia.Select(f => new SistemaFonteExperiencia
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(f.Codigo, f.Nome),
            Nome = f.Nome.Trim(),
            TipoTeste = Limpar(f.TipoTeste),
            Formula = Limpar(f.Formula),
            ValorMinimo = f.ValorMinimo,
            ValorMaximo = f.ValorMaximo,
            UsaVantagem = f.UsaVantagem,
            Descricao = Limpar(f.Descricao),
            ConfiguracaoJson = Limpar(f.ConfiguracaoJson),
            Ordem = f.Ordem,
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Progressao, new SistemaRpgConfiguration.RegrasProgressao
        {
            NivelMaximo = dto.NivelMaximo,
            PermiteXpExcedente = dto.PermiteXpExcedente,
        }, 3);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaProgressaoConfigDto>.Ok(SistemaRpgMapper.ToProgressao(versao));
    }

    public Task<SistemaOperacaoResultado<SistemaExploracaoConfigDto>> ObterExploracaoAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToExploracao);

    public async Task<SistemaOperacaoResultado<SistemaExploracaoConfigDto>> AtualizarExploracaoAsync(
        int idSistemaVersao,
        SistemaExploracaoConfigDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaExploracaoConfigDto>(lookup);
        List<string> erros = ValidarExploracao(dto);
        if (erros.Count > 0)
            return Validacao<SistemaExploracaoConfigDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        _repository.RemoveRange(versao.Acoes.Cast<object>().ToList());
        if (versao.Movimento is not null)
            _repository.RemoveRange(new object[] { versao.Movimento });
        if (versao.PontosAcao is not null)
            _repository.RemoveRange(new object[] { versao.PontosAcao });
        versao.Movimento = dto.Movimento is null ? null : new SistemaMovimentoConfig
        {
            IdSistemaVersao = idSistemaVersao,
            UsaGrid = dto.Movimento.UsaGrid,
            MetrosPorQuadrado = dto.Movimento.MetrosPorQuadrado,
            MovimentoGratuito = dto.Movimento.MovimentoGratuito,
            CustoEstaminaPorQuadrado = dto.Movimento.CustoEstaminaPorQuadrado,
            MaximoQuadradosTurno = dto.Movimento.MaximoQuadradosTurno,
            PermiteMoverAposAtaque = dto.Movimento.PermiteMoverAposAtaque,
            Observacoes = Limpar(dto.Movimento.Observacoes),
        };
        versao.PontosAcao = dto.PontosAcao is null ? null : new SistemaPontosAcaoConfig
        {
            IdSistemaVersao = idSistemaVersao,
            Habilitado = dto.PontosAcao.Habilitado,
            PontosPorTurno = dto.PontosAcao.PontosPorTurno,
            SegundosPorPonto = dto.PontosAcao.SegundosPorPonto,
            PermiteAcumular = dto.PontosAcao.PermiteAcumular,
            LimiteAcumulado = dto.PontosAcao.LimiteAcumulado,
        };
        versao.Acoes = dto.Acoes.Select(a => new SistemaAcaoConfig
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(a.Codigo, a.Nome),
            Nome = a.Nome.Trim(),
            Tipo = a.Tipo.Trim(),
            CustoPontosAcao = a.CustoPontosAcao,
            CustoEstamina = a.CustoEstamina,
            CustoMana = a.CustoMana,
            EncerraTurno = a.EncerraTurno,
            PermiteCombo = a.PermiteCombo,
            ExigeAlvo = a.ExigeAlvo,
            Formula = Limpar(a.Formula),
            Descricao = Limpar(a.Descricao),
            Ordem = a.Ordem,
            ConfiguracaoJson = Limpar(a.ConfiguracaoJson),
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Exploracao, new SistemaRpgConfiguration.RegrasExploracao
        {
            CargaUsaLimite = dto.CargaUsaLimite,
            PenalidadeExcessoCarga = Limpar(dto.PenalidadeExcessoCarga),
            FurtividadeObservacoes = Limpar(dto.FurtividadeObservacoes),
        }, 4);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaExploracaoConfigDto>.Ok(SistemaRpgMapper.ToExploracao(versao));
    }

    public Task<SistemaOperacaoResultado<SistemaCombateConfigDto>> ObterCombateAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToCombate);

    public async Task<SistemaOperacaoResultado<SistemaCombateConfigDto>> AtualizarCombateAsync(
        int idSistemaVersao,
        SistemaCombateConfigDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaCombateConfigDto>(lookup);
        List<string> erros = ValidarCombate(dto);
        if (erros.Count > 0)
            return Validacao<SistemaCombateConfigDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        _repository.RemoveRange(versao.ResultadosDado.Cast<object>()
            .Concat(versao.TiposDano.Cast<object>())
            .Concat(versao.TiposDefesa.Cast<object>()).ToList());
        versao.ResultadosDado = dto.ResultadosDado.Select(r => new SistemaResultadoDado
        {
            IdSistemaVersao = idSistemaVersao,
            CodigoTeste = SistemaRpgConfiguration.NormalizarCodigo(r.CodigoTeste, r.NomeTeste),
            NomeTeste = r.NomeTeste.Trim(),
            Dado = r.Dado.Trim().ToUpperInvariant(),
            QuantidadeDados = r.QuantidadeDados,
            ResultadoMinimo = r.ResultadoMinimo,
            ResultadoMaximo = r.ResultadoMaximo,
            ExigeNatural = r.ExigeNatural,
            CodigoResultado = SistemaRpgConfiguration.NormalizarCodigo(r.CodigoResultado, r.NomeResultado),
            NomeResultado = r.NomeResultado.Trim(),
            Descricao = Limpar(r.Descricao),
            EfeitoJson = Limpar(r.EfeitoJson),
            Ordem = r.Ordem,
        }).ToList();
        versao.TiposDano = dto.TiposDano.Select(t => new SistemaTipoDano
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(t.Codigo, t.Nome),
            Nome = t.Nome.Trim(),
            Descricao = Limpar(t.Descricao),
            IgnoraArmadura = t.IgnoraArmadura,
            IgnoraProtecao = t.IgnoraProtecao,
            IgnoraEscudo = t.IgnoraEscudo,
            Periodico = t.Periodico,
            Area = t.Area,
            ConfiguracaoJson = Limpar(t.ConfiguracaoJson),
            Ordem = t.Ordem,
        }).ToList();
        versao.TiposDefesa = dto.TiposDefesa.Select(t => new SistemaTipoDefesa
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(t.Codigo, t.Nome),
            Nome = t.Nome.Trim(),
            Descricao = Limpar(t.Descricao),
            OrdemAplicacao = t.OrdemAplicacao,
            TipoComportamento = t.TipoComportamento.Trim(),
            Formula = Limpar(t.Formula),
            ConfiguracaoJson = Limpar(t.ConfiguracaoJson),
            Ordem = t.Ordem,
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Combate, new SistemaRpgConfiguration.RegrasCombate
        {
            UsaIniciativa = dto.UsaIniciativa,
            FormulaIniciativa = Limpar(dto.FormulaIniciativa),
            SegundosPorTurno = dto.SegundosPorTurno,
            RegraDeclaracaoAcoes = Limpar(dto.RegraDeclaracaoAcoes),
        }, 5);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaCombateConfigDto>.Ok(SistemaRpgMapper.ToCombate(versao));
    }

    public Task<SistemaOperacaoResultado<SistemaPoderesConfigDto>> ObterPoderesAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToPoderes);

    public async Task<SistemaOperacaoResultado<SistemaPoderesConfigDto>> AtualizarPoderesAsync(
        int idSistemaVersao,
        SistemaPoderesConfigDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaPoderesConfigDto>(lookup);
        List<string> erros = ValidarPoderes(dto);
        if (erros.Count > 0)
            return Validacao<SistemaPoderesConfigDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        _repository.RemoveRange(versao.TiposMagia.Cast<object>().ToList());
        if (versao.SkillConfig is not null)
            _repository.RemoveRange(new object[] { versao.SkillConfig });
        versao.TiposMagia = dto.TiposMagia.Select(t => new SistemaTipoMagia
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(t.Codigo, t.Nome),
            Nome = t.Nome.Trim(),
            Descricao = Limpar(t.Descricao),
            Cor = Limpar(t.Cor),
            Afinidade = Limpar(t.Afinidade),
            CustoBase = t.CustoBase,
            Ordem = t.Ordem,
            ConfiguracaoJson = Limpar(t.ConfiguracaoJson),
        }).ToList();
        versao.SkillConfig = dto.SkillConfig is null ? null : new SistemaSkillConfig
        {
            IdSistemaVersao = idSistemaVersao,
            MaximoSkills = dto.SkillConfig.MaximoSkills,
            NivelMaximoSkill = dto.SkillConfig.NivelMaximoSkill,
            MaximoUltimates = dto.SkillConfig.MaximoUltimates,
            NivelDesbloqueioUltimate = dto.SkillConfig.NivelDesbloqueioUltimate,
            MaximoMagias = dto.SkillConfig.MaximoMagias,
            UsaCooldown = dto.SkillConfig.UsaCooldown,
            PermiteArtesEtericas = dto.SkillConfig.PermiteArtesEtericas,
            Observacoes = Limpar(dto.SkillConfig.Observacoes),
        };
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Poderes, new SistemaRpgConfiguration.RegrasPoderes
        {
            LimiteMagias = dto.LimiteMagias,
            PermiteMagiasCompostas = dto.PermiteMagiasCompostas,
            RegraAprendizadoMagia = Limpar(dto.RegraAprendizadoMagia),
        }, 6);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaPoderesConfigDto>.Ok(SistemaRpgMapper.ToPoderes(versao));
    }

    public Task<SistemaOperacaoResultado<SistemaSobrevivenciaConfigDto>> ObterSobrevivenciaAsync(
        int idSistemaVersao,
        bool incluirRascunhos = false) =>
        ObterSecaoAsync(idSistemaVersao, incluirRascunhos, SistemaRpgMapper.ToSobrevivencia);

    public async Task<SistemaOperacaoResultado<SistemaSobrevivenciaConfigDto>> AtualizarSobrevivenciaAsync(
        int idSistemaVersao,
        SistemaSobrevivenciaConfigDto dto)
    {
        SistemaOperacaoResultado<SistemaVersao> lookup = await ObterRascunhoAsync(idSistemaVersao);
        if (!lookup.Sucesso)
            return Propagar<SistemaSobrevivenciaConfigDto>(lookup);
        List<string> erros = ValidarSobrevivencia(dto);
        if (erros.Count > 0)
            return Validacao<SistemaSobrevivenciaConfigDto>(string.Join(" ", erros));

        SistemaVersao versao = lookup.Dados!;
        _repository.RemoveRange(versao.Condicoes.Cast<object>()
            .Concat(versao.Descansos.Cast<object>()).ToList());
        if (versao.Morte is not null)
            _repository.RemoveRange(new object[] { versao.Morte });
        versao.Condicoes = dto.Condicoes.Select(c => new SistemaCondicao
        {
            IdSistemaVersao = idSistemaVersao,
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(c.Codigo, c.Nome),
            Nome = c.Nome.Trim(),
            Descricao = Limpar(c.Descricao),
            Tipo = c.Tipo.Trim(),
            DuracaoPadrao = c.DuracaoPadrao,
            UnidadeDuracao = c.UnidadeDuracao,
            Empilhavel = c.Empilhavel,
            RemocaoAutomatica = c.RemocaoAutomatica,
            PermiteSobrescrever = c.PermiteSobrescrever,
            ValorPadrao = c.ValorPadrao,
            ConfiguracaoPadraoJson = Limpar(c.ConfiguracaoPadraoJson),
            Ordem = c.Ordem,
        }).ToList();
        versao.Descansos = dto.Descansos.Select(d => new SistemaDescansoConfig
        {
            IdSistemaVersao = idSistemaVersao,
            Tipo = d.Tipo.Trim(),
            Nome = d.Nome.Trim(),
            DuracaoMinimaMinutos = d.DuracaoMinimaMinutos,
            DuracaoMaximaMinutos = d.DuracaoMaximaMinutos,
            RecuperacaoVida = d.RecuperacaoVida,
            RecuperacaoMana = d.RecuperacaoMana,
            RecuperacaoEstamina = d.RecuperacaoEstamina,
            TipoRecuperacao = d.TipoRecuperacao,
            ExigeGuarda = d.ExigeGuarda,
            IntervaloTesteGuardaMinutos = d.IntervaloTesteGuardaMinutos,
            PermiteAtividades = d.PermiteAtividades,
            ConfiguracaoJson = Limpar(d.ConfiguracaoJson),
            Ordem = d.Ordem,
        }).ToList();
        versao.Morte = dto.Morte is null ? null : new SistemaMorteConfig
        {
            IdSistemaVersao = idSistemaVersao,
            LimiteBeiraDaMorte = dto.Morte.LimiteBeiraDaMorte,
            QuantidadeTestesCombate = dto.Morte.QuantidadeTestesCombate,
            QuantidadeTestesForaCombate = dto.Morte.QuantidadeTestesForaCombate,
            SucessosNecessarios = dto.Morte.SucessosNecessarios,
            DadoSobrevivencia = dto.Morte.DadoSobrevivencia.Trim().ToUpperInvariant(),
            ResultadoMinimoSucesso = dto.Morte.ResultadoMinimoSucesso,
            LimiteVidaDesmembramento = dto.Morte.LimiteVidaDesmembramento,
            MultiplicadorDanoDesmembramento = dto.Morte.MultiplicadorDanoDesmembramento,
            LimiteVidaInstaKill = dto.Morte.LimiteVidaInstaKill,
            MultiplicadorDanoInstaKill = dto.Morte.MultiplicadorDanoInstaKill,
            PermiteEstabilizacaoManual = dto.Morte.PermiteEstabilizacaoManual,
            Observacoes = Limpar(dto.Morte.Observacoes),
        };
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Sobrevivencia, new SistemaRpgConfiguration.RegrasSobrevivencia
        {
            RegraLoot = Limpar(dto.RegraLoot),
            RegraRefeicoes = Limpar(dto.RegraRefeicoes),
        }, 7);
        await SalvarRascunhoAsync(versao);
        return SistemaOperacaoResultado<SistemaSobrevivenciaConfigDto>.Ok(SistemaRpgMapper.ToSobrevivencia(versao));
    }

    private async Task<SistemaOperacaoResultado<T>> ObterSecaoAsync<T>(
        int idSistemaVersao,
        bool incluirRascunhos,
        Func<SistemaVersao, T> map)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(idSistemaVersao, includeConfiguration: true);
        if (versao is null || (versao.Status == SistemaVersaoStatus.Rascunho && !incluirRascunhos))
            return NaoEncontrado<T>("Versão do sistema não encontrada.");
        return SistemaOperacaoResultado<T>.Ok(map(versao));
    }

    private async Task<SistemaOperacaoResultado<SistemaVersao>> ObterRascunhoAsync(int idSistemaVersao)
    {
        SistemaVersao? versao = await _repository.GetVersionAsync(
            idSistemaVersao,
            includeConfiguration: true,
            tracked: true);
        if (versao is null)
            return NaoEncontrado<SistemaVersao>("Versão do sistema não encontrada.");
        if (versao.Status != SistemaVersaoStatus.Rascunho)
            return Conflito<SistemaVersao>("Versões publicadas ou arquivadas são imutáveis. Duplique a versão para continuar editando.");
        return SistemaOperacaoResultado<SistemaVersao>.Ok(versao);
    }

    private async Task SalvarRascunhoAsync(SistemaVersao versao)
    {
        versao.DataAtualizacao = DateTime.UtcNow;
        versao.SistemaRpg.DataAtualizacao = versao.DataAtualizacao;
        await _repository.SaveChangesAsync();
    }

    private static SistemaOperacaoResultado<T> Propagar<T>(SistemaOperacaoResultado<SistemaVersao> origem) =>
        SistemaOperacaoResultado<T>.Falha(origem.MensagemErro!, origem.TipoErro);
}
