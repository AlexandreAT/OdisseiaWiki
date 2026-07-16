using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var mesaService = serviceProvider.GetRequiredService<IMesaService>();
        await mesaService.ObterMesaPadraoAsync();
    }
}
