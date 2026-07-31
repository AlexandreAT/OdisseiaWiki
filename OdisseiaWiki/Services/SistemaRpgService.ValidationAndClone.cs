using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Helpers;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgService
{
    private static List<string> ValidarGeral(SistemaConfiguracaoGeralDto dto)
    {
        List<string> erros = new();
        int? faces = SistemaRpgConfiguration.ObterFacesDado(dto.DadoTesteGeral);
        if (!faces.HasValue)
            erros.Add("O dado geral deve usar o formato D6, D20 ou equivalente.");
        else
        {
            if (dto.CriticoNatural is < 1 || dto.CriticoNatural > faces.Value)
                erros.Add("O crítico natural deve estar dentro das faces do dado geral.");
            if (dto.FalhaCriticaNatural is < 1 || dto.FalhaCriticaNatural > faces.Value)
                erros.Add("A falha crítica natural deve estar dentro das faces do dado geral.");
            if (dto.CriticoNatural == dto.FalhaCriticaNatural)
                erros.Add("Crítico natural e falha crítica natural não podem ter o mesmo resultado.");
        }
        if (string.IsNullOrWhiteSpace(dto.RegraArredondamento))
            erros.Add("Informe a regra de arredondamento.");
        if (dto.Modulos.Count == 0)
            erros.Add("A versão precisa possuir ao menos um módulo.");
        if (dto.Modulos.GroupBy(m => m.TipoModulo).Any(g => g.Count() > 1))
            erros.Add("Não é permitido repetir o mesmo módulo.");
        if (dto.Modulos.Any(m => m.SchemaVersion != 1))
            erros.Add("Apenas o schemaVersion 1 é suportado nesta versão da API.");
        if (dto.Modulos.Any(m => m.Ordem < 0))
            erros.Add("A ordem dos módulos não pode ser negativa.");
        return erros;
    }

    private async Task<List<string>> ValidarCriacaoAsync(SistemaCriacaoConfigDto dto)
    {
        List<string> erros = new();
        if (dto.NivelInicial < 1)
            erros.Add("O nível inicial deve ser maior que zero.");
        if (new[]
            {
                dto.PontosIniciais,
                dto.PontosAtributoIniciais,
                dto.PontosSkillIniciais,
                dto.MaximoSkillsIniciais,
                dto.MaximoMagiasIniciais,
                dto.MaximoUltimatesIniciais,
            }.Any(v => v < 0))
            erros.Add("Limites e pontos iniciais não podem ser negativos.");

        HashSet<int> racasExistentes = (await _repository.GetRacesAsync()).Select(r => r.Idraca).ToHashSet();
        HashSet<int> passivasExistentes = (await _repository.GetPassivasAsync()).Select(p => p.Idpassiva).ToHashSet();
        foreach (SistemaRacaConfigDto raca in dto.Racas)
        {
            if (string.IsNullOrWhiteSpace(raca.NomeRaca))
                erros.Add("Toda raça configurada deve possuir nome.");
            if (raca.IdRaca.HasValue && !racasExistentes.Contains(raca.IdRaca.Value))
                erros.Add($"A raça vinculada de ID {raca.IdRaca} não existe.");
            if (raca.VidaBase < 0 || raca.EstaminaBase < 0 || raca.ManaBase < 0 || raca.CapacidadeCargaBase < 0)
                erros.Add($"Os recursos base da raça {raca.NomeRaca ?? "sem nome"} não podem ser negativos.");
            foreach (SistemaRacaPassivaDto passiva in raca.PassivasVinculadas)
            {
                if (string.IsNullOrWhiteSpace(passiva.NomeExibicao))
                    erros.Add($"Uma passiva da raça {raca.NomeRaca ?? "sem nome"} está sem nome.");
                if (passiva.IdPassiva.HasValue && !passivasExistentes.Contains(passiva.IdPassiva.Value))
                    erros.Add($"A passiva vinculada de ID {passiva.IdPassiva} não existe.");
            }
        }
        if (TemDuplicados(dto.Racas.Select(r => SistemaRpgConfiguration.NormalizarCodigo(r.CodigoRaca, r.NomeRaca ?? "RACA"))))
            erros.Add("Os códigos de raça não podem se repetir.");

        foreach (SistemaAtributoConfigDto atributo in dto.Atributos)
        {
            if (string.IsNullOrWhiteSpace(atributo.Nome))
                erros.Add("Todo atributo deve possuir nome.");
            int absoluto = atributo.ValorMaximoAbsoluto ?? atributo.ValorMaximoNatural;
            if (atributo.ValorMinimo > atributo.ValorComum || atributo.ValorComum > atributo.ValorMaximoNatural ||
                atributo.ValorMaximoNatural > absoluto)
                erros.Add($"Os limites do atributo {atributo.Nome} estão em ordem inválida.");
            if (atributo.LimiteUso < 0)
                erros.Add($"O limite de uso do atributo {atributo.Nome} não pode ser negativo.");
        }
        if (TemDuplicados(dto.Atributos.Select(a => SistemaRpgConfiguration.NormalizarCodigo(a.Codigo, a.Nome))))
            erros.Add("Os códigos de atributo não podem se repetir.");

        foreach (SistemaRecursoConfigDto recurso in dto.Recursos)
        {
            if (string.IsNullOrWhiteSpace(recurso.Nome))
                erros.Add("Todo recurso deve possuir nome.");
            if (!recurso.PermiteValorNegativo && recurso.ValorMinimo < 0)
                erros.Add($"O recurso {recurso.Nome} não permite valor mínimo negativo.");
            if (recurso.ValorPadrao < recurso.ValorMinimo ||
                (recurso.ValorMaximo.HasValue && recurso.ValorPadrao > recurso.ValorMaximo.Value))
                erros.Add($"O valor padrão do recurso {recurso.Nome} está fora dos limites.");
        }
        if (TemDuplicados(dto.Recursos.Select(r => SistemaRpgConfiguration.NormalizarCodigo(r.Codigo, r.Nome))))
            erros.Add("Os códigos de recurso não podem se repetir.");
        return erros;
    }

    private static List<string> ValidarProgressao(SistemaProgressaoConfigDto dto)
    {
        List<string> erros = new();
        if (dto.NivelMaximo < 1)
            erros.Add("O nível máximo deve ser maior que zero.");
        if (dto.Niveis.Any(n => n.Nivel < 1 || n.XpParaProximoNivel < 0 || n.PontosNivel < 0 ||
            n.PontosAtributo < 0 || n.PontosSkill < 0 || n.PontosUltimate < 0))
            erros.Add("Níveis, experiência e recompensas não podem possuir valores negativos.");
        if (dto.Niveis.GroupBy(n => n.Nivel).Any(g => g.Count() > 1))
            erros.Add("Não é permitido repetir um nível na progressão.");
        if (dto.Niveis.Any(n => n.Nivel > dto.NivelMaximo))
            erros.Add("Há um nível configurado acima do nível máximo.");
        if (dto.Niveis.Count > 0)
        {
            List<int> niveis = dto.Niveis.Select(n => n.Nivel).OrderBy(n => n).ToList();
            if (niveis.Count != dto.NivelMaximo ||
                !niveis.SequenceEqual(Enumerable.Range(1, dto.NivelMaximo)))
                erros.Add("A curva de progressão deve conter todos os níveis, de 1 até o nível máximo, sem lacunas.");
        }
        if (dto.Marcos.Any(m => m.Nivel < 1 || m.Nivel > dto.NivelMaximo ||
            string.IsNullOrWhiteSpace(m.Nome) || string.IsNullOrWhiteSpace(m.TipoRecompensa)))
            erros.Add("Todo marco deve possuir nome, recompensa e um nível válido.");
        if (TemDuplicados(dto.Marcos.Select(m => SistemaRpgConfiguration.NormalizarCodigo(m.Codigo, m.Nome))))
            erros.Add("Os códigos de marcos não podem se repetir.");
        if (dto.Marcos.Any(m => !JsonValido(m.ConfiguracaoJson)))
            erros.Add("A configuração complementar de um marco não contém JSON válido.");
        if (dto.FontesExperiencia.Any(f => string.IsNullOrWhiteSpace(f.Nome) ||
            (f.ValorMinimo.HasValue && f.ValorMaximo.HasValue && f.ValorMinimo > f.ValorMaximo)))
            erros.Add("Toda fonte de experiência deve ter nome e limites coerentes.");
        if (TemDuplicados(dto.FontesExperiencia.Select(f => SistemaRpgConfiguration.NormalizarCodigo(f.Codigo, f.Nome))))
            erros.Add("Os códigos de fontes de experiência não podem se repetir.");
        if (dto.FontesExperiencia.Any(f => !JsonValido(f.ConfiguracaoJson)))
            erros.Add("A configuração complementar de uma fonte de experiência não contém JSON válido.");
        return erros;
    }

    private static List<string> ValidarExploracao(SistemaExploracaoConfigDto dto)
    {
        List<string> erros = new();
        if (dto.Movimento is not null && (dto.Movimento.MetrosPorQuadrado < 0 ||
            dto.Movimento.MovimentoGratuito < 0 || dto.Movimento.CustoEstaminaPorQuadrado < 0 ||
            dto.Movimento.MaximoQuadradosTurno < 0))
            erros.Add("Os valores de movimento não podem ser negativos.");
        if (dto.PontosAcao is not null && (dto.PontosAcao.PontosPorTurno < 0 ||
            dto.PontosAcao.SegundosPorPonto < 0 || dto.PontosAcao.LimiteAcumulado < 0))
            erros.Add("Os valores de pontos de ação não podem ser negativos.");
        if (dto.PontosAcao is { PermiteAcumular: true } && dto.PontosAcao.LimiteAcumulado < dto.PontosAcao.PontosPorTurno)
            erros.Add("O limite acumulado deve ser igual ou superior aos pontos recebidos por turno.");
        if (dto.Acoes.Any(a => string.IsNullOrWhiteSpace(a.Nome) || string.IsNullOrWhiteSpace(a.Tipo) ||
            a.CustoPontosAcao < 0 || a.CustoEstamina < 0 || a.CustoMana < 0))
            erros.Add("Toda ação deve ter nome, tipo e custos não negativos.");
        if (TemDuplicados(dto.Acoes.Select(a => SistemaRpgConfiguration.NormalizarCodigo(a.Codigo, a.Nome))))
            erros.Add("Os códigos de ações não podem se repetir.");
        if (dto.Acoes.Any(a => !JsonValido(a.ConfiguracaoJson)))
            erros.Add("A configuração complementar de uma ação não contém JSON válido.");
        return erros;
    }

    private static List<string> ValidarCombate(SistemaCombateConfigDto dto)
    {
        List<string> erros = new();
        if (dto.SegundosPorTurno <= 0)
            erros.Add("A duração do turno deve ser maior que zero.");
        foreach (SistemaResultadoDadoDto resultado in dto.ResultadosDado)
        {
            int? faces = SistemaRpgConfiguration.ObterFacesDado(resultado.Dado);
            if (!faces.HasValue || resultado.QuantidadeDados < 1)
            {
                erros.Add($"O dado do teste {resultado.NomeTeste} é inválido.");
                continue;
            }
            int maximo = faces.Value * resultado.QuantidadeDados;
            if (resultado.ResultadoMinimo < resultado.QuantidadeDados || resultado.ResultadoMaximo > maximo ||
                resultado.ResultadoMinimo > resultado.ResultadoMaximo)
                erros.Add($"O intervalo de {resultado.NomeResultado} está fora dos limites do dado.");
            if (!JsonValido(resultado.EfeitoJson))
                erros.Add($"O efeito de {resultado.NomeResultado} não contém JSON válido.");
        }
        foreach (IGrouping<string, SistemaResultadoDadoDto> grupo in dto.ResultadosDado.GroupBy(
            r => $"{r.CodigoTeste.Trim().ToUpperInvariant()}|{r.Dado.Trim().ToUpperInvariant()}|{r.QuantidadeDados}"))
        {
            List<SistemaResultadoDadoDto> ranges = grupo.OrderBy(r => r.ResultadoMinimo).ToList();
            for (int i = 1; i < ranges.Count; i++)
            {
                if (ranges[i].ResultadoMinimo <= ranges[i - 1].ResultadoMaximo)
                {
                    erros.Add($"Há intervalos sobrepostos no teste {ranges[i].NomeTeste}.");
                    break;
                }
                if (ranges[i].ResultadoMinimo != ranges[i - 1].ResultadoMaximo + 1)
                {
                    erros.Add($"Há uma lacuna entre as faixas do teste {ranges[i].NomeTeste}.");
                    break;
                }
            }
            int? faces = SistemaRpgConfiguration.ObterFacesDado(ranges[0].Dado);
            if (faces.HasValue &&
                (ranges[0].ResultadoMinimo != ranges[0].QuantidadeDados ||
                 ranges[^1].ResultadoMaximo != faces.Value * ranges[0].QuantidadeDados))
                erros.Add($"As faixas do teste {ranges[0].NomeTeste} devem cobrir todos os resultados possíveis do dado.");
        }
        if (dto.TiposDano.Any(t => string.IsNullOrWhiteSpace(t.Nome)))
            erros.Add("Todo tipo de dano deve possuir nome.");
        if (TemDuplicados(dto.TiposDano.Select(t => SistemaRpgConfiguration.NormalizarCodigo(t.Codigo, t.Nome))))
            erros.Add("Os códigos de tipos de dano não podem se repetir.");
        if (dto.TiposDano.Any(t => !JsonValido(t.ConfiguracaoJson)))
            erros.Add("A configuração complementar de um tipo de dano não contém JSON válido.");
        if (dto.TiposDefesa.Any(t => string.IsNullOrWhiteSpace(t.Nome) || string.IsNullOrWhiteSpace(t.TipoComportamento)))
            erros.Add("Todo tipo de defesa deve possuir nome e comportamento.");
        if (TemDuplicados(dto.TiposDefesa.Select(t => SistemaRpgConfiguration.NormalizarCodigo(t.Codigo, t.Nome))))
            erros.Add("Os códigos de tipos de defesa não podem se repetir.");
        if (dto.TiposDefesa.Any(t => !JsonValido(t.ConfiguracaoJson)))
            erros.Add("A configuração complementar de um tipo de defesa não contém JSON válido.");
        return erros;
    }

    private static List<string> ValidarPoderes(SistemaPoderesConfigDto dto)
    {
        List<string> erros = new();
        if (dto.LimiteMagias < 0)
            erros.Add("O limite de magias não pode ser negativo.");
        if (dto.TiposMagia.Any(t => string.IsNullOrWhiteSpace(t.Nome) || t.CustoBase < 0))
            erros.Add("Todo tipo de magia deve possuir nome e custo base não negativo.");
        if (TemDuplicados(dto.TiposMagia.Select(t => SistemaRpgConfiguration.NormalizarCodigo(t.Codigo, t.Nome))))
            erros.Add("Os códigos de tipos de magia não podem se repetir.");
        if (dto.TiposMagia.Any(t => !JsonValido(t.ConfiguracaoJson)))
            erros.Add("A configuração complementar de um tipo de magia não contém JSON válido.");
        if (dto.SkillConfig is not null && (dto.SkillConfig.MaximoSkills < 0 ||
            dto.SkillConfig.NivelMaximoSkill < 0 || dto.SkillConfig.MaximoUltimates < 0 ||
            dto.SkillConfig.NivelDesbloqueioUltimate < 0 || dto.SkillConfig.MaximoMagias < 0))
            erros.Add("Os limites de skills, magias e ultimates não podem ser negativos.");
        return erros;
    }

    private static List<string> ValidarSobrevivencia(SistemaSobrevivenciaConfigDto dto)
    {
        List<string> erros = new();
        if (dto.Condicoes.Any(c => string.IsNullOrWhiteSpace(c.Nome) || string.IsNullOrWhiteSpace(c.Tipo) ||
            c.DuracaoPadrao < 0))
            erros.Add("Toda condição deve possuir nome, tipo e duração não negativa.");
        if (TemDuplicados(dto.Condicoes.Select(c => SistemaRpgConfiguration.NormalizarCodigo(c.Codigo, c.Nome))))
            erros.Add("Os códigos de condições não podem se repetir.");
        if (dto.Condicoes.Any(c => !JsonValido(c.ConfiguracaoPadraoJson)))
            erros.Add("A configuração complementar de uma condição não contém JSON válido.");
        if (dto.Descansos.Any(d => string.IsNullOrWhiteSpace(d.Nome) || string.IsNullOrWhiteSpace(d.Tipo) ||
            d.DuracaoMinimaMinutos < 0 || d.DuracaoMaximaMinutos < 0 ||
            (d.DuracaoMinimaMinutos.HasValue && d.DuracaoMaximaMinutos.HasValue &&
             d.DuracaoMinimaMinutos > d.DuracaoMaximaMinutos) ||
            d.RecuperacaoVida < 0 || d.RecuperacaoMana < 0 || d.RecuperacaoEstamina < 0))
            erros.Add("Todo descanso deve possuir nome, tipo, durações coerentes e recuperações não negativas.");
        if (dto.Descansos.Any(d => !JsonValido(d.ConfiguracaoJson)))
            erros.Add("A configuração complementar de um descanso não contém JSON válido.");
        if (dto.Morte is not null)
        {
            int? faces = SistemaRpgConfiguration.ObterFacesDado(dto.Morte.DadoSobrevivencia);
            if (!faces.HasValue || dto.Morte.ResultadoMinimoSucesso < 1 || dto.Morte.ResultadoMinimoSucesso > faces)
                erros.Add("O dado ou o resultado mínimo do teste de sobrevivência é inválido.");
            if (dto.Morte.QuantidadeTestesCombate < 1 || dto.Morte.QuantidadeTestesForaCombate < 1 ||
                dto.Morte.SucessosNecessarios < 1 || dto.Morte.MultiplicadorDanoDesmembramento < 0 ||
                dto.Morte.MultiplicadorDanoInstaKill < 0)
                erros.Add("Os limites de morte e sobrevivência devem ser positivos e coerentes.");
        }
        return erros;
    }

    private static List<string> ValidarPublicacao(SistemaVersao versao)
    {
        List<string> erros = new();
        SistemaModuloTipo[] obrigatorios =
        {
            SistemaModuloTipo.RegrasBase,
            SistemaModuloTipo.CriacaoPersonagem,
            SistemaModuloTipo.Progressao,
            SistemaModuloTipo.Exploracao,
            SistemaModuloTipo.Combate,
            SistemaModuloTipo.Poderes,
            SistemaModuloTipo.Sobrevivencia,
        };
        foreach (SistemaModuloTipo tipo in obrigatorios)
        {
            if (!versao.Modulos.Any(m => m.TipoModulo == tipo && m.Habilitado && m.SchemaVersion == 1))
                erros.Add($"O módulo obrigatório {tipo} precisa estar habilitado no schema 1.");
        }
        if (versao.Niveis.Count == 0)
            erros.Add("Configure ao menos um nível antes de publicar.");
        else
        {
            List<int> niveis = versao.Niveis.Select(n => n.Nivel).OrderBy(n => n).ToList();
            if (niveis[0] != 1 || !niveis.SequenceEqual(Enumerable.Range(1, niveis[^1])))
                erros.Add("A progressão deve ser contínua e começar no nível 1.");
        }
        if (versao.Atributos.Count == 0)
            erros.Add("Configure ao menos um atributo antes de publicar.");
        if (versao.Recursos.Count == 0)
            erros.Add("Configure ao menos um recurso antes de publicar.");

        erros.AddRange(ValidarGeral(SistemaRpgMapper.ToGeral(versao)));
        erros.AddRange(ValidarProgressao(SistemaRpgMapper.ToProgressao(versao)));
        erros.AddRange(ValidarExploracao(SistemaRpgMapper.ToExploracao(versao)));
        erros.AddRange(ValidarCombate(SistemaRpgMapper.ToCombate(versao)));
        erros.AddRange(ValidarPoderes(SistemaRpgMapper.ToPoderes(versao)));
        erros.AddRange(ValidarSobrevivencia(SistemaRpgMapper.ToSobrevivencia(versao)));
        return erros.Distinct(StringComparer.Ordinal).ToList();
    }

    private static bool TemDuplicados(IEnumerable<string> codigos) =>
        codigos.GroupBy(c => c, StringComparer.OrdinalIgnoreCase).Any(g => g.Count() > 1);

    private static bool JsonValido(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return true;
        try
        {
            using JsonDocument _ = JsonDocument.Parse(json);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static void CriarModulosPadrao(SistemaVersao versao)
    {
        SistemaModuloTipo[] tipos =
        {
            SistemaModuloTipo.RegrasBase,
            SistemaModuloTipo.CriacaoPersonagem,
            SistemaModuloTipo.Progressao,
            SistemaModuloTipo.Exploracao,
            SistemaModuloTipo.Combate,
            SistemaModuloTipo.Poderes,
            SistemaModuloTipo.Sobrevivencia,
        };
        versao.Modulos = tipos.Select((tipo, index) => new SistemaModulo
        {
            TipoModulo = tipo,
            Habilitado = true,
            SchemaVersion = 1,
            Ordem = index + 1,
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.RegrasBase, new SistemaRpgConfiguration.RegrasGerais(), 1);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.CriacaoPersonagem, new SistemaRpgConfiguration.RegrasCriacao(), 2);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Progressao, new SistemaRpgConfiguration.RegrasProgressao(), 3);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Exploracao, new SistemaRpgConfiguration.RegrasExploracao(), 4);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Combate, new SistemaRpgConfiguration.RegrasCombate(), 5);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Poderes, new SistemaRpgConfiguration.RegrasPoderes(), 6);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Sobrevivencia, new SistemaRpgConfiguration.RegrasSobrevivencia(), 7);
    }

    private static void ClonarConfiguracao(SistemaVersao origem, SistemaVersao destino)
    {
        destino.Modulos = origem.Modulos.Select(m => new SistemaModulo
        {
            TipoModulo = m.TipoModulo,
            Habilitado = m.Habilitado,
            SchemaVersion = m.SchemaVersion,
            ConfiguracaoJson = m.ConfiguracaoJson,
            Ordem = m.Ordem,
        }).ToList();
        destino.Niveis = origem.Niveis.Select(n => new SistemaNivel
        {
            Nivel = n.Nivel, XpParaProximoNivel = n.XpParaProximoNivel, PontosNivel = n.PontosNivel,
            PontosAtributo = n.PontosAtributo, PontosSkill = n.PontosSkill, PontosUltimate = n.PontosUltimate,
            PermiteNovaMagia = n.PermiteNovaMagia, PermiteNovaSkill = n.PermiteNovaSkill,
            Observacao = n.Observacao, Ordem = n.Ordem,
        }).ToList();
        destino.MarcosNivel = origem.MarcosNivel.Select(m => new SistemaMarcoNivel
        {
            Nivel = m.Nivel, Codigo = m.Codigo, Nome = m.Nome, Descricao = m.Descricao,
            TipoRecompensa = m.TipoRecompensa, ConfiguracaoJson = m.ConfiguracaoJson, Ordem = m.Ordem,
        }).ToList();
        destino.FontesExperiencia = origem.FontesExperiencia.Select(f => new SistemaFonteExperiencia
        {
            Codigo = f.Codigo, Nome = f.Nome, TipoTeste = f.TipoTeste, Formula = f.Formula,
            ValorMinimo = f.ValorMinimo, ValorMaximo = f.ValorMaximo, UsaVantagem = f.UsaVantagem,
            Descricao = f.Descricao, ConfiguracaoJson = f.ConfiguracaoJson, Ordem = f.Ordem,
        }).ToList();
        destino.Racas = origem.Racas.Select(r => new SistemaRacaConfig
        {
            IdRaca = r.IdRaca, CodigoRaca = r.CodigoRaca, NomeExibicao = r.NomeExibicao, Jogavel = r.Jogavel,
            VidaBase = r.VidaBase, EstaminaBase = r.EstaminaBase, ManaBase = r.ManaBase,
            CapacidadeCargaBase = r.CapacidadeCargaBase, CodigoAtributoInicial = r.CodigoAtributoInicial,
            ConfiguracaoJson = r.ConfiguracaoJson, Ordem = r.Ordem,
            Passivas = r.Passivas.Select(p => new SistemaRacaPassiva
            {
                IdPassiva = p.IdPassiva, CodigoPassiva = p.CodigoPassiva, NomeExibicao = p.NomeExibicao,
                Variante = p.Variante, Ordem = p.Ordem, NivelDesbloqueio = p.NivelDesbloqueio,
            }).ToList(),
        }).ToList();
        destino.Atributos = origem.Atributos.Select(a => new SistemaAtributoConfig
        {
            CodigoAtributo = a.CodigoAtributo, Nome = a.Nome, Grupo = a.Grupo, ValorMinimo = a.ValorMinimo,
            ValorMaximoNatural = a.ValorMaximoNatural, ValorMaximoAbsoluto = a.ValorMaximoAbsoluto,
            ValorComum = a.ValorComum, FormulaTeste = a.FormulaTeste, LimiteUso = a.LimiteUso,
            TipoLimiteUso = a.TipoLimiteUso, Descricao = a.Descricao, Ordem = a.Ordem, Ativo = a.Ativo,
            ConfiguracaoJson = a.ConfiguracaoJson,
        }).ToList();
        destino.Recursos = origem.Recursos.Select(r => new SistemaRecursoConfig
        {
            Codigo = r.Codigo, Nome = r.Nome, ValorMinimo = r.ValorMinimo, ValorPadrao = r.ValorPadrao,
            ValorMaximo = r.ValorMaximo, PermiteValorNegativo = r.PermiteValorNegativo,
            RecuperacaoPadrao = r.RecuperacaoPadrao, RecuperacaoDescansoSimples = r.RecuperacaoDescansoSimples,
            RecuperacaoDescansoNormal = r.RecuperacaoDescansoNormal, RecuperacaoDescansoLongo = r.RecuperacaoDescansoLongo,
            CondicaoAoZerar = r.CondicaoAoZerar, FormulaValorInicial = r.FormulaValorInicial,
            FormulaValorMaximo = r.FormulaValorMaximo, Formula = r.Formula, Ordem = r.Ordem, Ativo = r.Ativo,
            ConfiguracaoJson = r.ConfiguracaoJson,
        }).ToList();
        destino.Movimento = origem.Movimento is null ? null : new SistemaMovimentoConfig
        {
            UsaGrid = origem.Movimento.UsaGrid, MetrosPorQuadrado = origem.Movimento.MetrosPorQuadrado,
            MovimentoGratuito = origem.Movimento.MovimentoGratuito,
            CustoEstaminaPorQuadrado = origem.Movimento.CustoEstaminaPorQuadrado,
            MaximoQuadradosTurno = origem.Movimento.MaximoQuadradosTurno,
            PermiteMoverAposAtaque = origem.Movimento.PermiteMoverAposAtaque,
            Observacoes = origem.Movimento.Observacoes, ConfiguracaoJson = origem.Movimento.ConfiguracaoJson,
        };
        destino.PontosAcao = origem.PontosAcao is null ? null : new SistemaPontosAcaoConfig
        {
            Habilitado = origem.PontosAcao.Habilitado, PontosPorTurno = origem.PontosAcao.PontosPorTurno,
            SegundosPorPonto = origem.PontosAcao.SegundosPorPonto, PermiteAcumular = origem.PontosAcao.PermiteAcumular,
            LimiteAcumulado = origem.PontosAcao.LimiteAcumulado, ConfiguracaoJson = origem.PontosAcao.ConfiguracaoJson,
        };
        destino.Acoes = origem.Acoes.Select(a => new SistemaAcaoConfig
        {
            Codigo = a.Codigo, Nome = a.Nome, Tipo = a.Tipo, CustoPontosAcao = a.CustoPontosAcao,
            CustoEstamina = a.CustoEstamina, CustoMana = a.CustoMana, EncerraTurno = a.EncerraTurno,
            PermiteCombo = a.PermiteCombo, ExigeAlvo = a.ExigeAlvo, Formula = a.Formula,
            Descricao = a.Descricao, Ordem = a.Ordem, ConfiguracaoJson = a.ConfiguracaoJson,
        }).ToList();
        destino.ResultadosDado = origem.ResultadosDado.Select(r => new SistemaResultadoDado
        {
            CodigoTeste = r.CodigoTeste, NomeTeste = r.NomeTeste, Dado = r.Dado,
            QuantidadeDados = r.QuantidadeDados, ResultadoMinimo = r.ResultadoMinimo,
            ResultadoMaximo = r.ResultadoMaximo, ExigeNatural = r.ExigeNatural,
            CodigoResultado = r.CodigoResultado, NomeResultado = r.NomeResultado,
            Descricao = r.Descricao, EfeitoJson = r.EfeitoJson, Ordem = r.Ordem,
        }).ToList();
        destino.TiposDano = origem.TiposDano.Select(t => new SistemaTipoDano
        {
            Codigo = t.Codigo, Nome = t.Nome, Descricao = t.Descricao, IgnoraArmadura = t.IgnoraArmadura,
            IgnoraProtecao = t.IgnoraProtecao, IgnoraEscudo = t.IgnoraEscudo, Periodico = t.Periodico,
            Area = t.Area, ConfiguracaoJson = t.ConfiguracaoJson, Ordem = t.Ordem,
        }).ToList();
        destino.TiposDefesa = origem.TiposDefesa.Select(t => new SistemaTipoDefesa
        {
            Codigo = t.Codigo, Nome = t.Nome, Descricao = t.Descricao, OrdemAplicacao = t.OrdemAplicacao,
            TipoComportamento = t.TipoComportamento, Formula = t.Formula,
            ConfiguracaoJson = t.ConfiguracaoJson, Ordem = t.Ordem,
        }).ToList();
        destino.TiposMagia = origem.TiposMagia.Select(t => new SistemaTipoMagia
        {
            Codigo = t.Codigo, Nome = t.Nome, Descricao = t.Descricao, Cor = t.Cor,
            Afinidade = t.Afinidade, CustoBase = t.CustoBase, Ordem = t.Ordem,
            ConfiguracaoJson = t.ConfiguracaoJson,
        }).ToList();
        destino.SkillConfig = origem.SkillConfig is null ? null : new SistemaSkillConfig
        {
            MaximoSkills = origem.SkillConfig.MaximoSkills, NivelMaximoSkill = origem.SkillConfig.NivelMaximoSkill,
            MaximoUltimates = origem.SkillConfig.MaximoUltimates,
            NivelDesbloqueioUltimate = origem.SkillConfig.NivelDesbloqueioUltimate,
            MaximoMagias = origem.SkillConfig.MaximoMagias, UsaCooldown = origem.SkillConfig.UsaCooldown,
            PermiteArtesEtericas = origem.SkillConfig.PermiteArtesEtericas,
            Observacoes = origem.SkillConfig.Observacoes, ConfiguracaoJson = origem.SkillConfig.ConfiguracaoJson,
        };
        destino.Condicoes = origem.Condicoes.Select(c => new SistemaCondicao
        {
            Codigo = c.Codigo, Nome = c.Nome, Descricao = c.Descricao, Tipo = c.Tipo,
            DuracaoPadrao = c.DuracaoPadrao, UnidadeDuracao = c.UnidadeDuracao, Empilhavel = c.Empilhavel,
            RemocaoAutomatica = c.RemocaoAutomatica, PermiteSobrescrever = c.PermiteSobrescrever,
            ValorPadrao = c.ValorPadrao, ConfiguracaoPadraoJson = c.ConfiguracaoPadraoJson, Ordem = c.Ordem,
        }).ToList();
        destino.Descansos = origem.Descansos.Select(d => new SistemaDescansoConfig
        {
            Tipo = d.Tipo, Nome = d.Nome, DuracaoMinimaMinutos = d.DuracaoMinimaMinutos,
            DuracaoMaximaMinutos = d.DuracaoMaximaMinutos, RecuperacaoVida = d.RecuperacaoVida,
            RecuperacaoMana = d.RecuperacaoMana, RecuperacaoEstamina = d.RecuperacaoEstamina,
            TipoRecuperacao = d.TipoRecuperacao, ExigeGuarda = d.ExigeGuarda,
            IntervaloTesteGuardaMinutos = d.IntervaloTesteGuardaMinutos,
            PermiteAtividades = d.PermiteAtividades, ConfiguracaoJson = d.ConfiguracaoJson, Ordem = d.Ordem,
        }).ToList();
        destino.Morte = origem.Morte is null ? null : new SistemaMorteConfig
        {
            LimiteBeiraDaMorte = origem.Morte.LimiteBeiraDaMorte,
            QuantidadeTestesCombate = origem.Morte.QuantidadeTestesCombate,
            QuantidadeTestesForaCombate = origem.Morte.QuantidadeTestesForaCombate,
            SucessosNecessarios = origem.Morte.SucessosNecessarios,
            DadoSobrevivencia = origem.Morte.DadoSobrevivencia,
            ResultadoMinimoSucesso = origem.Morte.ResultadoMinimoSucesso,
            LimiteVidaDesmembramento = origem.Morte.LimiteVidaDesmembramento,
            MultiplicadorDanoDesmembramento = origem.Morte.MultiplicadorDanoDesmembramento,
            LimiteVidaInstaKill = origem.Morte.LimiteVidaInstaKill,
            MultiplicadorDanoInstaKill = origem.Morte.MultiplicadorDanoInstaKill,
            PermiteEstabilizacaoManual = origem.Morte.PermiteEstabilizacaoManual,
            Observacoes = origem.Morte.Observacoes, ConfiguracaoJson = origem.Morte.ConfiguracaoJson,
        };
    }
}
