using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed partial class GameplayMariaDbIntegrationTests
{
    [Fact]
    public async Task Story_TwoMesasPublishOfficialOwnAndDerivedRewardsWithoutCrossingCustomSystemScopes()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync(); var seed = await database.SeedAsync();
        await using var context = database.CreateContext();
        int firstVersionId = seed.Mesa.IdSistemaVersao!.Value;
        int firstSystemId = (await context.SistemaVersoes.FindAsync(firstVersionId))!.IdSistemaRpg;
        var secondSystem = new SistemaRpg { Codigo = "PERSONALIZADO", Nome = "Regras personalizadas" };
        context.SistemasRpg.Add(secondSystem); await context.SaveChangesAsync();
        var secondVersion = new SistemaVersao { IdSistemaRpg = secondSystem.IdSistemaRpg, NumeroVersao = "custom-1",
            Status = SistemaVersaoStatus.Publicado };
        context.SistemaVersoes.Add(secondVersion); await context.SaveChangesAsync();
        var secondMesa = new Mesa { Nome = "Outra Mesa", IdusuarioCriacao = seed.Player.Idusuario,
            IdSistemaVersao = secondVersion.IdSistemaVersao, LimiteJogadores = 4 };
        context.Mesas.Add(secondMesa); await context.SaveChangesAsync();
        var scopes = new[] {
            new WikiEscopo { Tipo = WikiEscopoTipo.Mesa, Chave = $"MESA:{seed.Mesa.Idmesa}", IdMesa = seed.Mesa.Idmesa },
            new WikiEscopo { Tipo = WikiEscopoTipo.Mesa, Chave = $"MESA:{secondMesa.Idmesa}", IdMesa = secondMesa.Idmesa } };
        context.WikiEscopos.AddRange(scopes); await context.SaveChangesAsync();
        context.Itens.AddRange(
            new Item { Iditem = "official", Nome = "Oficial", Visivel = true, Tipo = ItemTipo.Outro, IdWikiEscopo = WikiEscopo.IdOficial, Valor = 10 },
            new Item { Iditem = "origin", Nome = "Origem", Visivel = true, Tipo = ItemTipo.Outro, IdWikiEscopo = WikiEscopo.IdOficial, Valor = 20 });
        await context.SaveChangesAsync();
        for (int index = 0; index < 2; index++)
            context.Itens.AddRange(
                new Item { Iditem = $"own-{index}", Nome = $"Próprio {index}", Visivel = true, Tipo = ItemTipo.Outro,
                    IdWikiEscopo = scopes[index].IdWikiEscopo, IdSistemaRpg = index == 0 ? firstSystemId : secondSystem.IdSistemaRpg, Valor = 30 },
                new Item { Iditem = $"derived-{index}", Nome = $"Derivado {index}", Visivel = true, Tipo = ItemTipo.Outro,
                    IdWikiEscopo = scopes[index].IdWikiEscopo, IdOrigemGlobal = "origin", Valor = 40 });
        var versions = new[] { firstVersionId, secondVersion.IdSistemaVersao };
        foreach (int id in versions) context.SistemaResultadosDado.Add(new() { IdSistemaVersao = id, CodigoTeste = "ATAQUE_COMUM",
            NomeTeste = "Ataque", Dado = "D20", QuantidadeDados = 1, CodigoResultado = "ACERTO", NomeResultado = "Acerto",
            ResultadoMinimo = 1, ResultadoMaximo = 20 });
        var modes = new[] {
            new GameModeVersion { Codigo = "STORY_A", Nome = "A", IdMesa = seed.Mesa.Idmesa, IdSistemaVersao = firstVersionId,
                NumeroVersao = "0.4.0", Status = GameModeVersionStatus.Rascunho, ConfiguracaoJson = "{}" },
            new GameModeVersion { Codigo = "STORY_B", Nome = "B", IdMesa = secondMesa.Idmesa, IdSistemaVersao = secondVersion.IdSistemaVersao,
                NumeroVersao = "0.4.0", Status = GameModeVersionStatus.Rascunho, ConfiguracaoJson = "{}" } };
        context.GameModeVersions.AddRange(modes); await context.SaveChangesAsync();
        var systems = new Mock<ISistemaRpgRepository>();
        foreach (int id in versions) systems.Setup(repo => repo.GetVersionAsync(id, true, false)).ReturnsAsync(new SistemaVersao {
            IdSistemaVersao = id, ResultadosDado = [new() { CodigoTeste = "ATAQUE_COMUM", Dado = "D20", QuantidadeDados = 1,
                CodigoResultado = "ACERTO", ResultadoMinimo = 1, ResultadoMaximo = 20 }] });
        var service = new GameModeManagementService(new GameModeManagementRepository(context), new GameRunRepository(context),
            systems.Object, new GameplayActionResolver(), context);
        for (int index = 0; index < 2; index++)
        {
            var reward = new GameStoryOutcomeDto { Items = new[] { "official", $"own-{index}", $"derived-{index}" }
                .Select(id => new GameStoryItemDto { ItemId = id, Snapshot = new() { ["valor"] = 999999 } }).ToList() };
            var update = new GameModeEditorUpdateDto { Areas = [new() { Code = "MAIN", Name = "Principal", UseBase = false, NodeCount = 3,
                FinalOption = "ROTA:0", Options = [new() { Type = "EVENTO", Label = "Arquivo", Choices = [new() { Code = "abrir", Label = "Abrir", Outcome = reward }] }] }],
                Encounters = new() { ["A"] = new() { MapName = "Treino", Enemy = new() { Name = "Treino", MaxVida = 10 }, DamageByResult = new() { ["ACERTO"] = 1 } } },
                FallbackAction = new() { Name = "Reserva", BaseDamage = 1 }, PlayerDamageByResult = new() { ["ACERTO"] = new() { Multiplier = 1 } } };
            int mesaId = modes[index].IdMesa!.Value;
            var saved = await service.SaveDraftAsync(modes[index].IdGameModeVersion, update, default, mesaId);
            Assert.True(saved.Sucesso, saved.Mensagem);
            string before = modes[index].ConfiguracaoJson;
            reward.Items[1].ItemId = $"own-{1 - index}";
            Assert.Equal("EVENTO_INVALIDO", (await service.SaveDraftAsync(modes[index].IdGameModeVersion, update, default, mesaId)).Codigo);
            Assert.Equal(before, modes[index].ConfiguracaoJson);
            var published = await service.PublishAsync(modes[index].IdGameModeVersion, default, mesaId);
            Assert.True(published.Sucesso, published.Mensagem);
            Assert.Equal(new[] { "Oficial", $"Próprio {index}", $"Derivado {index}" }, published.Dados!.Areas[0].Options[0].Choices[0].Outcome.Items
                .Select(item => item.Snapshot!["nome"]!.ToString()));
            Assert.DoesNotContain("999999", modes[index].ConfiguracaoJson);
        }
        context.ChangeTracker.Clear();
        Assert.Equal(20, (await context.Itens.FindAsync("origin"))!.Valor);
        Assert.Equal("Origem", (await context.Itens.FindAsync("origin"))!.Nome);
        Assert.All(await context.GameModeVersions.ToListAsync(), mode => Assert.Equal(GameModeVersionStatus.Publicado, mode.Status));
    }

    private static async Task PreparePersistentStory(TestDatabase database, long runId, GameModeAreaOptionDto option)
    {
        await using var context = database.CreateContext();
        var run = await context.GameRuns.Include(run => run.GameModeVersion).SingleAsync(run => run.IdGameRun == runId);
        var state = JsonNode.Parse(GameStoryEffectsTests.Snapshot)!;
        state["idSistemaVersao"] = run.IdSistemaVersao;
        state["sistema"] = new JsonObject { ["idSistemaVersao"] = run.IdSistemaVersao };
        run.EstadoAtualJson = state.ToJsonString(); run.NoAtualId = null;
        run.MapaJson = JsonSerializer.Serialize(new GameRunMapDto { SchemaVersion = 5, Nodes = [
            new() { Id = "start", Type = "INICIO", State = "CONCLUIDO", Connections = ["story", "other"] },
            new() { Id = "story", Name = option.Label ?? "Sinal", Type = option.Type, AreaCode = "MAIN", Layer = 1, Fase = 1, State = "DISPONIVEL", Connections = ["end"],
                Payload = new() { Choices = option.Choices, Mission = option.Mission,
                    SurpriseOptions = option.Type == "SURPRESA" ? [] : option.SurpriseOptions,
                    SurpriseOptionIndex = option.Type == "SURPRESA" ? 0 : null } },
            new() { Id = "other", Type = "EVENTO", Layer = 1, Fase = 1, State = "DISPONIVEL", Connections = ["end"] },
            new() { Id = "end", Type = "EVENTO", Layer = 2, Fase = 1, State = "BLOQUEADO" }] }, PersistentJson);
        run.GameModeVersion.ConfiguracaoJson = JsonSerializer.Serialize(new { map = new { schemaVersion = 5 }, encounters = new { },
            areas = new GameModeAreaDto[] {
                new() { Code = "MAIN", Name = "Principal", UseBase = false, NodeCount = 3, Options = [option] },
                new() { Code = "LAB", Name = "Laboratório", IsSecret = true, UseBase = false, NodeCount = 3, FinalOption = "ROTA:0",
                    Options = [new() { Type = "EVENTO", Label = "Investigar" }] } } }, PersistentJson);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task Story_EventChoiceIsAtomicAcrossContextsAndCannotChangeSheetSystemOrPublishedMode()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync();
        var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, false);
        int versionId = seed.Mesa.IdSistemaVersao!.Value;
        await PreparePersistentStory(database, runId, new() { Type = "EVENTO", Label = "Sinal", Choices = [
            new() { Code = "entrar", Label = "Entrar", Cost = new() { Currency = 20 }, Outcome = new() { Currency = 30, Xp = 5,
                Items = [new() { ItemId = "kit", Quantity = 2, Snapshot = new() { ["nome"] = "Kit", ["tipo"] = "consumiveis" } }] } },
            new() { Code = "sair", Label = "Sair" }] });
        string initial, configuration;
        await using (var context = database.CreateContext())
        {
            var run = await context.GameRuns.Include(run => run.GameModeVersion).SingleAsync(run => run.IdGameRun == runId);
            initial = run.SnapshotInicialJson; configuration = run.GameModeVersion.ConfiguracaoJson;
            var opened = await PersistentService(context, versionId).BeginStoryAsync(runId, "story", seed.Player.Idusuario,
                new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() }, default);
            Assert.True(opened.Sucesso, opened.Mensagem);
        }
        async Task<GameRunOperationResult<GameRunDto>> Choose(Guid key, int userId)
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, versionId).ChooseStoryAsync(runId, "story", userId,
                new() { ChoiceCode = "entrar", RevisaoEsperada = 1, ChaveIdempotencia = key }, default);
        }
        Guid key = Guid.NewGuid();
        var results = await Task.WhenAll(Choose(key, seed.Player.Idusuario), Choose(key, seed.Player.Idusuario));
        Assert.Single(results, result => result.Sucesso && !result.Repetido);
        Assert.Single(results, result => result.Sucesso && result.Repetido);
        Assert.Equal("REVISAO_DESATUALIZADA", (await Choose(Guid.NewGuid(), seed.Player.Idusuario)).Codigo);
        Assert.Equal("RUN_NAO_ENCONTRADA", (await Choose(Guid.NewGuid(), seed.Owner.Idusuario)).Codigo);
        await using var verify = database.CreateContext();
        var saved = await verify.GameRuns.Include(run => run.GameModeVersion).SingleAsync(run => run.IdGameRun == runId);
        var root = JsonNode.Parse(saved.EstadoAtualJson)!;
        Assert.Equal(110, root["economy"]!["balance"]!.GetValue<int>());
        Assert.Equal(2, Assert.Single(root["inventario"]!.AsArray())!["quantidade"]!.GetValue<int>());
        Assert.Single(root["story"]!.AsArray()); Assert.Equal(2, saved.Revisao);
        Assert.Equal(initial, saved.SnapshotInicialJson); Assert.Equal(configuration, saved.GameModeVersion.ConfiguracaoJson);
        Assert.Equal(2, await verify.GameRunCommands.CountAsync(command => command.IdGameRun == runId));
        var original = await verify.PersonagemJogadores.FindAsync(seed.Character!.IdpersonagemJogador);
        Assert.True(JsonNode.DeepEquals(JsonNode.Parse(seed.Character.StatusJson!), JsonNode.Parse(original!.StatusJson!)));
        Assert.Equal(seed.Character.InventarioJson, original.InventarioJson);
        Assert.Equal(0, original.RevisaoRuntime);
        Assert.Equal(SistemaVersaoStatus.Publicado, (await verify.SistemaVersoes.FindAsync(versionId))!.Status);
        Assert.Equal(seed.Mesa.RevisaoRuntime, (await verify.Mesas.FindAsync(seed.Mesa.Idmesa))!.RevisaoRuntime);
    }

    [Fact]
    public async Task Story_MysteryRevealPersistsBeforeEnteringAndRetriesCannotRerollOrChooseAnotherBranch()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync(); var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, false); int versionId = seed.Mesa.IdSistemaVersao!.Value;
        await PreparePersistentStory(database, runId, new() { Type = "SURPRESA", SurpriseOptions = [
            new() { Type = "EVENTO", Label = "Arquivo azul", Weight = 1 }, new() { Type = "EVENTO", Label = "Arquivo violeta", Weight = 3 }] });
        Guid key = Guid.NewGuid();
        async Task<GameRunOperationResult<GameRunDto>> Reveal()
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, versionId).BeginStoryAsync(runId, "story", seed.Player.Idusuario,
                new() { RevisaoEsperada = 0, ChaveIdempotencia = key }, default);
        }
        var results = await Task.WhenAll(Reveal(), Reveal());
        Assert.All(results, result => Assert.True(result.Sucesso, result.Mensagem)); Assert.Single(results, result => result.Repetido);
        string name = results[0].Dados!.Mapa.Nodes.Single(node => node.Id == "story").Name;
        await using var verify = database.CreateContext();
        var run = (await new GameRunRepository(verify).GetByIdAsync(runId, seed.Player.Idusuario, default))!;
        var map = JsonSerializer.Deserialize<GameRunMapDto>(run.MapaJson!, PersistentJson)!;
        var node = map.Nodes.Single(node => node.Id == "story");
        Assert.Equal(name, node.Name); Assert.Equal("EVENTO", node.Type); Assert.True(node.Payload!.SurpriseRevealed);
        Assert.Equal("DISPONIVEL", node.State); Assert.Null(run.NoAtualId);
        Assert.Equal("IGNORADO", map.Nodes.Single(node => node.Id == "other").State);
        Assert.Equal("BLOQUEADO", map.Nodes.Single(node => node.Id == "end").State);
        Assert.Equal(1, await verify.GameRunCommands.CountAsync(command => command.IdGameRun == runId));
    }

    [Fact]
    public async Task Story_MissionResumesAcrossContextsAndReturnsItsRewardExactlyOnce()
    {
        if (!TestDatabase.Enabled) return;
        await using var database = await TestDatabase.CreateAsync(); var seed = await database.SeedAsync(includeCharacter: true);
        long runId = await AddPersistentRun(database, seed, false); int versionId = seed.Mesa.IdSistemaVersao!.Value;
        await PreparePersistentStory(database, runId, new() { Type = "MISSAO", Label = "Resgate", Mission = new() {
            AreaCode = "LAB", Cost = new() { Currency = 10 }, Reward = new() { Currency = 40, Xp = 7 } } });
        await using (var context = database.CreateContext())
        {
            var service = PersistentService(context, versionId);
            Assert.True((await service.BeginStoryAsync(runId, "story", seed.Player.Idusuario,
                new() { RevisaoEsperada = 0, ChaveIdempotencia = Guid.NewGuid() }, default)).Sucesso);
            var accepted = await service.ChooseStoryAsync(runId, "story", seed.Player.Idusuario,
                new() { ChoiceCode = "ACCEPT", RevisaoEsperada = 1, ChaveIdempotencia = Guid.NewGuid() }, default);
            Assert.True(accepted.Sucesso, accepted.Mensagem); Assert.NotNull(accepted.Dados!.Mapa.ParentMap);
        }
        string lastId;
        await using (var context = database.CreateContext())
        {
            var run = (await new GameRunRepository(context).GetByIdAsync(runId, seed.Player.Idusuario, default))!;
            var map = JsonSerializer.Deserialize<GameRunMapDto>(run.MapaJson!, PersistentJson)!;
            var step = map.Nodes.First(node => node.State == "DISPONIVEL");
            var middle = await PersistentService(context, versionId).EnterBaseAsync(runId, step.Id, seed.Player.Idusuario,
                new() { RevisaoEsperada = 2, ChaveIdempotencia = Guid.NewGuid() }, default);
            Assert.True(middle.Sucesso, middle.Mensagem);
            lastId = middle.Dados!.Run.Mapa.Nodes.Single(node => node.State == "DISPONIVEL").Id;
        }
        Guid key = Guid.NewGuid();
        async Task<GameRunOperationResult<GameRunBaseResolutionDto>> Finish()
        {
            await using var context = database.CreateContext();
            return await PersistentService(context, versionId).EnterBaseAsync(runId, lastId, seed.Player.Idusuario,
                new() { RevisaoEsperada = 3, ChaveIdempotencia = key }, default);
        }
        var results = await Task.WhenAll(Finish(), Finish());
        Assert.All(results, result => Assert.True(result.Sucesso, result.Mensagem)); Assert.Single(results, result => result.Repetido);
        var returned = results[0].Dados!.Run;
        Assert.Null(returned.Mapa.ParentMap); Assert.Equal(130, returned.EstadoAtual.Economy!.Balance);
        Assert.Equal(7, returned.EstadoAtual.Status.GetProperty("xpConquistadoRun").GetInt32());
        Assert.Single(returned.EstadoAtual.Story, record => record.Type == "MISSAO_CONCLUIDA");
        Assert.True(returned.Mapa.Nodes.Single(node => node.Id == "story").Payload!.MissionCompleted);
        Assert.Equal("DISPONIVEL", returned.Mapa.Nodes.Single(node => node.Id == "end").State);
        await using var verify = database.CreateContext();
        Assert.Equal(4, await verify.GameRunCommands.CountAsync(command => command.IdGameRun == runId));
    }
}
