namespace OdisseiaWiki.Dtos;

/// <summary>
/// Retorno do save de item. Mantém o id no topo para compatibilidade e entrega
/// o mesmo contexto tipado que seria obtido na leitura posterior da entidade.
/// </summary>
public sealed class ItemSaveResultDto
{
    public bool Sucesso { get; init; } = true;
    public string Id { get; init; } = null!;
    public ItemDto Item { get; init; } = null!;
    public SistemaRuntimeContextoDto? SistemaRuntime => Item.SistemaRuntime;
    public IReadOnlyList<SistemaRuntimeWarningDto> Warnings =>
        Item.SistemaRuntime?.Warnings is { } warnings
            ? warnings
            : Array.Empty<SistemaRuntimeWarningDto>();

    public static ItemSaveResultDto Ok(ItemDto item) => new()
    {
        Id = item.Iditem,
        Item = item,
    };
}
