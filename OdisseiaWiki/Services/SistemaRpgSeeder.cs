using Microsoft.Extensions.Logging;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed partial class SistemaRpgSeeder : ISistemaRpgSeeder
{
    private readonly ISistemaRpgRepository _repository;
    private readonly ILogger<SistemaRpgSeeder> _logger;

    public SistemaRpgSeeder(ISistemaRpgRepository repository, ILogger<SistemaRpgSeeder> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        SistemaRpg? sistema = await _repository.GetByCodeAsync(
            SistemaRpgConfiguration.CodigoPadrao,
            tracked: true);
        SistemaVersao? versao = sistema is null
            ? null
            : await _repository.GetVersionByNumberAsync(
                sistema.IdSistemaRpg,
                SistemaRpgConfiguration.VersaoPadrao,
                tracked: true);

        if (sistema is { Ativo: false })
        {
            sistema.Ativo = true;
            sistema.DataAtualizacao = DateTime.UtcNow;
            await _repository.SaveChangesAsync();
            _logger.LogWarning(
                "O Sistema base ODISSEIA estava inativo e foi reativado pelo seed obrigatório.");
        }

        if (versao is null && sistema is not null && sistema.Versoes.Any(v => v.Status == SistemaVersaoStatus.Publicado))
        {
            _logger.LogWarning(
                "O sistema {Codigo} já possui uma versão publicada, mas não possui a versão base {Versao}. O seed não alterou o histórico.",
                SistemaRpgConfiguration.CodigoPadrao,
                SistemaRpgConfiguration.VersaoPadrao);
            return;
        }

        if (versao is null)
        {
            List<Raca> racas = await _repository.GetRacesAsync();
            List<Passiva> passivas = await _repository.GetPassivasAsync();
            await _repository.ExecuteInTransactionAsync(async () =>
            {
                sistema ??= new SistemaRpg
                {
                    Codigo = SistemaRpgConfiguration.CodigoPadrao,
                    Nome = "Odisseia — Insurgência",
                    Descricao = "Sistema oficial de regras do Odisseia, configurado a partir do Livro do Jogador.",
                    Ativo = true,
                    DataCriacao = DateTime.UtcNow,
                    DataAtualizacao = DateTime.UtcNow,
                };
                versao = CriarVersaoPadrao(sistema, racas, passivas);
                if (sistema.IdSistemaRpg == 0)
                {
                    sistema.Versoes.Add(versao);
                    await _repository.AddSystemAsync(sistema);
                }
                else
                {
                    await _repository.AddVersionAsync(versao);
                }
                await _repository.SaveChangesAsync();
                sistema.IdVersaoPublicada = versao.IdSistemaVersao;
                sistema.VersaoPublicada = versao;
                await _repository.SaveChangesAsync();
            });
            _logger.LogInformation("Sistema Odisseia 1.0 publicado pelo seed inicial.");
        }
        else if (versao.Status != SistemaVersaoStatus.Publicado && versao.Status != SistemaVersaoStatus.Arquivado)
        {
            _logger.LogWarning(
                "A versão Odisseia 1.0 já existe como rascunho. O seed não sobrescreveu a configuração administrativa.");
            return;
        }

        if (versao is null)
            return;

        // Complemento técnico do schema de itens: somente a publicação corrente
        // pode receber o backfill aditivo quando o catálogo inteiro está vazio.
        // Versões arquivadas permanecem historicamente imutáveis.
        bool podeComplementarPublicacaoAtual =
            versao.Status == SistemaVersaoStatus.Publicado &&
            sistema?.IdVersaoPublicada == versao.IdSistemaVersao;
        if (podeComplementarPublicacaoAtual)
        {
            SistemaVersao? versaoComCatalogo = await _repository.GetVersionAsync(
                versao.IdSistemaVersao,
                includeConfiguration: true,
                tracked: true);
            if (versaoComCatalogo is not null)
                versao = versaoComCatalogo;

            if (versao.ItemEscopos.Count == 0)
            {
                versao.ItemEscopos = CriarCatalogoItens();
                foreach (SistemaItemEscopo escopo in versao.ItemEscopos)
                {
                    escopo.IdSistemaVersao = versao.IdSistemaVersao;
                    escopo.SistemaVersao = versao;
                }
                await _repository.SaveChangesAsync();
                _logger.LogInformation(
                    "Catálogo técnico de itens adicionado de forma idempotente à publicação corrente Odisseia 1.0.");
            }
        }
        else if (versao.ItemEscopos.Count == 0)
        {
            _logger.LogWarning(
                "A versão histórica Odisseia 1.0 não possui catálogo de itens e foi preservada sem alterações; o runtime usará fallback legado.");
        }

        List<Mesa> mesasLegadas = await _repository.GetMesasWithoutVersionAsync();
        if (mesasLegadas.Count > 0)
        {
            foreach (Mesa mesa in mesasLegadas)
                mesa.IdSistemaVersao = versao.IdSistemaVersao;
            await _repository.SaveChangesAsync();
            _logger.LogInformation(
                "{Quantidade} mesas legadas foram fixadas na versão Odisseia 1.0.",
                mesasLegadas.Count);
        }
    }

    private static SistemaVersao CriarVersaoPadrao(
        SistemaRpg sistema,
        IReadOnlyCollection<Raca> racasExistentes,
        IReadOnlyCollection<Passiva> passivasExistentes)
    {
        DateTime agora = DateTime.UtcNow;
        SistemaVersao versao = new()
        {
            SistemaRpg = sistema,
            NumeroVersao = SistemaRpgConfiguration.VersaoPadrao,
            Status = SistemaVersaoStatus.Publicado,
            Changelog = "Versão inicial baseada no Livro do Jogador.",
            DataCriacao = agora,
            DataAtualizacao = agora,
            DataPublicacao = agora,
        };

        SistemaModuloTipo[] modulos =
        {
            SistemaModuloTipo.RegrasBase,
            SistemaModuloTipo.CriacaoPersonagem,
            SistemaModuloTipo.Progressao,
            SistemaModuloTipo.Exploracao,
            SistemaModuloTipo.Combate,
            SistemaModuloTipo.Poderes,
            SistemaModuloTipo.Sobrevivencia,
        };
        versao.Modulos = modulos.Select((tipo, indice) => new SistemaModulo
        {
            TipoModulo = tipo,
            Habilitado = true,
            SchemaVersion = 1,
            Ordem = indice + 1,
        }).ToList();
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.RegrasBase, new SistemaRpgConfiguration.RegrasGerais
        {
            DadoTesteGeral = "D6",
            UsaVantagem = true,
            UsaDesvantagem = true,
            CriticoNatural = 6,
            FalhaCriticaNatural = 1,
            RegraArredondamento = "Resultados fracionários são arredondados para baixo, salvo regra específica.",
            RegraEspecificaPrevalece = true,
            AutoridadeMestre = true,
            ObservacoesRegrasFundamentais = "Role os dados, some modificadores e depois aplique bônus ou penalidades. Em vantagem use o maior dado; em desvantagem, o menor.",
        }, 1);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.CriacaoPersonagem, new SistemaRpgConfiguration.RegrasCriacao
        {
            NivelInicial = 1,
            PontosIniciais = 10,
            PontosAtributoIniciais = 10,
            PontosSkillIniciais = 0,
            MaximoSkillsIniciais = 1,
            MaximoMagiasIniciais = 1,
            MaximoUltimatesIniciais = 0,
        }, 2);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Progressao, new SistemaRpgConfiguration.RegrasProgressao
        {
            NivelMaximo = 20,
            PermiteXpExcedente = true,
        }, 3);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Exploracao, new SistemaRpgConfiguration.RegrasExploracao
        {
            CargaUsaLimite = true,
            PenalidadeExcessoCarga = "Ao exceder a capacidade de carga, a estamina máxima é reduzida em 50% até remover o excesso.",
            FurtividadeObservacoes = "Discrição base 0. Teste: 1D10 + Discrição contra dificuldade definida pelo mestre (normalmente 3 a 10). Em movimento furtivo, teste a cada 3 quadrados (6 metros), ao entrar em curta distância e nas demais situações descritas no livro.",
        }, 4);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Combate, new SistemaRpgConfiguration.RegrasCombate
        {
            UsaIniciativa = true,
            FormulaIniciativa = "1D6 + Agilidade + modificadores",
            SegundosPorTurno = 100,
            RegraDeclaracaoAcoes = "Ações e combos devem ser declarados antes da execução; ataques normalmente encerram o turno.",
        }, 5);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Poderes, new SistemaRpgConfiguration.RegrasPoderes
        {
            LimiteMagias = 15,
            PermiteMagiasCompostas = true,
            RegraAprendizadoMagia = "É possível aprender uma magia básica por nível, sem acumular slots não usados. Novos tipos exigem mestre por 1 dia no RPG ou livro e prática por 1 sessão completa; uma magia com mais de um tipo exige conhecer todos eles.",
        }, 6);
        SistemaRpgConfiguration.GravarRegras(versao, SistemaModuloTipo.Sobrevivencia, new SistemaRpgConfiguration.RegrasSobrevivencia
        {
            RegraLoot = "Cada inimigo ou recipiente pode ser saqueado uma vez; role 1D8 e considere o local, o alvo e a narrativa.",
            RegraRefeicoes = "Refeições simples concedem o bônus do alimento; refeições completas combinam comida e bebida e aumentam em 50% o bônus da comida.",
        }, 7);

        versao.Niveis = Enumerable.Range(1, 20).Select(nivel => new SistemaNivel
        {
            Nivel = nivel,
            XpParaProximoNivel = nivel switch
            {
                <= 6 => 10,
                <= 9 => 20,
                <= 12 => 25,
                <= 15 => 30,
                <= 19 => 40,
                _ => 0,
            },
            PontosNivel = nivel == 1 ? 0 : 1,
            PontosAtributo = 0,
            PontosSkill = 0,
            PontosUltimate = 0,
            PermiteNovaMagia = nivel > 1,
            PermiteNovaSkill = nivel > 1,
            Ordem = nivel,
            Observacao = nivel == 1
                ? "Nível inicial."
                : "Recebe 1 ponto de nível para distribuir entre atributo, skill ou ultimate. O direito a uma nova magia e a uma nova skill neste nível não é acumulativo.",
        }).ToList();
        versao.MarcosNivel = new List<SistemaMarcoNivel>
        {
            Marco(7, "ULTIMATE", "Desbloqueio da ultimate", "Ultimate", 1,
                "O personagem passa a ter direito à sua ultimate."),
            Marco(10, "PASSIVA_RACIAL", "Passiva racial", "Passiva racial", 2,
                "O personagem pode escolher uma passiva de sua raça ou variação."),
            Marco(13, "PROFICIENCIA", "Nova proficiência", "Proficiência", 3,
                "O personagem pode escolher uma nova proficiência."),
            Marco(16, "MAESTRIA_TATICA", "Maestria Tática", "Maestria Tática", 4,
                "Uma vez por combate, permite uma ação bônus sem gastar estamina, exceto combos, ou um turno de preparo com resposta instantânea."),
            Marco(20, "MAESTRIA_ARMAS", "Maestria em Armas", "Maestria em Armas", 5,
                "Escolha uma categoria de arma ou elemento mágico: custo total de estamina/mana pela metade, arredondado para baixo, e dano final +20%, arredondado para cima."),
        };
        versao.FontesExperiencia = new List<SistemaFonteExperiencia>
        {
            FonteXp("COMBATE_NORMAL", "Combate normal", "Fixo", "1", 1, 1, false,
                "Cada jogador recebe 1 XP por combate real, contado por grupo de inimigos. Um abate furtivo sem reação concede esse 1 XP apenas ao atacante.", 1),
            FonteXp("MINI_BOSS", "Combate com mini boss", "D4 por paridade", "2D4, manter o melhor; ímpar = 1 XP, par = 2 XP", 1, 2, true,
                "Teste com vantagem; usa-se o dado de melhor resultado.", 2),
            FonteXp("BOSS", "Combate com boss", "D4", "1D4", 1, 4, false,
                "O resultado natural do D4 é a quantidade de XP recebida.", 3),
            FonteXp("SESSAO_SEM_COMBATE", "Sessão sem combate", "D4", "1D4", 1, 4, false,
                "Sem combate na sessão, cada jogador recebe o resultado do D4.", 4),
            FonteXp("MVP_SESSAO", "MVP da sessão", "D4", "1D4", 1, 4, false,
                "Quando houve combate, somente o MVP recebe a experiência de fim de sessão; o teste de MVP substitui o teste comum de encerramento.", 5),
            FonteXp("MISSAO_SECUNDARIA", "Missão secundária", "D4 por paridade", "1D4; ímpar = 1 XP, par = 2 XP", 1, 2, false,
                "Aplicado a cada jogador ao concluir a missão.", 6),
            FonteXp("MISSAO_CONTRATO", "Missão de contrato", "D4 por paridade", "2D4, manter o melhor; ímpar = 1 XP, par = 2 XP", 1, 2, true,
                "Aplicado a cada jogador na entrega do contrato.", 7),
            FonteXp("MISSAO_PRINCIPAL", "Missão principal", "D6", "1D6 com vantagem, manter o melhor", 1, 6, true,
                "O resultado do dado mantido é a quantidade de XP recebida por cada jogador.", 8),
        };

        versao.Atributos = CriarAtributos();
        versao.Recursos = CriarRecursos();
        versao.Racas = CriarRacas(racasExistentes, passivasExistentes);
        versao.Movimento = new SistemaMovimentoConfig
        {
            UsaGrid = true,
            MetrosPorQuadrado = 2,
            MovimentoGratuito = 1,
            CustoEstaminaPorQuadrado = 5,
            MaximoQuadradosTurno = 10,
            PermiteMoverAposAtaque = false,
            Observacoes = "O primeiro movimento simples do turno é gratuito; quadrados adicionais consomem estamina.",
        };
        versao.PontosAcao = new SistemaPontosAcaoConfig
        {
            Habilitado = true,
            PontosPorTurno = 10,
            SegundosPorPonto = 10,
            PermiteAcumular = false,
            LimiteAcumulado = 10,
        };
        versao.Acoes = new List<SistemaAcaoConfig>
        {
            Acao("MOVER", "Mover", "Movimento", 0.5m, 0, false, 1, "Custo por quadrado de 2 metros."),
            Acao("ATACAR", "Ataque básico", "Combate", 1, 0, true, 2, "O custo de estamina varia: o primeiro ataque melee custa 10 e cada adicional custa 10; o primeiro ataque a distância custa 0 e cada adicional custa 5."),
            Acao("ATAQUE_ESPECIAL", "Ataque especial", "Combate", 2, 0, true, 3, "O custo de recurso é definido pela arma, magia, skill ou regra específica."),
            Acao("INVESTIGAR", "Investigar", "Exploração", 2, 0, false, 4, "Teste de percepção, inteligência ou habilidade equivalente."),
            Acao("INTERAGIR", "Interagir", "Exploração", 0.5m, 0, false, 5, "Discutir, pegar ou usar um objeto simples."),
            Acao("USAR_ITEM", "Usar item", "Item", 1, 0, false, 6, null),
        };

        versao.ResultadosDado = CriarResultadosDado();
        versao.TiposDano = CriarTiposDano();
        versao.TiposDefesa = new List<SistemaTipoDefesa>
        {
            new() { Codigo = "ESCUDO", Nome = "Escudo", Descricao = "Defesa temporária que bloqueia um único dano antes de se quebrar.", OrdemAplicacao = 1, TipoComportamento = "BloqueiaUmDano", ConfiguracaoJson = "{\"ordemComOutrasDefesas\":\"O livro não define uma ordem universal; mantenha configurável.\"}", Ordem = 1 },
            new() { Codigo = "PROTECAO", Nome = "Proteção", Descricao = "Sobrevida defensiva que absorve dano e se desgasta; o excedente segue para a vida.", OrdemAplicacao = 2, TipoComportamento = "AbsorveEDesgasta", ConfiguracaoJson = "{\"ordemComOutrasDefesas\":\"O livro não define uma ordem universal; mantenha configurável.\"}", Ordem = 2 },
            new() { Codigo = "ARMADURA", Nome = "Armadura", Descricao = "Defesa constante que absorve uma quantidade em cada acerto e pode quebrar sob dano intenso.", OrdemAplicacao = 3, TipoComportamento = "AbsorcaoConstante", ConfiguracaoJson = "{\"ordemComOutrasDefesas\":\"O livro não define uma ordem universal; mantenha configurável.\"}", Ordem = 3 },
        };
        versao.TiposMagia = new List<SistemaTipoMagia>
        {
            TipoMagia("FOGO", "Fogo", "Elemental", 1),
            TipoMagia("AGUA", "Água", "Elemental", 2),
            TipoMagia("AR", "Ar", "Elemental", 3),
            TipoMagia("TERRA", "Terra", "Elemental", 4),
            TipoMagia("LUZ", "Luz", "Geral", 5),
            TipoMagia("ESCURIDAO", "Escuridão", "Geral", 6),
            TipoMagia("ESPACIAL", "Espacial", "Geral", 7),
            TipoMagia("TRANSFIGURACAO", "Transfiguração", "Geral", 8),
            TipoMagia("INVOCACAO", "Invocação", "Geral", 9),
        };
        versao.SkillConfig = new SistemaSkillConfig
        {
            MaximoSkills = 4,
            NivelMaximoSkill = 4,
            MaximoUltimates = 1,
            NivelDesbloqueioUltimate = 7,
            MaximoMagias = 15,
            UsaCooldown = true,
            PermiteArtesEtericas = true,
            Observacoes = "São 4 slots de skill e 1 de ultimate. Skills começam no nível 1 e podem chegar ao nível 4. O Éter não é magia, mas suas Artes Etéricas usam mana e ocupam slots de skill/ultimate.",
        };
        versao.Condicoes = CriarCondicoes();
        versao.ItemEscopos = CriarCatalogoItens();
        versao.Descansos = new List<SistemaDescansoConfig>
        {
            new() { Tipo = "SIMPLES", Nome = "Descanso simples/curto", DuracaoMinimaMinutos = 0, DuracaoMaximaMinutos = 0, RecuperacaoVida = 0, RecuperacaoMana = 10, RecuperacaoEstamina = 10, TipoRecuperacao = SistemaRecuperacaoTipo.ValorFixo, ExigeGuarda = false, PermiteAtividades = false, ConfiguracaoJson = "{\"duracao\":\"1 turno\",\"aplicacaoRecuperacao\":\"no próximo turno\"}", Ordem = 1 },
            new() { Tipo = "NORMAL", Nome = "Descanso normal", DuracaoMinimaMinutos = 60, DuracaoMaximaMinutos = 180, RecuperacaoVida = 0, RecuperacaoMana = 100, RecuperacaoEstamina = 100, TipoRecuperacao = SistemaRecuperacaoTipo.Percentual, ExigeGuarda = true, IntervaloTesteGuardaMinutos = 120, PermiteAtividades = true, ConfiguracaoJson = "{\"recuperacaoComAtividade\":\"50% da estatística gasta durante a atividade, conforme avaliação do mestre\",\"recuperacaoDaGuardaPercentual\":50,\"testeGuarda\":\"1D6 a cada 2 horas\"}", Ordem = 2 },
            new() { Tipo = "LONGO", Nome = "Descanso longo", DuracaoMinimaMinutos = 240, DuracaoMaximaMinutos = null, RecuperacaoVida = 0, RecuperacaoMana = 100, RecuperacaoEstamina = 100, TipoRecuperacao = SistemaRecuperacaoTipo.Percentual, ExigeGuarda = true, IntervaloTesteGuardaMinutos = 120, PermiteAtividades = true, ConfiguracaoJson = "{\"testeGuarda\":\"1D6 a cada 2 horas\",\"recuperacaoVida\":\"somente conforme itens ou refeições\"}", Ordem = 3 },
        };
        versao.Morte = new SistemaMorteConfig
        {
            LimiteBeiraDaMorte = 0,
            QuantidadeTestesCombate = 5,
            QuantidadeTestesForaCombate = 3,
            SucessosNecessarios = 3,
            DadoSobrevivencia = "D6",
            ResultadoMinimoSucesso = 4,
            LimiteVidaDesmembramento = 20,
            MultiplicadorDanoDesmembramento = 2,
            LimiteVidaInstaKill = 50,
            MultiplicadorDanoInstaKill = 5,
            PermiteEstabilizacaoManual = true,
            Observacoes = "Limites de vida são percentuais da vida base. Em combate são 5D6 sem atributos, exigindo 3 sucessos para sobreviver ao turno; fora de combate são 3D6 por hora, exigindo maioria. Para estabilizar e sair de À Beira da Morte, o personagem precisa passar em todos os testes, com possível ajuda dos companheiros. Desmembramento e insta kill exigem ainda um teste normal de Resistência; a falha aplica o efeito.",
            ConfiguracaoJson = "{\"limitesVidaEmPercentual\":true,\"sucessosForaCombate\":2,\"intervaloForaCombateMinutos\":60,\"testeDesmembramento\":\"1D6 + Resistência > 6\",\"testeInstaKill\":\"1D6 + Resistência > 6\"}",
        };
        return versao;
    }

    private static List<SistemaAtributoConfig> CriarAtributos()
    {
        string[] principais = { "Resistência", "Agilidade", "Sabedoria", "Precisão", "Força" };
        string[] secundarios = { "Lábia", "Percepção", "Ameaça", "Coragem", "Sanidade", "Inteligência" };
        List<SistemaAtributoConfig> resultado = new();
        foreach ((string nome, int indice) in principais.Concat(secundarios).Select((nome, indice) => (nome, indice)))
        {
            bool principal = indice < principais.Length;
            resultado.Add(new SistemaAtributoConfig
            {
                CodigoAtributo = SistemaRpgConfiguration.NormalizarCodigo(nome, nome),
                Nome = nome,
                Grupo = principal ? SistemaAtributoGrupo.Principal : SistemaAtributoGrupo.Secundario,
                ValorMinimo = 0,
                ValorMaximoNatural = 5,
                ValorMaximoAbsoluto = 6,
                ValorComum = 3,
                FormulaTeste = "1D6 + atributo; o resultado deve ser maior que 6 quando a regra não especificar outro limite.",
                LimiteUso = principal ? 1 : null,
                TipoLimiteUso = principal ? "Por combate" : null,
                Ordem = indice + 1,
                Ativo = true,
            });
        }
        return resultado;
    }

    private static List<SistemaRecursoConfig> CriarRecursos() => new()
    {
        new() { Codigo = "VIDA", Nome = "Vida", ValorMinimo = 0, ValorPadrao = 1000, PermiteValorNegativo = false, RecuperacaoPadrao = 0, FormulaValorInicial = "Vida base da raça", FormulaValorMaximo = "Vida base da raça e modificadores", Ordem = 1, Ativo = true },
        new() { Codigo = "ESTAMINA", Nome = "Estamina", ValorMinimo = 0, ValorPadrao = 75, PermiteValorNegativo = false, RecuperacaoPadrao = 0, RecuperacaoDescansoSimples = 10, RecuperacaoDescansoNormal = 100, RecuperacaoDescansoLongo = 100, CondicaoAoZerar = "FADIGA", FormulaValorInicial = "Estamina base da raça", FormulaValorMaximo = "Estamina base da raça e modificadores", Ordem = 2, Ativo = true },
        new() { Codigo = "MANA", Nome = "Mana", ValorMinimo = 0, ValorPadrao = 50, PermiteValorNegativo = false, RecuperacaoPadrao = 0, RecuperacaoDescansoSimples = 10, RecuperacaoDescansoNormal = 100, RecuperacaoDescansoLongo = 100, CondicaoAoZerar = "DEPENDENCIA_MANA", FormulaValorInicial = "Mana base da raça", FormulaValorMaximo = "Mana base da raça e modificadores", Ordem = 3, Ativo = true },
        new() { Codigo = "CAPACIDADE_CARGA", Nome = "Capacidade de carga", ValorMinimo = 0, ValorPadrao = 15, PermiteValorNegativo = false, RecuperacaoPadrao = 0, FormulaValorInicial = "Capacidade base da raça", FormulaValorMaximo = "Capacidade base da raça e modificadores", Ordem = 4, Ativo = true },
    };

    private static List<SistemaRacaConfig> CriarRacas(
        IReadOnlyCollection<Raca> existentes,
        IReadOnlyCollection<Passiva> passivasExistentes)
    {
        (string Nome, int Vida, int Estamina, int Mana, int Carga, string Atributo)[] dados =
        {
            ("Humanos", 1000, 75, 50, 15, "RESISTENCIA"),
            ("Elfos", 1000, 75, 75, 10, "SABEDORIA"),
            ("Orcs", 1500, 75, 50, 25, "RESISTENCIA"),
            ("Anões", 1250, 80, 40, 20, "SABEDORIA"),
            ("Zebrak", 1200, 75, 75, 15, "AGILIDADE"),
            ("Twi'lek", 1100, 75, 50, 15, "AGILIDADE"),
            ("Yod", 1000, 40, 85, 10, "SABEDORIA"),
            ("Android", 1000, 120, 0, 15, "AGILIDADE"),
            ("Robôs", 1500, 200, 0, 30, "RESISTENCIA"),
            ("Cyborgue", 1250, 0, 0, 10, "RESISTENCIA"),
        };
        return dados.Select((dado, indice) =>
        {
            string codigo = SistemaRpgConfiguration.NormalizarCodigo(dado.Nome, dado.Nome);
            Raca? existente = existentes.FirstOrDefault(r =>
                SistemaRpgConfiguration.NormalizarCodigo(r.Nome, r.Nome) == codigo);
            SistemaRacaConfig config = new()
            {
                IdRaca = existente?.Idraca,
                CodigoRaca = codigo,
                NomeExibicao = dado.Nome,
                Jogavel = true,
                VidaBase = dado.Vida,
                EstaminaBase = dado.Estamina,
                ManaBase = dado.Mana,
                CapacidadeCargaBase = dado.Carga,
                CodigoAtributoInicial = dado.Atributo,
                Ordem = indice + 1,
            };
            if (codigo == "CYBORGUE")
            {
                config.ConfiguracaoJson = "{\"nivelDesbloqueio\":10,\"observacoes\":\"HP 1250 e CC 10. Estamina = estamina da raça de origem + 10 por prótese; mana = mana da raça de origem - 10 por prótese. Não possui passiva própria: escolhe uma da raça de origem. Os valores zero de estamina e mana são sentinelas, não totais finais.\"}";
            }
            else
            {
                config.ConfiguracaoJson = "{\"nivelDesbloqueio\":10,\"observacoes\":\"No nível 10, escolha uma passiva compatível com a raça ou sua variação. Bônus em testes não alteram o valor base do atributo.\"}";
                config.Passivas = CriarPassivasRaciais(codigo, passivasExistentes);
            }
            return config;
        }).ToList();
    }

    private static List<SistemaResultadoDado> CriarResultadosDado()
    {
        List<SistemaResultadoDado> resultados = new();
        (int Min, int Max, string Codigo, string Nome)[] ataque =
        {
            (1, 1, "FALHA_CRITICA", "Falha crítica"),
            (2, 10, "ERRO", "Erro"),
            (11, 17, "ACERTO", "Acerto"),
            (18, 19, "ACERTO_PRECISO", "Acerto preciso"),
            (20, 20, "CRITICO", "Crítico"),
        };
        resultados.AddRange(ataque.Select((faixa, indice) => new SistemaResultadoDado
        {
            CodigoTeste = "ATAQUE_COMUM",
            NomeTeste = "Ataque comum",
            Dado = "D20",
            QuantidadeDados = 1,
            ResultadoMinimo = faixa.Min,
            ResultadoMaximo = faixa.Max,
            ExigeNatural = faixa.Min == faixa.Max && (faixa.Min == 1 || faixa.Min == 20),
            CodigoResultado = faixa.Codigo,
            NomeResultado = faixa.Nome,
            Descricao = faixa.Codigo switch
            {
                "FALHA_CRITICA" => "Falha com consequência negativa imediata, podendo permitir reação do alvo.",
                "ERRO" => "O ataque ou ação falha e não causa dano.",
                "ACERTO" => "Acerto normal, aplicando dano base e modificadores correspondentes.",
                "ACERTO_PRECISO" => "Escolha um benefício: +50 de dano por ataque, quebrar a defesa, atingir parte específica ou mover até 2 quadrados sem estamina.",
                "CRITICO" => "Dobra o dano; efeitos específicos da arma podem ser aplicados.",
                _ => null,
            },
            Ordem = indice + 1,
        }));
        resultados.AddRange(new[]
        {
            new SistemaResultadoDado { CodigoTeste = "TESTE_GERAL", NomeTeste = "Teste geral", Dado = "D6", QuantidadeDados = 1, ResultadoMinimo = 1, ResultadoMaximo = 3, ExigeNatural = true, CodigoResultado = "FALHA", NomeResultado = "Falha", Ordem = 10 },
            new SistemaResultadoDado { CodigoTeste = "TESTE_GERAL", NomeTeste = "Teste geral", Dado = "D6", QuantidadeDados = 1, ResultadoMinimo = 4, ResultadoMaximo = 6, ExigeNatural = true, CodigoResultado = "SUCESSO", NomeResultado = "Sucesso", Ordem = 11 },
            new SistemaResultadoDado { CodigoTeste = "TESTE_ATRIBUTO", NomeTeste = "Teste de atributo", Dado = "D6", QuantidadeDados = 1, ResultadoMinimo = 1, ResultadoMaximo = 6, ExigeNatural = false, CodigoResultado = "FORMULA", NomeResultado = "Aplicar fórmula", Descricao = "Some o atributo; o resultado geral deve ser maior que 6. Em teste conjunto, some os atributos e um único D6; o total deve ser maior que 12.", Ordem = 12 },
            new SistemaResultadoDado { CodigoTeste = "SOBREVIVENCIA", NomeTeste = "Sobrevivência", Dado = "D6", QuantidadeDados = 1, ResultadoMinimo = 1, ResultadoMaximo = 3, ExigeNatural = true, CodigoResultado = "FALHA", NomeResultado = "Falha", Ordem = 13 },
            new SistemaResultadoDado { CodigoTeste = "SOBREVIVENCIA", NomeTeste = "Sobrevivência", Dado = "D6", QuantidadeDados = 1, ResultadoMinimo = 4, ResultadoMaximo = 6, ExigeNatural = true, CodigoResultado = "SUCESSO", NomeResultado = "Sucesso", Ordem = 14 },
        });
        return resultados;
    }

    private static List<SistemaTipoDano> CriarTiposDano()
    {
        (string Codigo, string Nome, string Descricao, bool IgnoraDefesas, bool Periodico, bool Area, string? ConfiguracaoJson)[] dados =
        {
            ("CORTANTE", "Dano cortante", "Ferimentos causados por espadas, facas ou lâminas.", false, false, false, null),
            ("IMPACTO_PROJETIL", "Impacto de projétil", "Impacto direto de balas, tiros, flechas e outros projéteis.", false, false, false, null),
            ("PERFURACAO", "Dano de perfuração", "Ataques que penetram algum tipo de proteção ou resistência; a defesa ignorada depende da regra específica.", false, false, false, null),
            ("CONTINUO", "Dano contínuo", "Efeito persistente, como as queimaduras de um lança-chamas.", false, true, false, null),
            ("IMPACTO", "Dano de impacto", "Grande impacto físico, como martelos ou socos.", false, false, false, null),
            ("MAGICO", "Dano mágico", "Dano de magias ou habilidades sobrenaturais.", false, false, false, null),
            ("AREA", "Dano em área", "Ataque que afeta uma área, como explosões ou magias de área.", false, false, true, null),
            ("VERDADEIRO", "Dano verdadeiro", "Ignora todos os tipos de defesa e atinge diretamente a vida.", true, false, false, null),
            ("QUEDA", "Dano de queda", "É um dano verdadeiro. O livro fixa 4 m = 100, 8 m = 300 e 12 m = 900, mas sua regra textual de triplicar diverge do exemplo de 16 m = 2100; mantenha a progressão editável.", true, false, false, "{\"valoresConfirmados\":{\"4\":100,\"8\":300,\"12\":900},\"exemploDivergente\":{\"16\":2100}}"),
        };
        return dados.Select((dado, indice) => new SistemaTipoDano
        {
            Codigo = dado.Codigo,
            Nome = dado.Nome,
            Descricao = dado.Descricao,
            IgnoraArmadura = dado.IgnoraDefesas,
            IgnoraProtecao = dado.IgnoraDefesas,
            IgnoraEscudo = dado.IgnoraDefesas,
            Periodico = dado.Periodico,
            Area = dado.Area,
            ConfiguracaoJson = dado.ConfiguracaoJson,
            Ordem = indice + 1,
        }).ToList();
    }

    private static List<SistemaCondicao> CriarCondicoes()
    {
        (string Nome, string Tipo, string Descricao, int? Duracao, bool RemocaoAutomatica, string? ConfiguracaoJson)[] dados =
        {
            ("Fadiga", "Físico", "Ao zerar a estamina, reduz a estamina máxima em 25% até pelo menos um descanso normal.", null, false, "{\"reducaoEstaminaMaximaPercentual\":25,\"removeCom\":\"Descanso normal ou superior\"}"),
            ("Dependência de mana", "Mágico", "Ao zerar a mana, impede ações mágicas e recuperação natural por 2 turnos; depois disso o personagem pode descansar para voltar a recuperar mana.", 2, true, "{\"bloqueiaAcoesMagicas\":true,\"bloqueiaRecuperacaoNatural\":true}"),
            ("Sangramento", "Dano periódico", "Perde vida por turno; quantidade, duração e cura dependem da origem e do mestre.", null, false, null),
            ("Queimando", "Dano periódico", "Perde vida por turno e pode sofrer penalidades; valores e duração dependem da origem e do mestre.", null, false, null),
            ("Envenenamento", "Dano periódico", "Perde vida por turno e pode sofrer penalidades; antídotos, magias ou duração definida podem remover a condição.", null, false, null),
            ("Cegueira temporária/parcial", "Sensorial", "Aplica penalidades em ações dependentes da visão, especialmente testes de precisão, conforme o contexto.", null, false, null),
            ("Lesão", "Físico", "Pode penalizar atributos físicos e impedir habilidades ou ações; efeito definido pela origem.", null, false, null),
            ("Mal estar", "Físico", "Pode penalizar atributos físicos e mentais e causar perda gradual de vida.", null, false, null),
            ("Calor extremo/frio extremo", "Ambiental", "Pode reduzir vida ou estamina gradualmente e penalizar testes de atributos, conforme ambiente e mestre.", null, false, null),
            ("Stun", "Controle", "Impede o personagem de agir pela duração definida pela origem do efeito.", null, false, null),
            ("Confusão", "Psicológico", "Pode provocar ações aleatórias, inclusive contra aliados ou contra si mesmo.", null, false, null),
            ("Medo", "Psicológico", "Impede aproximação da fonte e pode penalizar testes; normalmente exige teste genérico de resistência ou remoção da fonte.", null, false, null),
            ("Vício", "Psicológico", "Dependência de substância com penalidades e abstinência; testes, intervalo e cura dependem da substância e do mestre.", null, false, null),
            ("Maldição", "Mágico", "Efeito sobrenatural variável; sua remoção pode exigir encontrar a fonte ou realizar um ritual.", null, false, null),
        };
        return dados.Select((dado, indice) => new SistemaCondicao
        {
            Codigo = SistemaRpgConfiguration.NormalizarCodigo(dado.Nome, dado.Nome),
            Nome = dado.Nome,
            Tipo = dado.Tipo,
            Descricao = dado.Descricao,
            DuracaoPadrao = dado.Duracao,
            UnidadeDuracao = SistemaUnidadeDuracao.Turno,
            Empilhavel = false,
            RemocaoAutomatica = dado.RemocaoAutomatica,
            PermiteSobrescrever = true,
            ConfiguracaoPadraoJson = dado.ConfiguracaoJson,
            Ordem = indice + 1,
        }).ToList();
    }

    private static List<SistemaRacaPassiva> CriarPassivasRaciais(
        string codigoRaca,
        IReadOnlyCollection<Passiva> passivasExistentes)
    {
        (string Nome, string? Variante)[] dados = codigoRaca switch
        {
            "HUMANOS" =>
            [
                ("Adaptabilidade", null),
                ("Conexões Sociais", null),
                ("Versatilidade", null),
            ],
            "ELFOS" =>
            [
                ("Elegância Sombria", "Elfo Negro"),
                ("Toque da Melancolia", "Elfo Negro"),
                ("Olhar Perspicaz", "Elfo Branco"),
                ("Graça Etérea", "Elfo Branco"),
                ("Ligação Natural", "Alto Elfo"),
                ("Visão Aguçada", "Alto Elfo"),
            ],
            "ORCS" =>
            [
                ("Força Brutal", "Orc Brutorquiano"),
                ("Espírito Tribal", "Orc Brutorquiano"),
                ("Determinação Guerreira", "Hominorc"),
                ("Um por todos e todos por um", "Hominorc"),
            ],
            "ANOES" =>
            [
                ("Engenhosidade Anã", null),
                ("Resistência Férrea", null),
                ("Aversão Mágica", null),
            ],
            "ZEBRAK" =>
            [
                ("Explorador Intrépido", null),
                ("Sentido Galáctico", null),
                ("Resistência Cósmica", null),
            ],
            "TWI_LEK" =>
            [
                ("Harmonia Cultural", "Twi'lek"),
                ("Harmonia Serena", "Twi'lek"),
                ("Herança Cultural", "Twi'lek Real"),
                ("Equilíbrio Espiritual", "Twi'lek Real"),
            ],
            "YOD" =>
            [
                ("Sabedoria Ancestral", null),
                ("Energia da Meditação", null),
                ("Toque da Força", null),
            ],
            "ANDROID" =>
            [
                ("Resistência Cibernética", null),
                ("Lógica Inabalável", null),
                ("Simulação Humana", null),
            ],
            "ROBOS" =>
            [
                ("Construção Avançada", null),
                ("Blindagem Mecânica", null),
                ("Sincronia de Equipe", null),
            ],
            _ => [],
        };

        return dados.Select((dado, indice) =>
        {
            string codigoPassiva = SistemaRpgConfiguration.NormalizarCodigo(dado.Nome, dado.Nome);
            Passiva? existente = passivasExistentes.FirstOrDefault(passiva =>
                SistemaRpgConfiguration.NormalizarCodigo(passiva.Nome, passiva.Nome) == codigoPassiva);
            return new SistemaRacaPassiva
            {
                IdPassiva = existente?.Idpassiva,
                CodigoPassiva = codigoPassiva,
                NomeExibicao = dado.Nome,
                Variante = dado.Variante,
                NivelDesbloqueio = 10,
                Ordem = indice + 1,
            };
        }).ToList();
    }

    private static SistemaFonteExperiencia FonteXp(
        string codigo,
        string nome,
        string tipoTeste,
        string formula,
        int valorMinimo,
        int valorMaximo,
        bool usaVantagem,
        string descricao,
        int ordem) => new()
    {
        Codigo = codigo,
        Nome = nome,
        TipoTeste = tipoTeste,
        Formula = formula,
        ValorMinimo = valorMinimo,
        ValorMaximo = valorMaximo,
        UsaVantagem = usaVantagem,
        Descricao = descricao,
        Ordem = ordem,
    };

    private static SistemaTipoMagia TipoMagia(string codigo, string nome, string afinidade, int ordem) => new()
    {
        Codigo = codigo,
        Nome = nome,
        Afinidade = afinidade,
        Descricao = $"Tipo de magia {afinidade.ToLowerInvariant()}; o custo é definido por cada magia, sem custo-base universal no livro.",
        CustoBase = 0,
        Ordem = ordem,
    };

    private static SistemaMarcoNivel Marco(
        int nivel,
        string codigo,
        string nome,
        string recompensa,
        int ordem,
        string descricao) => new()
    {
        Nivel = nivel,
        Codigo = codigo,
        Nome = nome,
        TipoRecompensa = recompensa,
        Descricao = descricao,
        Ordem = ordem,
    };

    private static SistemaAcaoConfig Acao(
        string codigo,
        string nome,
        string tipo,
        decimal custoPa,
        decimal custoEstamina,
        bool encerraTurno,
        int ordem,
        string? descricao) => new()
    {
        Codigo = codigo,
        Nome = nome,
        Tipo = tipo,
        CustoPontosAcao = custoPa,
        CustoEstamina = custoEstamina,
        CustoMana = 0,
        EncerraTurno = encerraTurno,
        PermiteCombo = !encerraTurno,
        ExigeAlvo = codigo.Contains("ATACAR", StringComparison.Ordinal),
        Descricao = descricao,
        Ordem = ordem,
    };
}
