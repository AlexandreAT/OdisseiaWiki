using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.GameRuns;

public static class GameRunNpcs
{
    public static bool HasCatalog(GameModeAreaOptionDto option) => IsMerchant(option) ||
        option.Type == "NPC" && option.NpcType is "SABIO" or "ENGENHEIRO";
    public static bool HasCatalog(GameRunMapNodeDto node) => IsMerchant(node) ||
        node.Type == "NPC" && node.Payload?.NpcType is "SABIO" or "ENGENHEIRO";
    public static bool IsMerchant(GameModeAreaOptionDto option) => option.Type == "VENDEDOR" ||
        option.Type == "NPC" && option.NpcType == "MERCADOR";
    public static bool IsMerchant(GameRunMapNodeDto node) => node.Type == "VENDEDOR" ||
        node.Type == "NPC" && node.Payload?.NpcType == "MERCADOR";
    public static bool NeedsRescue(GameRunMapNodeDto node) => node.Type == "NPC" &&
        node.Payload is { NpcLocked: true, NpcRescued: false };
    public static bool IsRescued(GameCharacterMilestones memory, string gameCode, int systemId, string npcCode) =>
        memory.RescuedNpcs.Any(item => item.GameCode == gameCode && item.SystemId == systemId && item.NpcCode == npcCode);

    public static void ApplyMemory(GameRunMapDto map, GameCharacterMilestones memory, string gameCode, int systemId)
    {
        foreach (var node in map.Nodes.Concat(map.HistoricalNodes).Concat(map.ParentNodes ?? []))
            if (node.Type == "NPC" && node.Payload is { NpcCode: { } code } payload)
                payload.NpcRescued = IsRescued(memory, gameCode, systemId, code);
        if (map.ParentMap is { } parent) ApplyMemory(parent, memory, gameCode, systemId);
    }
}
