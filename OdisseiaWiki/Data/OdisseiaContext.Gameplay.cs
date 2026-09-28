using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Data;

public partial class OdisseiaContext
{
    public virtual DbSet<MesaSessao> MesaSessoes { get; set; }
    public virtual DbSet<MesaComando> MesaComandos { get; set; }
    public virtual DbSet<MesaEvento> MesaEventos { get; set; }
    public virtual DbSet<MesaRolagem> MesaRolagens { get; set; }
    public virtual DbSet<MesaEfeitoAplicado> MesaEfeitosAplicados { get; set; }
    public virtual DbSet<MesaCombate> MesaCombates { get; set; }
    public virtual DbSet<MesaCombateParticipante> MesaCombateParticipantes { get; set; }
    public virtual DbSet<MesaCondicaoAtiva> MesaCondicoesAtivas { get; set; }
    public virtual DbSet<MesaCooldownAtivo> MesaCooldownsAtivos { get; set; }

    private static void ConfigureGameplay(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Mesa>(entity =>
        {
            entity.Property(item => item.IdMesaSessaoAtiva).HasColumnName("IDMesaSessaoAtiva");
            entity.Property(item => item.RevisaoRuntime).IsConcurrencyToken();
            entity.HasIndex(item => item.IdMesaSessaoAtiva)
                .IsUnique()
                .HasDatabaseName("UX_Mesa_SessaoAtiva");
            entity.HasOne(item => item.SessaoAtiva)
                .WithMany()
                .HasForeignKey(item => item.IdMesaSessaoAtiva)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Mesa_SessaoAtiva");
        });

        modelBuilder.Entity<PersonagemJogador>(entity =>
        {
            entity.Property(item => item.RevisaoRuntime).IsConcurrencyToken();
            entity.Property(item => item.RolagensFavoritasJson).HasColumnType("json");
        });

        modelBuilder.Entity<MesaSessao>(entity =>
        {
            entity.ToTable("mesasessoes");
            entity.HasKey(item => item.IdMesaSessao);
            entity.Property(item => item.IdMesaSessao).HasColumnName("IDMesaSessao");
            entity.Property(item => item.IdMesa).HasColumnName("IDMesa");
            entity.Property(item => item.IdSistemaVersao).HasColumnName("IDSistemaVersao");
            entity.Property(item => item.IdUsuarioCriacao).HasColumnName("IDUsuarioCriacao");
            entity.Property(item => item.IdUsuarioEncerramento).HasColumnName("IDUsuarioEncerramento");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.IniciadaEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.EncerradaEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.ContextoAberturaJson).HasColumnType("json");
            entity.Property(item => item.MotivoEncerramento).HasMaxLength(250);
            entity.Property(item => item.RevisaoEstado).IsConcurrencyToken();
            entity.Property(item => item.ChaveAtiva)
                .HasComputedColumnSql("CASE WHEN `Status` = 'Ativa' THEN 1 ELSE NULL END", stored: true);
            entity.HasIndex(item => new { item.IdMesa, item.ChaveAtiva })
                .IsUnique()
                .HasDatabaseName("UX_MesaSessao_Mesa_Ativa");
            entity.HasIndex(item => new { item.IdMesa, item.Status, item.IniciadaEmUtc })
                .HasDatabaseName("IX_MesaSessao_Mesa_Status_Inicio");
            entity.HasOne(item => item.Mesa).WithMany(item => item.Sessoes)
                .HasForeignKey(item => item.IdMesa).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaSessao_Mesa");
            entity.HasOne(item => item.SistemaVersao).WithMany()
                .HasForeignKey(item => item.IdSistemaVersao).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MesaSessao_SistemaVersao");
            entity.HasOne(item => item.UsuarioCriacao).WithMany()
                .HasForeignKey(item => item.IdUsuarioCriacao).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaSessao_UsuarioCriacao");
            entity.HasOne(item => item.UsuarioEncerramento).WithMany()
                .HasForeignKey(item => item.IdUsuarioEncerramento).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaSessao_UsuarioEncerramento");
        });

