using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Interfaces;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class SistemaPatchEMigracaoTests
{
    [Fact]
    public async Task PublicarVersaoAsync_GeraPatchEstruturadoInicialDentroDaTransacao()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = CriarVersaoValida(42, SistemaVersaoStatus.Rascunho, "1.0");
        SistemaPatchNote? patchPersistido = null;
        bool executandoTransacao = false;
        repository.Setup(r => r.GetVersionAsync(42, true, true)).ReturnsAsync(versao);
        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync((SistemaPatchNote?)null);
        repository.Setup(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(async operacao =>
            {
                executandoTransacao = true;
                await operacao();
                executandoTransacao = false;
            });
        repository.Setup(r => r.AddPatchNoteAsync(It.IsAny<SistemaPatchNote>()))
            .Callback<SistemaPatchNote>(patch =>
            {
                Assert.True(executandoTransacao);
                patchPersistido = patch;
            })
            .Returns(Task.CompletedTask);
        repository.Setup(r => r.SynchronizeDefaultMesaVersionAsync(42))
            .Callback(() => Assert.True(executandoTransacao))
            .Returns(Task.CompletedTask);
        repository.Setup(r => r.SaveChangesAsync())
            .Callback(() => Assert.True(executandoTransacao))
            .Returns(Task.CompletedTask);
        repository.Setup(r => r.CountMesasByVersionAsync(42)).ReturnsAsync(0);
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<SistemaVersaoResumoDto> resultado =
            await service.PublicarVersaoAsync(42);

        Assert.True(resultado.Sucesso);
        Assert.Equal(SistemaVersaoStatus.Publicado, versao.Status);
        Assert.NotNull(patchPersistido);
        Assert.True(patchPersistido!.VersaoInicial);
        Assert.Equal("1.0", patchPersistido.NumeroVersaoNova);
        Assert.Null(patchPersistido.NumeroVersaoAnterior);
        Assert.Contains("REGRAS_BASE", patchPersistido.DiffJson, StringComparison.Ordinal);
        repository.Verify(r => r.AddPatchNoteAsync(It.IsAny<SistemaPatchNote>()), Times.Once);
        repository.Verify(r => r.SynchronizeDefaultMesaVersionAsync(42), Times.Once);
        repository.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task PublicarVersaoAsync_DeOutroSistemaNaoSincronizaMesaPadrao()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = CriarVersaoValida(42, SistemaVersaoStatus.Rascunho, "1.0");
        versao.SistemaRpg.Codigo = "OUTRO_SISTEMA";
        repository.Setup(r => r.GetVersionAsync(42, true, true)).ReturnsAsync(versao);
        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync((SistemaPatchNote?)null);
        repository.Setup(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(operacao => operacao());
        repository.Setup(r => r.AddPatchNoteAsync(It.IsAny<SistemaPatchNote>()))
            .Returns(Task.CompletedTask);
        repository.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
        repository.Setup(r => r.CountMesasByVersionAsync(42)).ReturnsAsync(0);
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<SistemaVersaoResumoDto> resultado =
            await service.PublicarVersaoAsync(42);

        Assert.True(resultado.Sucesso);
        repository.Verify(r => r.SynchronizeDefaultMesaVersionAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task PublicarVersaoAsync_RegistraValorAnteriorENovoPorModulo()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao anterior = CriarVersaoValida(41, SistemaVersaoStatus.Publicado, "1.0");
        SistemaVersao nova = CriarVersaoValida(42, SistemaVersaoStatus.Rascunho, "1.1");
        nova.IdVersaoBase = anterior.IdSistemaVersao;
        nova.SistemaRpg = anterior.SistemaRpg;
        nova.SistemaRpg.IdVersaoPublicada = anterior.IdSistemaVersao;
        nova.SistemaRpg.VersaoPublicada = anterior;
        anterior.Atributos.Single().ValorComum = 2;
        nova.Atributos.Single().ValorComum = 4;
        SistemaPatchNote? patchPersistido = null;

        repository.Setup(r => r.GetVersionAsync(42, true, true)).ReturnsAsync(nova);
        repository.Setup(r => r.GetVersionAsync(41, true, false)).ReturnsAsync(anterior);
        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync((SistemaPatchNote?)null);
        repository.Setup(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(operacao => operacao());
        repository.Setup(r => r.AddPatchNoteAsync(It.IsAny<SistemaPatchNote>()))
            .Callback<SistemaPatchNote>(patch => patchPersistido = patch)
            .Returns(Task.CompletedTask);
        repository.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
        repository.Setup(r => r.CountMesasByVersionAsync(42)).ReturnsAsync(0);
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<SistemaVersaoResumoDto> publicacao =
            await service.PublicarVersaoAsync(42);
        Assert.True(publicacao.Sucesso);
        Assert.NotNull(patchPersistido);

        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync(patchPersistido);
        SistemaOperacaoResultado<SistemaPatchNoteDto> leitura = await service.ObterPatchNoteAsync(42);
        SistemaPatchAlteracaoDto alteracao = Assert.Single(
            leitura.Dados!.Grupos.SelectMany(g => g.Alteracoes), a =>
                a.Modulo == "CRIACAO" &&
                a.Entidade.Equals("atributos", StringComparison.OrdinalIgnoreCase) &&
                a.Campo.Contains("valorComum", StringComparison.OrdinalIgnoreCase));

        Assert.Equal(SistemaPatchAlteracaoTipo.Alterado, alteracao.Tipo);
        Assert.Equal(2, alteracao.ValorAnterior!.Value.GetInt32());
        Assert.Equal(4, alteracao.ValorNovo!.Value.GetInt32());
        Assert.Equal("1.0", leitura.Dados.NumeroVersaoAnterior);
        Assert.Equal("1.1", leitura.Dados.NumeroVersaoNova);
    }

    [Fact]
    public async Task PublicarVersaoAsync_FalhaAoPersistirPatchNaoAlteraStatusNemSalva()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao versao = CriarVersaoValida(42, SistemaVersaoStatus.Rascunho, "1.0");
        repository.Setup(r => r.GetVersionAsync(42, true, true)).ReturnsAsync(versao);
        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync((SistemaPatchNote?)null);
        repository.Setup(r => r.ExecuteInTransactionAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(operacao => operacao());
        repository.Setup(r => r.AddPatchNoteAsync(It.IsAny<SistemaPatchNote>()))
            .ThrowsAsync(new InvalidOperationException("persistência indisponível"));
        SistemaRpgService service = CriarService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.PublicarVersaoAsync(42));

        Assert.Equal(SistemaVersaoStatus.Rascunho, versao.Status);
        Assert.Null(versao.DataPublicacao);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ObterPatchNoteAsync_LeituraNaoRastreiaNemAlteraSnapshotPersistido()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaPatchNote entity = new()
        {
            IdSistemaPatchNote = 7,
            IdSistemaRpg = 1,
            IdSistemaVersao = 42,
            CodigoSistema = "ODISSEIA",
            NomeSistema = "Odisseia",
            NumeroVersaoNova = "1.0",
            Titulo = "Versão inicial 1.0",
            Resumo = "Inicial",
            VersaoInicial = true,
            DiffJson = "[]",
        };
        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync(entity);
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<SistemaPatchNoteDto> resultado = await service.ObterPatchNoteAsync(42);
        resultado.Dados!.Grupos.Add(new SistemaPatchGrupoDto { Modulo = "TESTE", Titulo = "Teste" });

        Assert.Equal("[]", entity.DiffJson);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ObterPreviaMigracaoMesaAsync_ComparaVersoesEAnalisaPersonagensReais()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaVersao origem = CriarVersaoValida(41, SistemaVersaoStatus.Publicado, "1.0");
        SistemaVersao destino = CriarVersaoValida(42, SistemaVersaoStatus.Publicado, "1.1");
        destino.SkillConfig = new SistemaSkillConfig
        {
            MaximoSkills = 1,
            NivelMaximoSkill = 2,
            MaximoMagias = 1,
        };
        destino.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "CAIDO",
            Nome = "Caído",
            Tipo = "Temporaria",
        });
        origem.Condicoes.Add(new SistemaCondicao
        {
            Codigo = "ENVENENADO",
            Nome = "Envenenado",
            Tipo = "Temporaria",
        });
        Mesa mesa = new()
        {
            Idmesa = 5,
            Nome = "Mesa teste",
            IdSistemaVersao = 41,
            PersonagensJogadores =
            {
                new PersonagemJogador
                {
                    IdpersonagemJogador = 9,
                    Idmesa = 5,
                    Idusuario = 2,
                    Idraca = 999,
                    Nome = "Teste",
                    StatusJson = "{\"status\":{\"vidaMaxima\":1500},\"atributos\":{\"principais\":{\"forca\":8}},\"nivel\":21,\"condicioes\":[\"ENVENENADO\"]}",
                    Skills = "[{\"nome\":\"A\",\"nivel\":3},{\"nome\":\"B\",\"nivel\":1}]",
                    Magia = "[{\"nome\":\"A\"},{\"nome\":\"B\"}]",
                    InventarioJson = "[{\"nome\":\"Item sem arquétipo\"}]",
                },
            },
        };
        repository.Setup(r => r.GetMesaForMigrationPreviewAsync(5)).ReturnsAsync(mesa);
        repository.Setup(r => r.GetVersionAsync(42, true, false)).ReturnsAsync(destino);
        repository.Setup(r => r.GetVersionAsync(41, true, false)).ReturnsAsync(origem);
        repository.Setup(r => r.GetPatchNoteByVersionAsync(42)).ReturnsAsync((SistemaPatchNote?)null);
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<MesaMigracaoPreviewDto> resultado =
            await service.ObterPreviaMigracaoMesaAsync(5, 42);

        Assert.True(resultado.Sucesso);
        Assert.True(resultado.Dados!.AlteraSomenteVersaoDaMesa);
        Assert.True(resultado.Dados.RequerConfirmacaoExplicita);
        Assert.Equal(41, resultado.Dados.IdSistemaVersaoOrigem);
        Assert.Equal(42, resultado.Dados.IdSistemaVersaoDestino);
        Assert.Contains(resultado.Dados.Avisos, a => a.Codigo == "RACAS_INCOMPATIVEIS");
        Assert.Contains(resultado.Dados.Avisos, a => a.Codigo == "SKILLS_ACIMA_LIMITE");
        Assert.Contains(resultado.Dados.Avisos, a => a.Codigo == "MAGIAS_ACIMA_LIMITE");
        Assert.Contains(resultado.Dados.Avisos, a => a.Codigo == "CONDICOES_REMOVIDAS_EM_USO");
        Assert.Contains(resultado.Dados.Avisos, a => a.Codigo == "VALORES_ACIMA_REFERENCIA");
        Assert.Contains(resultado.Dados.Avisos, a => a.Codigo == "ITENS_SEM_ARQUETIPO");
        Assert.Equal(1, resultado.Dados.ResumoMesa.QuantidadePersonagens);
        Assert.Equal(1, resultado.Dados.ResumoMesa.QuantidadeItensInventario);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task MigrarMesaAsync_SemConfirmacaoNaoAlteraMesa()
    {
        Mock<ISistemaRpgRepository> repository = new();
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<SistemaResolvidoDto> resultado =
            await service.MigrarMesaAsync(5, 42, confirmarPreservacaoValores: false);

        Assert.False(resultado.Sucesso);
        repository.Verify(r => r.GetMesaAsync(It.IsAny<int>(), It.IsAny<bool>()), Times.Never);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task MigrarMesaAsync_ConfirmadaAlteraSomenteIdSistemaVersao()
    {
        Mock<ISistemaRpgRepository> repository = new();
        Mock<ISistemaRpgResolver> resolver = new();
        PersonagemJogador personagem = new()
        {
            IdpersonagemJogador = 9,
            Idmesa = 5,
            Idusuario = 2,
            Idraca = 1,
            Nome = "Preservado",
            StatusJson = "{\"status\":{\"vida\":10,\"vidaMaxima\":100},\"xp\":321}",
            Skills = "[{\"nome\":\"Skill\"}]",
            Magia = "[{\"nome\":\"Magia\"}]",
            InventarioJson = "[{\"nome\":\"Item\"}]",
        };
        Mesa mesa = new()
        {
            Idmesa = 5,
            Nome = "Mesa",
            IdSistemaVersao = 41,
            PersonagensJogadores = { personagem },
        };
        SistemaVersao destino = CriarVersaoValida(42, SistemaVersaoStatus.Publicado, "1.1");
        repository.Setup(r => r.GetMesaAsync(5, true)).ReturnsAsync(mesa);
        repository.Setup(r => r.GetVersionAsync(42, false, false)).ReturnsAsync(destino);
        repository.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);
        resolver.Setup(r => r.ResolverAsync(5)).ReturnsAsync(new SistemaResolvidoDto
        {
            IdSistemaVersao = 42,
            NumeroVersao = "1.1",
        });
        SistemaRpgService service = CriarService(repository, resolver);
        string status = personagem.StatusJson;
        string? skills = personagem.Skills;
        string? magias = personagem.Magia;
        string? inventario = personagem.InventarioJson;

        SistemaOperacaoResultado<SistemaResolvidoDto> resultado =
            await service.MigrarMesaAsync(5, 42, confirmarPreservacaoValores: true);

        Assert.True(resultado.Sucesso);
        Assert.Equal(42, mesa.IdSistemaVersao);
        Assert.Equal(status, personagem.StatusJson);
        Assert.Equal(skills, personagem.Skills);
        Assert.Equal(magias, personagem.Magia);
        Assert.Equal(inventario, personagem.InventarioJson);
        repository.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task MigrarMesaAsync_MesaPadraoNaoAceitaMigracaoManual()
    {
        Mock<ISistemaRpgRepository> repository = new();
        Mesa mesa = new()
        {
            Idmesa = 5,
            Nome = "Odisseia",
            CodigoSistema = "ODISSEIA_PADRAO",
            PadraoSistema = true,
            IdSistemaVersao = 41,
        };
        repository.Setup(r => r.GetMesaAsync(5, true)).ReturnsAsync(mesa);
        SistemaRpgService service = CriarService(repository);

        SistemaOperacaoResultado<SistemaResolvidoDto> resultado =
            await service.MigrarMesaAsync(5, 42, confirmarPreservacaoValores: true);

        Assert.False(resultado.Sucesso);
        Assert.Equal(SistemaOperacaoErro.Conflito, resultado.TipoErro);
        Assert.Equal(41, mesa.IdSistemaVersao);
        repository.Verify(r => r.GetVersionAsync(It.IsAny<int>(), It.IsAny<bool>(), It.IsAny<bool>()), Times.Never);
        repository.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    private static SistemaRpgService CriarService(
        Mock<ISistemaRpgRepository> repository,
        Mock<ISistemaRpgResolver>? resolver = null) => new(
        repository.Object,
        (resolver ?? new Mock<ISistemaRpgResolver>()).Object,
        NullLogger<SistemaRpgService>.Instance);

    private static SistemaVersao CriarVersaoValida(
        int id,
        SistemaVersaoStatus status,
        string numero)
    {
        SistemaRpg sistema = new()
        {
            IdSistemaRpg = 1,
            Codigo = "ODISSEIA",
            Nome = "Odisseia",
            Ativo = true,
        };
        SistemaVersao versao = new()
        {
            IdSistemaVersao = id,
            IdSistemaRpg = sistema.IdSistemaRpg,
            NumeroVersao = numero,
            Status = status,
            SistemaRpg = sistema,
            Modulos = Enum.GetValues<SistemaModuloTipo>()
                .Where(tipo => tipo is SistemaModuloTipo.RegrasBase or
                    SistemaModuloTipo.CriacaoPersonagem or
                    SistemaModuloTipo.Progressao or
                    SistemaModuloTipo.Exploracao or
                    SistemaModuloTipo.Combate or
                    SistemaModuloTipo.Poderes or
                    SistemaModuloTipo.Sobrevivencia)
                .Select((tipo, indice) => new SistemaModulo
                {
                    TipoModulo = tipo,
                    Habilitado = true,
                    SchemaVersion = 1,
                    Ordem = indice + 1,
                })
                .ToList(),
            Niveis = Enumerable.Range(1, 20).Select(nivel => new SistemaNivel
            {
                Nivel = nivel,
                XpParaProximoNivel = nivel * 10,
                Ordem = nivel,
            }).ToList(),
            Atributos =
            {
                new SistemaAtributoConfig
                {
                    CodigoAtributo = "FORCA",
                    Nome = "Força",
                    ValorMinimo = 0,
                    ValorComum = 3,
                    ValorMaximoNatural = 5,
                    ValorMaximoAbsoluto = 6,
                    Ativo = true,
                },
            },
            Recursos =
            {
                new SistemaRecursoConfig
                {
                    Codigo = "VIDA",
                    Nome = "Vida",
                    ValorMinimo = 0,
                    ValorPadrao = 100,
                    ValorMaximo = 1000,
                    Ativo = true,
                },
            },
        };
        sistema.Versoes.Add(versao);
        return versao;
    }
}
