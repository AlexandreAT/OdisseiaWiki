using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OdisseiaWiki.Data;
using OdisseiaWiki.Models;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class OutfitCompatibilityMigrationTests
{
    [Fact]
    public void MigrationAdicionaSomenteColunaNullableESnapshotCorrespondeAoModelo()
    {
        // Generate SQL only: this test never opens a connection or changes a database.
        var options = new DbContextOptionsBuilder<OdisseiaContext>()
            .UseMySql("Server=127.0.0.1;Database=unused;User=unused;Password=unused;",
                new MySqlServerVersion(new Version(8, 0, 36))).Options;
        using var context = new OdisseiaContext(options);
        var migrations = context.GetService<IMigrationsAssembly>().Migrations.Keys.ToArray();
        const string current = "20261027190000_AddOutfitCompatibility";
        int index = Array.IndexOf(migrations, current); Assert.True(index > 0);
        string sql = context.GetService<IMigrator>().GenerateScript(migrations[index - 1], current);
        Assert.Contains("ALTER TABLE `sistemaitensescopos` ADD `CompatibilidadeTrajeJson` json NULL", sql);
        Assert.DoesNotContain("UPDATE ", sql, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("DELETE ", sql, StringComparison.OrdinalIgnoreCase);
        Assert.True(context.Model.FindEntityType(typeof(SistemaItemEscopo))!.FindProperty(nameof(SistemaItemEscopo.CompatibilidadeTrajeJson))!.IsNullable);
        Assert.False(context.Database.HasPendingModelChanges());
    }
}
