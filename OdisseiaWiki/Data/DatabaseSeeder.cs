using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var mesaService = scope.ServiceProvider.GetRequiredService<IMesaService>();
        await mesaService.ObterMesaPadraoAsync();
    }
}
