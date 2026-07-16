using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using OdisseiaWiki.Settings;

namespace OdisseiaWiki.Data
{
    public class OdisseiaContextFactory : IDesignTimeDbContextFactory<OdisseiaContext>
    {
        public OdisseiaContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(AppContext.BaseDirectory)
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "ConnectionStrings:DefaultConnection não configurada.");
            DatabaseSettings databaseSettings = configuration
                .GetSection(DatabaseSettings.SectionName)
                .Get<DatabaseSettings>() ?? new DatabaseSettings();

            if (!Version.TryParse(databaseSettings.ServerVersion, out Version? serverVersion))
                throw new InvalidOperationException("Database:ServerVersion é inválida.");

            var optionsBuilder = new DbContextOptionsBuilder<OdisseiaContext>();

            optionsBuilder.UseMySql(
                connectionString,
                new MySqlServerVersion(serverVersion),
                mySqlOptions => mySqlOptions.EnableRetryOnFailure(
                    databaseSettings.RetryCount,
                    TimeSpan.FromSeconds(databaseSettings.RetryDelaySeconds),
                    errorNumbersToAdd: null)
            );

            return new OdisseiaContext(optionsBuilder.Options);
        }
    }
}
