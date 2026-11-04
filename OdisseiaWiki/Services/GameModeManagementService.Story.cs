using OdisseiaWiki.Dtos;
using OdisseiaWiki.GameRuns;
using System.Text.Json;

namespace OdisseiaWiki.Services;

public sealed partial class GameModeManagementService
{
    private async Task<string?> FreezeStoryAsync(IEnumerable<GameModeAreaDto> areas, int versionId, int? mesaId, CancellationToken token)
    {
        var outcomes = GameStoryRules.Outcomes(areas).ToArray();
        if (outcomes.Length == 0) return null;
        var version = await _systems.GetVersionAsync(versionId, includeConfiguration: true);
        if (version is null) return "Sistema indisponível para validar eventos e missões.";
        var rewards = outcomes.SelectMany(outcome => outcome.Items).ToArray();
        var catalogue = rewards.Length == 0 ? [] : mesaId.HasValue
            ? await _management.GetLootItemsAsync(mesaId, versionId, token)
            : await _management.GetLootItemsAsync(token);
        foreach (var area in areas)
            foreach (var route in GameStoryRules.Routes([area]))
                foreach (var outcome in route.Choices.Select(choice => choice.Outcome)
                    .Concat(route.Mission is { } mission ? new[] { mission.Reward } : []))
                {
                    try
                    {
                        GameStoryEffects.ConditionSource(outcome, route.Label ?? area.Name, route.Image, version);
                        foreach (var condition in outcome.Conditions)
                            condition.Name = version.Condicoes.First(rule => rule.Codigo.Equals(condition.Code, StringComparison.OrdinalIgnoreCase)).Nome;
                        foreach (var reward in outcome.Items)
                        {
                            var item = catalogue.FirstOrDefault(item => item.Iditem == reward.ItemId && item.Visivel);
                            if (item is null) return $"{area.Name}, {route.Label}: um item da recompensa está oculto ou indisponível nesta Mesa/Sistema.";
                            if (item.Tipo.ToString().Equals("Implante", StringComparison.OrdinalIgnoreCase) && reward.Quantity != 1)
                                return $"{area.Name}, {route.Label}: use quantidade um para cada prótese da recompensa.";
                            reward.Snapshot = FreezeCatalogItem(item);
                        }
                    }
                    catch (Exception error) when (error is JsonException or InvalidOperationException or ArgumentException or OverflowException)
                    { return $"{area.Name}, {route.Label}: {error.Message}"; }
                }
        return null;
    }
}
