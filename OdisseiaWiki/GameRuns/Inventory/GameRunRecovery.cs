using System.Text.Json;
using System.Text.Json.Nodes;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.GameRuns.Inventory;

/// <summary>Direct healing, not a rest: no condition removal, elapsed time, ammunition or defense repair.</summary>
public static class GameRunRecovery
{
    public static (string Snapshot, int Life, int Mana, int Stamina) RestoreToLimits(string snapshot, SistemaVersao version)
    {
        var root = JsonNode.Parse(GameRunCarry.Reconcile(snapshot, version))!.AsObject();
        var resources = root["status"]?["status"]?.AsObject()
            ?? throw new InvalidOperationException("A ficha desta run não possui recursos válidos.");
        int Recover(string key, string max)
        {
            if (GameRunCarry.BlocksRecovery(root, version, key.ToUpperInvariant())) return 0;
            int current = resources[key]?.GetValue<int>() ?? 0;
            int maximum = resources[max]?.GetValue<int>() ?? current;
            if (current < 0 || maximum < 0) throw new InvalidOperationException("Os recursos da ficha estão inválidos.");
            int recovered = Math.Max(0, maximum - current);
            resources[key] = checked(current + recovered);
            return recovered;
        }
        int life = Recover("vida", "vidaMaxima"), mana = Recover("mana", "manaMaxima"), stamina = Recover("estamina", "estaminaMaxima");
        return (GameRunCarry.Reconcile(root.ToJsonString(new JsonSerializerOptions(JsonSerializerDefaults.Web)), version), life, mana, stamina);
    }
}
