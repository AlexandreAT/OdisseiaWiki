using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Data;

public partial class OdisseiaContext
{
    public DbSet<GameModeVersion> GameModeVersions { get; set; }
    public DbSet<GameRun> GameRuns { get; set; }
    public DbSet<GameRunCommand> GameRunCommands { get; set; }
    public DbSet<GameRunBattle> GameRunBattles { get; set; }
    public DbSet<GameCharacterMemory> GameCharacterMemories { get; set; }

    private static void ConfigureGameRuns(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameCharacterMemory>(entity =>
        {
            entity.ToTable("gamecharactermemories");
            entity.HasKey(item => item.IdPersonagemJogador);
            entity.Property(item => item.IdPersonagemJogador).HasColumnName("IDPersonagemJogador").ValueGeneratedNever();
            entity.Property(item => item.EstadoJson).HasColumnType("json");
            entity.Property(item => item.AtualizadaEmUtc).HasColumnType("datetime(6)");
            entity.HasOne(item => item.Personagem).WithMany().HasForeignKey(item => item.IdPersonagemJogador)
                .OnDelete(DeleteBehavior.Cascade).HasConstraintName("FK_GameCharacterMemory_Personagem");
        });
        modelBuilder.Entity<GameModeVersion>(entity =>
        {
            entity.ToTable("gamemodeversions");
            entity.HasKey(item => item.IdGameModeVersion);
            entity.Property(item => item.IdGameModeVersion).HasColumnName("IDGameModeVersion");
            entity.Property(item => item.IdSistemaVersao).HasColumnName("IDSistemaVersao");
            entity.Property(item => item.IdMesa).HasColumnName("IDMesa").HasColumnType("int");
            entity.Property(item => item.IdUsuarioCriacao).HasColumnName("IDUsuarioCriacao");
            entity.Property(item => item.Nome).HasMaxLength(100);
            entity.Property(item => item.Descricao).HasMaxLength(500);
            entity.Property(item => item.Banner).HasMaxLength(255);
            entity.Property(item => item.Codigo).HasMaxLength(50);
            entity.Property(item => item.NumeroVersao).HasMaxLength(20);
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(item => item.ConfiguracaoJson).HasColumnType("json");
            entity.Property(item => item.CriadaEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.PublicadaEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdSistemaVersao, item.Codigo, item.NumeroVersao })
                .IsUnique().HasDatabaseName("UX_GameModeVersion_Sistema_Codigo_Versao");
            entity.HasIndex(item => new { item.IdMesa, item.IdSistemaVersao, item.Status })
                .HasDatabaseName("IX_GameModeVersion_Mesa_Sistema_Status");
            entity.HasIndex(item => item.IdMesa).HasDatabaseName("IX_GameModeVersion_Mesa");
            entity.HasOne(item => item.SistemaVersao).WithMany()
                .HasForeignKey(item => item.IdSistemaVersao).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GameModeVersion_SistemaVersao");
            entity.HasOne(item => item.Mesa).WithMany()
                .HasForeignKey(item => item.IdMesa).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GameModeVersion_Mesa");
        });

        modelBuilder.Entity<GameRun>(entity =>
        {
            entity.ToTable("gameruns");
            entity.HasKey(item => item.IdGameRun);
            entity.Property(item => item.IdGameRun).HasColumnName("IDGameRun");
            entity.Property(item => item.IdUsuario).HasColumnName("IDUsuario");
            entity.Property(item => item.IdPersonagemJogadorOrigem).HasColumnName("IDPersonagemJogadorOrigem");
            entity.Property(item => item.IdGameModeVersion).HasColumnName("IDGameModeVersion");
            entity.Property(item => item.IdSistemaVersao).HasColumnName("IDSistemaVersao");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(item => item.NoAtualId).HasMaxLength(80);
            entity.Property(item => item.Revisao).IsConcurrencyToken();
            entity.Property(item => item.ChaveAtiva)
                .HasComputedColumnSql("CASE WHEN `Status` = 'Ativa' THEN 1 ELSE NULL END", stored: true);
            entity.Property(item => item.SnapshotInicialJson).HasColumnType("json");
            entity.Property(item => item.EstadoAtualJson).HasColumnType("json");
            entity.Property(item => item.MapaJson).HasColumnType("json");
            entity.Property(item => item.LoadoutJson).HasColumnType("json");
            entity.Property(item => item.CriadaEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.AtualizadaEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.EncerradaEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdUsuario, item.ChaveAtiva })
                .IsUnique().HasDatabaseName("UX_GameRun_Usuario_Ativa");
            entity.HasIndex(item => new { item.IdUsuario, item.CriadaEmUtc })
                .HasDatabaseName("IX_GameRun_Usuario_Criacao");
            entity.HasOne(item => item.Usuario).WithMany()
                .HasForeignKey(item => item.IdUsuario).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_GameRun_Usuario");
            entity.HasOne(item => item.GameModeVersion).WithMany(item => item.Runs)
                .HasForeignKey(item => item.IdGameModeVersion).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GameRun_ModeVersion");
            entity.HasOne(item => item.SistemaVersao).WithMany()
                .HasForeignKey(item => item.IdSistemaVersao).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_GameRun_SistemaVersao");
        });

        modelBuilder.Entity<GameRunCommand>(entity =>
        {
            entity.ToTable("gameruncommands");
            entity.HasKey(item => item.IdGameRunCommand);
            entity.Property(item => item.IdGameRunCommand).HasColumnName("IDGameRunCommand");
            entity.Property(item => item.IdGameRun).HasColumnName("IDGameRun");
            entity.Property(item => item.IdUsuario).HasColumnName("IDUsuario");
            entity.Property(item => item.ChaveIdempotencia).HasMaxLength(36);
            entity.Property(item => item.HashPayload).HasMaxLength(64);
            entity.Property(item => item.Tipo).HasMaxLength(40);
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(item => item.RespostaJson).HasColumnType("json");
            entity.Property(item => item.CriadoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.ConcluidoEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdUsuario, item.ChaveIdempotencia })
                .IsUnique().HasDatabaseName("UX_GameRunCommand_Usuario_Chave");
            entity.HasOne(item => item.Run).WithMany(item => item.Comandos)
                .HasForeignKey(item => item.IdGameRun).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_GameRunCommand_Run");
        });

        modelBuilder.Entity<GameRunBattle>(entity =>
        {
            entity.ToTable("gamerunbattles");
            entity.HasKey(item => item.IdGameRunBattle);
            entity.Property(item => item.IdGameRunBattle).HasColumnName("IDGameRunBattle");
            entity.Property(item => item.IdGameRun).HasColumnName("IDGameRun");
            entity.Property(item => item.NoId).HasMaxLength(80);
            entity.Property(item => item.VencedorId).HasMaxLength(20);
            entity.Property(item => item.ResultadoJson).HasColumnType("json");
            entity.Property(item => item.EstadoAntesJson).HasColumnType("json");
            entity.Property(item => item.EstadoDepoisJson).HasColumnType("json");
            entity.Property(item => item.CriadaEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdGameRun, item.NoId })
                .IsUnique().HasDatabaseName("UX_GameRunBattle_Run_No");
            entity.HasOne(item => item.Run).WithMany(item => item.Batalhas)
                .HasForeignKey(item => item.IdGameRun).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_GameRunBattle_Run");
        });
    }
}
