using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var sistemaRpgSeeder = serviceProvider.GetRequiredService<ISistemaRpgSeeder>();
        await sistemaRpgSeeder.SeedAsync();

        var mesaService = serviceProvider.GetRequiredService<IMesaService>();
        await mesaService.ObterMesaPadraoAsync();
    }
}
