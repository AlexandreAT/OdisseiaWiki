using System.Text.Json;
using System.Text.Json.Nodes;

namespace OdisseiaWiki.GameRuns;

/// <summary>XP belongs to the run snapshot, never to the source character.</summary>
public static class GameRunXpReward
{
    public static string Apply(string snapshotJson, int reward)
    {
        if (reward is < 0 or > 1000000)
            throw new ArgumentOutOfRangeException(nameof(reward));
        if (reward == 0) return snapshotJson;

        JsonObject root = JsonNode.Parse(snapshotJson) as JsonObject
            ?? throw new JsonException("O estado da run não é um objeto.");
        JsonObject status = Find(root, "status") as JsonObject
            ?? throw new JsonException("O estado da run não possui status.");
        JsonNode? current = Find(status, "xp");
        if (current is not null && (!int.TryParse(current.ToString(), out int parsed) || parsed < 0))
            throw new JsonException("O XP atual da run é inválido.");
        int xp = current is null ? 0 : int.Parse(current.ToString());
        string key = status.Select(entry => entry.Key)
            .FirstOrDefault(existing => string.Equals(existing, "xp", StringComparison.OrdinalIgnoreCase)) ?? "xp";
        status[key] = checked(xp + reward);
        string totalKey = status.Select(entry => entry.Key)
            .FirstOrDefault(existing => string.Equals(existing, "xpConquistadoRun", StringComparison.OrdinalIgnoreCase))
            ?? "xpConquistadoRun";
        JsonNode? previousTotal = Find(status, totalKey);
        if (previousTotal is not null && (!int.TryParse(previousTotal.ToString(), out int parsedTotal) || parsedTotal < 0))
            throw new JsonException("O XP conquistado na run é inválido.");
        status[totalKey] = checked((previousTotal is null ? 0 : int.Parse(previousTotal.ToString())) + reward);
        return root.ToJsonString();
    }

    private static JsonNode? Find(JsonObject source, string key) => source
        .FirstOrDefault(entry => string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase)).Value;
}
