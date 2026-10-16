using System.Text.Json;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services;

public sealed class GameRunSnapshotFactory : IGameRunSnapshotFactory
{
    public GameRunCharacterSnapshotDto Create(
        PersonagemJogador personagem,
        SistemaRuntimeContextoDto sistema,
        IReadOnlyCollection<Proficiencia> proficiencias)
    {
        ArgumentNullException.ThrowIfNull(personagem);
        ArgumentNullException.ThrowIfNull(sistema);
        if (sistema.IdSistemaVersao is not int idVersao)
            throw new ArgumentException("A versão do Sistema não foi resolvida.", nameof(sistema));

        JsonElement status = ParseRequiredObject(personagem.StatusJson);
        return new GameRunCharacterSnapshotDto
        {
            IdPersonagemJogadorOrigem = personagem.IdpersonagemJogador,
            Nome = personagem.Nome,
            Imagem = personagem.Imagem,
            IdRaca = personagem.Idraca,
            IdSistemaVersao = idVersao,
            Status = status,
            Inventario = ParseOptional(personagem.InventarioJson),
            Implantes = ParseOptional(personagem.Implantes),
            Skills = ParseOptional(personagem.Skills),
            Magia = ParseOptional(personagem.Magia),
            InfoSecundariasJson = personagem.InfoSecundariasJson,
            Proficiencias = proficiencias.Select(item => new ProficienciaResumoDto
            {
                Idproficiencia = item.Idproficiencia,
                Nome = item.Nome,
                Descricao = item.Descricao,
            }).ToArray(),
            Sistema = new GameRunSystemSnapshotDto
            {
                IdSistemaRpg = sistema.IdSistemaRpg,
                IdSistemaVersao = idVersao,
                CodigoSistema = sistema.CodigoSistema,
                NumeroVersao = sistema.NumeroVersao,
                Origem = sistema.Origem.ToString(),
                Proveniencias = sistema.Proveniencias.ToArray(),
                Warnings = sistema.Warnings.ToArray(),
                Fallbacks = sistema.Fallbacks.ToArray(),
            },
        };
    }

    private static JsonElement ParseRequiredObject(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw new JsonException("O status da ficha está vazio.");
        JsonElement value = Parse(json);
        if (value.ValueKind != JsonValueKind.Object)
            throw new JsonException("O status da ficha deve ser um objeto JSON.");
        return value;
    }

    private static JsonElement? ParseOptional(string? json) =>
        string.IsNullOrWhiteSpace(json) ? null : Parse(json);

    private static JsonElement Parse(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
