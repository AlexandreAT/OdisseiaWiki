using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Data;

public partial class OdisseiaContext
{
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        ValidarImutabilidadePatchNotes();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ValidarImutabilidadePatchNotes();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ValidarImutabilidadePatchNotes()
    {
        bool tentativaDeAlteracao = ChangeTracker.Entries<SistemaPatchNote>().Any(entry =>
            entry.State is EntityState.Modified or EntityState.Deleted);
        if (tentativaDeAlteracao)
        {
            throw new InvalidOperationException(
                "Patch notes publicados são snapshots imutáveis e não podem ser alterados ou excluídos.");
        }
    }
}
