using OdisseiaWiki.Dtos;

namespace OdisseiaWiki.GameRuns.Map;

/// <summary>Validates route references without imposing a boss or combat as the area finale.</summary>
public static class GameModeRouteValidation
{
    public static string? ValidateEncounterReferences(GameModeAreaDto area, IEnumerable<string> encounterCodes)
    {
        var encounters = encounterCodes.ToHashSet(StringComparer.Ordinal);
        for (int index = 0; index < area.Options.Count; index++)
        {
            GameModeAreaOptionDto option = area.Options[index];
            string route = $"{area.Name}, rota {index + 1}";
            if (option.Type is "COMBATE" or "ELITE" or "BOSS" &&
                (string.IsNullOrWhiteSpace(option.EncounterCode) || !encounters.Contains(option.EncounterCode)))
                return $"{route}: selecione um encontro existente no campo Encontro da rota.";
            if (option.Type == "CACADA" && (option.EncounterCodes is null or { Count: 0 } ||
                option.EncounterCodes.Any(code => !encounters.Contains(code))))
                return $"{route}: selecione encontros existentes em Encontros possíveis da caçada.";
        }
        return null;
    }

    public static string? Validate(GameModeAreaDto area, IEnumerable<string> encounterCodes,
        IReadOnlyList<GameModeAreaDto> areas)
    {
        string? referenceError = ValidateEncounterReferences(area, encounterCodes);
        if (referenceError is not null) return referenceError;
        for (int index = 0; index < area.Options.Count; index++)
        {
            GameModeAreaOptionDto option = area.Options[index];
            string route = $"{area.Name}, rota {index + 1}";
            if (!string.IsNullOrWhiteSpace(option.Label)) route += $" ({option.Label})";
            if (option.Weight is < 1 or > 100)
                return $"{route}: o peso no sorteio deve ficar entre 1 e 100.";
            if (option.GameMinutes is < 0 or > 1000000)
                return $"{route}: o tempo de jogo deve ficar entre 0 e 1.000.000 minutos.";
            if (option.Image?.Length > 500)
                return $"{route}: envie a imagem novamente; o endereço deve ter no máximo 500 caracteres.";
            if (option.Type is not ("COMBATE" or "ELITE" or "BOSS" or "EVENTO" or "DESCANSO" or
                "ATALHO" or "CACADA" or "AREA_SECRETA" or "VENDEDOR"))
                return $"{route}: selecione um tipo de rota válido.";
            if (option.Type is "COMBATE" or "ELITE" or "BOSS")
                continue;
            if (string.IsNullOrWhiteSpace(option.Label) || option.Label.Length > 100)
                return $"{route}: preencha o nome da rota com até 100 caracteres.";
            if (option.Description?.Length > 500)
                return $"{route}: o texto do evento deve ter no máximo 500 caracteres.";
            if (option.Type == "AREA_SECRETA" && !areas.Any(secret => secret.IsSecret &&
                secret.Code == option.SecretAreaCode))
                return $"{route}: escolha uma área secreta de destino existente.";
            if (option.Type == "CACADA")
            {
                if (option.EncounterCodes.Distinct(StringComparer.Ordinal).Count() != option.EncounterCodes.Count)
                    return $"{route}: a caçada contém encontros repetidos; selecione-os novamente.";
            }
            if (option.Type != "VENDEDOR") continue;
            if (option.OfferCount is not (3 or 6 or 9))
                return $"{route}: escolha 3, 6 ou 9 ofertas por visita para o mercador.";
            if (option.Offers is null or { Count: < 1 or > 30 })
                return $"{route}: configure de 1 a 30 itens no catálogo do mercador.";
            for (int offerIndex = 0; offerIndex < option.Offers.Count; offerIndex++)
            {
                GameModeVendorOfferDto? offer = option.Offers[offerIndex];
                string field = $"{route}, oferta {offerIndex + 1}";
                if (offer is null || string.IsNullOrWhiteSpace(offer.ItemId))
                    return $"{field}: selecione um item para venda.";
                if (offer.Price is < 0 or > 1000000000)
                    return $"{field}: o preço deve ficar entre 0 e 1.000.000.000.";
                if (offer.Stock is < 1 or > 999)
                    return $"{field}: o estoque deve ficar entre 1 e 999.";
                if (offer.Weight is < 1 or > 1000000)
                    return $"{field}: o peso no sorteio deve ficar entre 1 e 1.000.000.";
            }
            if (option.Offers.Select(offer => offer.ItemId).Distinct().Count() != option.Offers.Count)
                return $"{route}: não repita o mesmo item no catálogo; ajuste o estoque da oferta existente.";
        }
        return null;
    }
}
