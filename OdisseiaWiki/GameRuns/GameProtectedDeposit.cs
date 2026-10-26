using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns.Inventory;

namespace OdisseiaWiki.GameRuns;

/// <summary>The character memory is the single owner of protected instances, not a copy of the run stash.</summary>
public static class GameProtectedDeposit
{
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static (int Slots, int Cost) Settings(string configuration)
    {
        using var document = JsonDocument.Parse(configuration);
        int Read(string key) => document.RootElement.TryGetProperty(key, out var value) &&
            value.TryGetInt32(out int number) ? number : 0;
        return (Read("protectedDepositSlots"), Read("protectedDepositCost"));
    }

    public static GameRunProtectedDepositDto View(GameCharacterMilestones memory, string gameCode,
        int systemId, int versionId, string configuration)
    {
        var settings = Settings(configuration);
        return new(settings.Slots, settings.Cost, memory.ProtectedItems
            .Where(item => item.GameCode == gameCode && item.SystemId == systemId)
            .Select(item => new GameRunProtectedItemDto(item.ItemId, item.SystemVersionId,
                item.SystemVersionId == versionId, item.Snapshot.DeepClone().AsObject())).ToArray());
    }

    public static string Change(string snapshot, GameCharacterMilestones memory, string gameCode,
        int systemId, int versionId, string configuration, string itemId, string action)
    {
        var settings = Settings(configuration);
        var root = JsonNode.Parse(snapshot)!.AsObject();
        var economy = root["economy"]?.AsObject()
            ?? throw new InvalidOperationException("O depósito desta run está indisponível.");
        var stash = economy["stash"]?.AsArray()
            ?? throw new InvalidOperationException("O depósito desta run está indisponível.");
        var scoped = memory.ProtectedItems.Where(item => item.GameCode == gameCode && item.SystemId == systemId).ToArray();
        if (action == "PROTECT")
        {
            if (settings.Slots <= 0) throw new InvalidOperationException("Este jogo não habilitou vagas protegidas no depósito.");
            if (scoped.Length >= settings.Slots) throw new InvalidOperationException("As vagas protegidas estão ocupadas. Retire ou libere um item.");
            var matches = stash.OfType<JsonObject>().Where(item => item["id"]?.ToString() == itemId).ToArray();
            if (matches.Length != 1)
                throw new InvalidOperationException("Guarde este item no depósito comum antes de protegê-lo.");
            int balance = economy["balance"]?.GetValue<int>() ?? 0;
            if (balance < settings.Cost) throw new InvalidOperationException("Moedas insuficientes para proteger este item.");
            var item = matches[0];
            // Source-sheet IDs repeat in every new snapshot. Give the persisted instance its own
            // identity once, so it can coexist with the next run's copy of that original sheet item.
            var stored = item.DeepClone().AsObject();
            string persistentId = Guid.NewGuid().ToString("D");
            stored["id"] = persistentId;
            memory.ProtectedItems.Add(new(gameCode, systemId, persistentId, stored, versionId));
            stash.Remove(item);
            economy["balance"] = balance - settings.Cost;
        }
        else if (action is "RELEASE" or "TAKE")
        {
            var stored = scoped.SingleOrDefault(item => item.ItemId == itemId)
                ?? throw new InvalidOperationException("Este item protegido não está mais disponível.");
            if (stored.SystemVersionId != versionId)
                throw new InvalidOperationException("Item preservado em outra versão do Sistema. Ele continua protegido; use uma versão compatível para retirá-lo.");
            // Never overwrite or merge a duplicate identity, even if a malformed snapshot is submitted.
            if (stash.OfType<JsonObject>().Concat(GameRunInventory.ReadOrCreate(root, "inventario").OfType<JsonObject>())
                .Concat(GameRunInventory.ReadOrCreate(root, "implantes").OfType<JsonObject>())
                .Any(item => item["id"]?.ToString() == itemId))
                throw new InvalidOperationException("A instância deste item já está presente na run.");
            var copy = stored.Snapshot.DeepClone().AsObject();
            if (action == "RELEASE") stash.Add(copy);
            else GameRunInventory.ReadOrCreate(root, copy["tipo"]?.ToString() == "implante" ? "implantes" : "inventario").Add(copy);
            memory.ProtectedItems.Remove(stored);
        }
        else throw new InvalidOperationException("Escolha uma operação válida para o depósito protegido.");
        return root.ToJsonString(Options);
    }
}
