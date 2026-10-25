using System.Text.Json;
using OdisseiaWiki.GameRuns;
using OdisseiaWiki.GameRuns.Battle;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Services;

public sealed partial class GameRunEncounterService
{
    private async Task RememberVictory(GameRun run, SistemaVersao version, string? encounterCode, CancellationToken token)
    {
        if (encounterCode is null || await _runs.GetOwnedCharacterAsync(run.IdUsuario,
                run.IdPersonagemJogadorOrigem, token) is null) return;
        var config = JsonSerializer.Deserialize<GameBattlePreviewConfig>(run.GameModeVersion.ConfiguracaoJson, JsonOptions);
        if (config?.Encounters?.TryGetValue(encounterCode, out var encounter) != true || encounter is null) return;
        var memory = await _runs.GetCharacterMemoryAsync(run.IdUsuario, run.IdPersonagemJogadorOrigem, token);
        var state = GameCharacterMilestones.Read(memory?.EstadoJson);
        if (memory is null)
            foreach (var previous in await _runs.GetCharacterVictoriesAsync(run.IdUsuario,
                         run.IdPersonagemJogadorOrigem, version.IdSistemaRpg, token) ?? [])
                state.LearnHistorical(previous, version.IdSistemaRpg);
        state.Learn(version.IdSistemaRpg, run.GameModeVersion.Codigo, encounterCode, encounter);
        if (memory is null)
        {
            memory = new() { IdPersonagemJogador = run.IdPersonagemJogadorOrigem };
            await _runs.AddCharacterMemoryAsync(memory, token);
        }
        memory.EstadoJson = state.Serialize();
        memory.AtualizadaEmUtc = DateTime.UtcNow;
        // Saved by SaveCommand in the battle's transaction and user lock.
    }
}