        modelBuilder.Entity<MesaComando>(entity =>
        {
            entity.ToTable("mesacomandos");
            entity.HasKey(item => item.IdMesaComando);
            entity.Property(item => item.IdMesaComando).HasColumnName("IDMesaComando");
            entity.Property(item => item.IdMesa).HasColumnName("IDMesa");
            entity.Property(item => item.IdMesaSessao).HasColumnName("IDMesaSessao");
            entity.Property(item => item.IdUsuarioAtor).HasColumnName("IDUsuarioAtor");
            entity.Property(item => item.IdPersonagemJogador).HasColumnName("IDPersonagemJogador");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.RespostaJson).HasColumnType("json");
            entity.Property(item => item.RevisoesAlvosJson).HasColumnType("json");
            entity.Property(item => item.CriadoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.ConcluidoEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdMesa, item.IdUsuarioAtor, item.ChaveIdempotencia })
                .IsUnique()
                .HasDatabaseName("UX_MesaComando_Mesa_Ator_Chave");
            entity.HasIndex(item => new { item.IdMesaSessao, item.CriadoEmUtc })
                .HasDatabaseName("IX_MesaComando_Sessao_Data");
            entity.HasOne(item => item.Mesa).WithMany(item => item.ComandosGameplay)
                .HasForeignKey(item => item.IdMesa).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaComando_Mesa");
            entity.HasOne(item => item.Sessao).WithMany(item => item.Comandos)
                .HasForeignKey(item => item.IdMesaSessao).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaComando_Sessao");
            entity.HasOne(item => item.UsuarioAtor).WithMany()
                .HasForeignKey(item => item.IdUsuarioAtor).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaComando_UsuarioAtor");
            entity.HasOne(item => item.PersonagemJogador).WithMany()
                .HasForeignKey(item => item.IdPersonagemJogador).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaComando_Personagem");
        });

        modelBuilder.Entity<MesaEvento>(entity =>
        {
            entity.ToTable("mesaeventos");
            entity.HasKey(item => item.IdMesaEvento);
            entity.Property(item => item.IdMesaEvento).HasColumnName("IDMesaEvento");
            entity.Property(item => item.IdMesaSessao).HasColumnName("IDMesaSessao");
            entity.Property(item => item.IdMesaComando).HasColumnName("IDMesaComando");
            entity.Property(item => item.IdUsuarioAtor).HasColumnName("IDUsuarioAtor");
            entity.Property(item => item.IdPersonagemJogador).HasColumnName("IDPersonagemJogador");
            entity.Property(item => item.IdParticipanteCombate).HasColumnName("IDParticipanteCombate");
            entity.Property(item => item.IdSistemaRpg).HasColumnName("IDSistemaRpg");
            entity.Property(item => item.IdSistemaVersaoEfetiva).HasColumnName("IDSistemaVersaoEfetiva");
            entity.Property(item => item.IdSistemaVersaoPersonagem).HasColumnName("IDSistemaVersaoPersonagem");
            entity.Property(item => item.Origem).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.Visibilidade).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.DadosJson).HasColumnType("json");
            entity.Property(item => item.OcorreuEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdMesaSessao, item.Sequencia })
                .IsUnique().HasDatabaseName("UX_MesaEvento_Sessao_Sequencia");
            entity.HasIndex(item => new { item.IdMesaSessao, item.OcorreuEmUtc })
                .HasDatabaseName("IX_MesaEvento_Sessao_Data");
            entity.HasIndex(item => new { item.IdPersonagemJogador, item.OcorreuEmUtc })
                .HasDatabaseName("IX_MesaEvento_Personagem_Data");
            entity.HasIndex(item => new { item.Tipo, item.CodigoRegra })
                .HasDatabaseName("IX_MesaEvento_Tipo_Regra");
            entity.HasOne(item => item.Sessao).WithMany(item => item.Eventos)
                .HasForeignKey(item => item.IdMesaSessao).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaEvento_Sessao");
            entity.HasOne(item => item.Comando).WithMany(item => item.Eventos)
                .HasForeignKey(item => item.IdMesaComando).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaEvento_Comando");
            entity.HasOne(item => item.UsuarioAtor).WithMany()
                .HasForeignKey(item => item.IdUsuarioAtor).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaEvento_UsuarioAtor");
            entity.HasOne(item => item.PersonagemJogador).WithMany()
                .HasForeignKey(item => item.IdPersonagemJogador).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaEvento_Personagem");
            entity.HasOne(item => item.ParticipanteCombate).WithMany()
                .HasForeignKey(item => item.IdParticipanteCombate).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaEvento_ParticipanteCombate");
            entity.HasOne(item => item.SistemaRpg).WithMany()
                .HasForeignKey(item => item.IdSistemaRpg).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MesaEvento_SistemaRpg");
            entity.HasOne(item => item.SistemaVersaoEfetiva).WithMany()
                .HasForeignKey(item => item.IdSistemaVersaoEfetiva).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MesaEvento_SistemaVersaoEfetiva");
            entity.HasOne(item => item.SistemaVersaoPersonagem).WithMany()
                .HasForeignKey(item => item.IdSistemaVersaoPersonagem).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MesaEvento_SistemaVersaoPersonagem");
        });

        modelBuilder.Entity<MesaRolagem>(entity =>
        {
            entity.ToTable("mesarolagens");
            entity.HasKey(item => item.IdMesaEvento);
            entity.Property(item => item.IdMesaEvento).HasColumnName("IDMesaEvento");
            entity.Property(item => item.GruposJson).HasColumnType("json");
            entity.Property(item => item.ModificadoresJson).HasColumnType("json");
            entity.HasOne(item => item.Evento).WithOne(item => item.Rolagem)
                .HasForeignKey<MesaRolagem>(item => item.IdMesaEvento)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaRolagem_Evento");
        });

        modelBuilder.Entity<MesaEfeitoAplicado>(entity =>
        {
            entity.ToTable("mesaefeitosaplicados");
            entity.HasKey(item => item.IdMesaEfeitoAplicado);
            entity.Property(item => item.IdMesaEfeitoAplicado).HasColumnName("IDMesaEfeitoAplicado");
            entity.Property(item => item.IdMesaSessao).HasColumnName("IDMesaSessao");
            entity.Property(item => item.IdEventoOrigem).HasColumnName("IDEventoOrigem");
            entity.Property(item => item.IdEventoAplicacao).HasColumnName("IDEventoAplicacao");
            entity.Property(item => item.IdPersonagemAlvo).HasColumnName("IDPersonagemAlvo");
            entity.Property(item => item.AplicadoEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new
                { item.IdMesaSessao, item.IdEventoOrigem, item.ChaveEfeito, item.IdPersonagemAlvo })
                .IsUnique()
                .HasDatabaseName("UX_MesaEfeito_Sessao_Origem_Chave_Alvo");
            entity.HasIndex(item => item.IdEventoAplicacao)
                .IsUnique()
                .HasDatabaseName("UX_MesaEfeito_EventoAplicacao");
            entity.HasIndex(item => new { item.IdPersonagemAlvo, item.AplicadoEmUtc })
                .HasDatabaseName("IX_MesaEfeito_Alvo_Data");
            entity.HasOne(item => item.Sessao).WithMany(item => item.EfeitosAplicados)
                .HasForeignKey(item => item.IdMesaSessao).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaEfeito_Sessao");
            entity.HasOne(item => item.EventoOrigem).WithMany()
                .HasForeignKey(item => item.IdEventoOrigem).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MesaEfeito_EventoOrigem");
            entity.HasOne(item => item.EventoAplicacao).WithMany()
                .HasForeignKey(item => item.IdEventoAplicacao).OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_MesaEfeito_EventoAplicacao");
            entity.HasOne(item => item.PersonagemAlvo).WithMany()
                .HasForeignKey(item => item.IdPersonagemAlvo).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaEfeito_PersonagemAlvo");
        });

        modelBuilder.Entity<MesaCombate>(entity =>
        {
            entity.ToTable("mesacombates");
            entity.HasKey(item => item.IdMesaCombate);
            entity.Property(item => item.IdMesaCombate).HasColumnName("IDMesaCombate");
            entity.Property(item => item.IdMesaSessao).HasColumnName("IDMesaSessao");
            entity.Property(item => item.IdParticipanteAtual).HasColumnName("IDParticipanteAtual");
            entity.Property(item => item.IdUsuarioCriacao).HasColumnName("IDUsuarioCriacao");
            entity.Property(item => item.IdUsuarioEncerramento).HasColumnName("IDUsuarioEncerramento");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.Revisao).IsConcurrencyToken();
            entity.Property(item => item.CriadoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.IniciadoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.EncerradoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.ChaveAtiva)
                .HasComputedColumnSql("CASE WHEN `Status` <> 'Encerrado' THEN 1 ELSE NULL END", stored: true);
            entity.HasIndex(item => new { item.IdMesaSessao, item.ChaveAtiva })
                .IsUnique().HasDatabaseName("UX_MesaCombate_Sessao_Ativo");
            entity.HasOne(item => item.Sessao).WithMany(item => item.Combates)
                .HasForeignKey(item => item.IdMesaSessao).OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_MesaCombate_Sessao");
            entity.HasOne(item => item.ParticipanteAtual).WithMany()
                .HasForeignKey(item => item.IdParticipanteAtual).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_MesaCombate_ParticipanteAtual");
            entity.HasOne(item => item.UsuarioCriacao).WithMany()
                .HasForeignKey(item => item.IdUsuarioCriacao).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(item => item.UsuarioEncerramento).WithMany()
                .HasForeignKey(item => item.IdUsuarioEncerramento).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MesaCombateParticipante>(entity =>
        {
            entity.ToTable("mesacombateparticipantes");
            entity.HasKey(item => item.IdMesaCombateParticipante);
            entity.Property(item => item.IdMesaCombateParticipante).HasColumnName("IDMesaCombateParticipante");
            entity.Property(item => item.IdMesaCombate).HasColumnName("IDMesaCombate");
            entity.Property(item => item.IdPersonagemJogador).HasColumnName("IDPersonagemJogador");
            entity.Property(item => item.IdUsuarioControlador).HasColumnName("IDUsuarioControlador");
            entity.Property(item => item.Tipo).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.CriadoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.IniciativaRoladaEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdMesaCombate, item.IdPersonagemJogador })
                .IsUnique().HasDatabaseName("UX_MesaCombateParticipante_Personagem");
            entity.HasIndex(item => new { item.IdMesaCombate, item.Ordem });
            entity.HasOne(item => item.Combate).WithMany(item => item.Participantes)
                .HasForeignKey(item => item.IdMesaCombate).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.PersonagemJogador).WithMany()
                .HasForeignKey(item => item.IdPersonagemJogador).OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(item => item.UsuarioControlador).WithMany()
                .HasForeignKey(item => item.IdUsuarioControlador).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MesaCondicaoAtiva>(entity =>
        {
            entity.ToTable("mesacondicoesativas");
            entity.HasKey(item => item.IdMesaCondicaoAtiva);
            entity.Property(item => item.IdMesaCondicaoAtiva).HasColumnName("IDMesaCondicaoAtiva");
            entity.Property(item => item.IdMesaCombate).HasColumnName("IDMesaCombate");
            entity.Property(item => item.IdParticipante).HasColumnName("IDParticipante");
            entity.Property(item => item.IdSistemaCondicao).HasColumnName("IDSistemaCondicao");
            entity.Property(item => item.IdUsuarioAplicacao).HasColumnName("IDUsuarioAplicacao");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.UnidadeDuracao).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.RegraSnapshotJson).HasColumnType("json");
            entity.Property(item => item.AplicadaEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.RemovidaEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdParticipante, item.Status, item.CodigoSnapshot });
            entity.HasOne(item => item.Combate).WithMany(item => item.Condicoes)
                .HasForeignKey(item => item.IdMesaCombate).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Participante).WithMany(item => item.Condicoes)
                .HasForeignKey(item => item.IdParticipante).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.SistemaCondicao).WithMany()
                .HasForeignKey(item => item.IdSistemaCondicao).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.UsuarioAplicacao).WithMany()
                .HasForeignKey(item => item.IdUsuarioAplicacao).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MesaCooldownAtivo>(entity =>
        {
            entity.ToTable("mesacooldownsativos");
            entity.HasKey(item => item.IdMesaCooldownAtivo);
            entity.Property(item => item.IdMesaCooldownAtivo).HasColumnName("IDMesaCooldownAtivo");
            entity.Property(item => item.IdMesaCombate).HasColumnName("IDMesaCombate");
            entity.Property(item => item.IdParticipante).HasColumnName("IDParticipante");
            entity.Property(item => item.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(item => item.CriadoEmUtc).HasColumnType("datetime(6)");
            entity.Property(item => item.EncerradoEmUtc).HasColumnType("datetime(6)");
            entity.HasIndex(item => new { item.IdParticipante, item.Status, item.TipoOrigem, item.IdOrigem });
            entity.HasOne(item => item.Combate).WithMany(item => item.Cooldowns)
                .HasForeignKey(item => item.IdMesaCombate).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(item => item.Participante).WithMany(item => item.Cooldowns)
                .HasForeignKey(item => item.IdParticipante).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
