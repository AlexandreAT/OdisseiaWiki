using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OdisseiaWiki.Data
{
    public class OdisseiaContextFactory : IDesignTimeDbContextFactory<OdisseiaContext>
    {
        public OdisseiaContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<OdisseiaContext>();
            optionsBuilder.UseMySql(
                "server=localhost;port=3306;database=odisseia;user=root;password=;",
                ServerVersion.AutoDetect("server=localhost;port=3306;database=odisseia;user=root;password=;"));

            return new OdisseiaContext(optionsBuilder.Options);
        }
    }
}