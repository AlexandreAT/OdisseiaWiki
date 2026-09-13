namespace OdisseiaWiki.Hubs;

public static class MesaRealtimeGroups
{
    private const string Prefix = "mesa-em-jogo:";

    /// <summary>
    /// O nome do grupo nunca é aceito do cliente; ele é derivado no servidor
    /// somente depois da autorização para a Mesa ter sido validada.
    /// </summary>
    public static string ForMesa(int idMesa)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(idMesa);
        return $"{Prefix}{idMesa}";
    }
}
