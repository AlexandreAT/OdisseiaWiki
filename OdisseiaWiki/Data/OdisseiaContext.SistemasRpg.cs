using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Models;

namespace OdisseiaWiki.Data;

public partial class OdisseiaContext
{
    public virtual DbSet<SistemaRpg> SistemasRpg { get; set; }
    public virtual DbSet<SistemaVersao> SistemaVersoes { get; set; }
    public virtual DbSet<SistemaModulo> SistemaModulos { get; set; }
    public virtual DbSet<SistemaNivel> SistemaNiveis { get; set; }
    public virtual DbSet<SistemaMarcoNivel> SistemaMarcosNivel { get; set; }
    public virtual DbSet<SistemaFonteExperiencia> SistemaFontesExperiencia { get; set; }
    public virtual DbSet<SistemaRacaConfig> SistemaRacasConfig { get; set; }
    public virtual DbSet<SistemaRacaPassiva> SistemaRacasPassivas { get; set; }
    public virtual DbSet<SistemaAtributoConfig> SistemaAtributosConfig { get; set; }
    public virtual DbSet<SistemaRecursoConfig> SistemaRecursosConfig { get; set; }
    public virtual DbSet<SistemaMovimentoConfig> SistemaMovimentosConfig { get; set; }
    public virtual DbSet<SistemaPontosAcaoConfig> SistemaPontosAcaoConfig { get; set; }
    public virtual DbSet<SistemaAcaoConfig> SistemaAcoesConfig { get; set; }
    public virtual DbSet<SistemaResultadoDado> SistemaResultadosDado { get; set; }
    public virtual DbSet<SistemaTipoDano> SistemaTiposDano { get; set; }
    public virtual DbSet<SistemaTipoDefesa> SistemaTiposDefesa { get; set; }
    public virtual DbSet<SistemaTipoMagia> SistemaTiposMagia { get; set; }
    public virtual DbSet<SistemaSkillConfig> SistemaSkillsConfig { get; set; }
    public virtual DbSet<SistemaCondicao> SistemaCondicoes { get; set; }
    public virtual DbSet<SistemaDescansoConfig> SistemaDescansosConfig { get; set; }
    public virtual DbSet<SistemaMorteConfig> SistemaMortesConfig { get; set; }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        ConfigureSistemaRpg(modelBuilder);
        ConfigureProgressao(modelBuilder);
        ConfigureCriacao(modelBuilder);
        ConfigureExploracaoECombate(modelBuilder);
        ConfigurePoderesESobrevivencia(modelBuilder);
    }

    private static void ConfigureSistemaRpg(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SistemaRpg>(entity =>
        {
            entity.ToTable("sistemasrpg");
            entity.HasKey(e => e.IdSistemaRpg);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.DataAtualizacao).HasColumnType("datetime");
            entity.HasIndex(e => e.Codigo).IsUnique().HasDatabaseName("UX_SistemaRpg_Codigo");
            entity.HasOne(e => e.VersaoPublicada)
                .WithMany()
                .HasForeignKey(e => e.IdVersaoPublicada)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_SistemaRpg_VersaoPublicada");
        });

        modelBuilder.Entity<SistemaVersao>(entity =>
        {
            entity.ToTable("sistemaversoes");
            entity.HasKey(e => e.IdSistemaVersao);
            entity.Property(e => e.NumeroVersao).HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.Changelog).HasColumnType("text");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.DataAtualizacao).HasColumnType("datetime");
            entity.Property(e => e.DataPublicacao).HasColumnType("datetime");
            entity.Property(e => e.DataArquivamento).HasColumnType("datetime");
            entity.HasIndex(e => new { e.IdSistemaRpg, e.NumeroVersao })
                .IsUnique()
                .HasDatabaseName("UX_SistemaVersao_Sistema_Numero");
            entity.HasOne(e => e.SistemaRpg)
                .WithMany(e => e.Versoes)
                .HasForeignKey(e => e.IdSistemaRpg)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_SistemaVersao_SistemaRpg");
            entity.HasOne(e => e.VersaoBase)
                .WithMany(e => e.VersoesDerivadas)
                .HasForeignKey(e => e.IdVersaoBase)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_SistemaVersao_VersaoBase");
        });

        modelBuilder.Entity<SistemaModulo>(entity =>
        {
            entity.ToTable("sistemamodulos");
            entity.HasKey(e => e.IdSistemaModulo);
            entity.Property(e => e.TipoModulo).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.TipoModulo })
                .IsUnique()
                .HasDatabaseName("UX_SistemaModulo_Versao_Tipo");
            entity.HasOne(e => e.SistemaVersao)
                .WithMany(e => e.Modulos)
                .HasForeignKey(e => e.IdSistemaVersao)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Mesa>(entity =>
        {
            entity.Property(e => e.IdSistemaVersao).HasColumnName("IDSistemaVersao");
            entity.HasIndex(e => e.IdSistemaVersao).HasDatabaseName("IX_Mesa_SistemaVersao");
            entity.HasOne(e => e.SistemaVersao)
                .WithMany(e => e.Mesas)
                .HasForeignKey(e => e.IdSistemaVersao)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Mesa_SistemaVersao");
        });
    }

    private static void ConfigureProgressao(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SistemaNivel>(entity =>
        {
            entity.ToTable("sistemaniveis");
            entity.HasKey(e => e.IdSistemaNivel);
            entity.Property(e => e.Observacao).HasMaxLength(1000);
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Nivel }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Niveis)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaMarcoNivel>(entity =>
        {
            entity.ToTable("sistemamarcosnivel");
            entity.HasKey(e => e.IdSistemaMarcoNivel);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.TipoRecompensa).HasMaxLength(50);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.MarcosNivel)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaFonteExperiencia>(entity =>
        {
            entity.ToTable("sistemafontesexperiencia");
            entity.HasKey(e => e.IdSistemaFonteExperiencia);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.TipoTeste).HasMaxLength(50);
            entity.Property(e => e.Formula).HasMaxLength(500);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.FontesExperiencia)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureCriacao(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SistemaRacaConfig>(entity =>
        {
            entity.ToTable("sistemaracasconfig");
            entity.HasKey(e => e.IdSistemaRacaConfig);
            entity.Property(e => e.CodigoRaca).HasMaxLength(50);
            entity.Property(e => e.NomeExibicao).HasMaxLength(150);
            entity.Property(e => e.CodigoAtributoInicial).HasMaxLength(50);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.CodigoRaca }).IsUnique();
            entity.HasIndex(e => new { e.IdSistemaVersao, e.IdRaca }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Racas)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Raca).WithMany()
                .HasForeignKey(e => e.IdRaca).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_SistemaRacaConfig_Raca");
        });

        modelBuilder.Entity<SistemaRacaPassiva>(entity =>
        {
            entity.ToTable("sistemaracaspassivas");
            entity.HasKey(e => e.IdSistemaRacaPassiva);
            entity.Property(e => e.CodigoPassiva).HasMaxLength(50);
            entity.Property(e => e.NomeExibicao).HasMaxLength(150);
            entity.Property(e => e.Variante).HasMaxLength(100);
            entity.HasIndex(e => new { e.IdSistemaRacaConfig, e.CodigoPassiva, e.Variante }).IsUnique();
            entity.HasOne(e => e.SistemaRacaConfig).WithMany(e => e.Passivas)
                .HasForeignKey(e => e.IdSistemaRacaConfig).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Passiva).WithMany()
                .HasForeignKey(e => e.IdPassiva).OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_SistemaRacaPassiva_Passiva");
        });

        modelBuilder.Entity<SistemaAtributoConfig>(entity =>
        {
            entity.ToTable("sistemaatributosconfig");
            entity.HasKey(e => e.IdSistemaAtributoConfig);
            entity.Property(e => e.CodigoAtributo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Grupo).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.FormulaTeste).HasMaxLength(500);
            entity.Property(e => e.TipoLimiteUso).HasMaxLength(50);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.CodigoAtributo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Atributos)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaRecursoConfig>(entity =>
        {
            entity.ToTable("sistemarecursosconfig");
            entity.HasKey(e => e.IdSistemaRecursoConfig);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.ValorMinimo).HasPrecision(18, 2);
            entity.Property(e => e.ValorPadrao).HasPrecision(18, 2);
            entity.Property(e => e.ValorMaximo).HasPrecision(18, 2);
            entity.Property(e => e.RecuperacaoPadrao).HasPrecision(18, 2);
            entity.Property(e => e.RecuperacaoDescansoSimples).HasPrecision(18, 2);
            entity.Property(e => e.RecuperacaoDescansoNormal).HasPrecision(18, 2);
            entity.Property(e => e.RecuperacaoDescansoLongo).HasPrecision(18, 2);
            entity.Property(e => e.CondicaoAoZerar).HasMaxLength(50);
            entity.Property(e => e.FormulaValorInicial).HasMaxLength(500);
            entity.Property(e => e.FormulaValorMaximo).HasMaxLength(500);
            entity.Property(e => e.Formula).HasMaxLength(500);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Recursos)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureExploracaoECombate(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SistemaMovimentoConfig>(entity =>
        {
            entity.ToTable("sistemamovimentosconfig");
            entity.HasKey(e => e.IdSistemaMovimentoConfig);
            entity.Property(e => e.MetrosPorQuadrado).HasPrecision(10, 2);
            entity.Property(e => e.CustoEstaminaPorQuadrado).HasPrecision(10, 2);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.Property(e => e.Observacoes).HasColumnType("text");
            entity.HasIndex(e => e.IdSistemaVersao).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithOne(e => e.Movimento)
                .HasForeignKey<SistemaMovimentoConfig>(e => e.IdSistemaVersao)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaPontosAcaoConfig>(entity =>
        {
            entity.ToTable("sistemapontosacaoconfig");
            entity.HasKey(e => e.IdSistemaPontosAcaoConfig);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => e.IdSistemaVersao).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithOne(e => e.PontosAcao)
                .HasForeignKey<SistemaPontosAcaoConfig>(e => e.IdSistemaVersao)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaAcaoConfig>(entity =>
        {
            entity.ToTable("sistemaacoesconfig");
            entity.HasKey(e => e.IdSistemaAcaoConfig);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Tipo).HasMaxLength(50);
            entity.Property(e => e.CustoPontosAcao).HasPrecision(10, 2);
            entity.Property(e => e.CustoEstamina).HasPrecision(18, 2);
            entity.Property(e => e.CustoMana).HasPrecision(18, 2);
            entity.Property(e => e.Formula).HasMaxLength(500);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Acoes)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaResultadoDado>(entity =>
        {
            entity.ToTable("sistemaresultadosdado");
            entity.HasKey(e => e.IdSistemaResultadoDado);
            entity.Property(e => e.CodigoTeste).HasMaxLength(50);
            entity.Property(e => e.NomeTeste).HasMaxLength(150);
            entity.Property(e => e.Dado).HasMaxLength(20);
            entity.Property(e => e.CodigoResultado).HasMaxLength(50);
            entity.Property(e => e.NomeResultado).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.EfeitoJson).HasColumnType("json");
            entity.HasIndex(e => new
            {
                e.IdSistemaVersao,
                e.CodigoTeste,
                e.ResultadoMinimo,
                e.ResultadoMaximo,
            }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.ResultadosDado)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaTipoDano>(entity =>
        {
            entity.ToTable("sistematiposdano");
            entity.HasKey(e => e.IdSistemaTipoDano);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.TiposDano)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaTipoDefesa>(entity =>
        {
            entity.ToTable("sistematiposdefesa");
            entity.HasKey(e => e.IdSistemaTipoDefesa);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.TipoComportamento).HasMaxLength(50);
            entity.Property(e => e.Formula).HasMaxLength(500);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.TiposDefesa)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigurePoderesESobrevivencia(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SistemaTipoMagia>(entity =>
        {
            entity.ToTable("sistematiposmagia");
            entity.HasKey(e => e.IdSistemaTipoMagia);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.Cor).HasMaxLength(30);
            entity.Property(e => e.Afinidade).HasMaxLength(100);
            entity.Property(e => e.CustoBase).HasPrecision(18, 2);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.TiposMagia)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaSkillConfig>(entity =>
        {
            entity.ToTable("sistemaskillsconfig");
            entity.HasKey(e => e.IdSistemaSkillConfig);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.Property(e => e.Observacoes).HasColumnType("text");
            entity.HasIndex(e => e.IdSistemaVersao).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithOne(e => e.SkillConfig)
                .HasForeignKey<SistemaSkillConfig>(e => e.IdSistemaVersao)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaCondicao>(entity =>
        {
            entity.ToTable("sistemacondicoes");
            entity.HasKey(e => e.IdSistemaCondicao);
            entity.Property(e => e.Codigo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.Tipo).HasMaxLength(50);
            entity.Property(e => e.UnidadeDuracao).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ConfiguracaoPadraoJson).HasColumnType("json");
            entity.Property(e => e.ValorPadrao).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Codigo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Condicoes)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaDescansoConfig>(entity =>
        {
            entity.ToTable("sistemadescansosconfig");
            entity.HasKey(e => e.IdSistemaDescansoConfig);
            entity.Property(e => e.Tipo).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(150);
            entity.Property(e => e.RecuperacaoVida).HasPrecision(18, 2);
            entity.Property(e => e.RecuperacaoMana).HasPrecision(18, 2);
            entity.Property(e => e.RecuperacaoEstamina).HasPrecision(18, 2);
            entity.Property(e => e.TipoRecuperacao).HasConversion<string>().HasMaxLength(30);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.HasIndex(e => new { e.IdSistemaVersao, e.Tipo }).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithMany(e => e.Descansos)
                .HasForeignKey(e => e.IdSistemaVersao).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SistemaMorteConfig>(entity =>
        {
            entity.ToTable("sistemamortesconfig");
            entity.HasKey(e => e.IdSistemaMorteConfig);
            entity.Property(e => e.DadoSobrevivencia).HasMaxLength(20);
            entity.Property(e => e.MultiplicadorDanoDesmembramento).HasPrecision(10, 2);
            entity.Property(e => e.MultiplicadorDanoInstaKill).HasPrecision(10, 2);
            entity.Property(e => e.ConfiguracaoJson).HasColumnType("json");
            entity.Property(e => e.Observacoes).HasColumnType("text");
            entity.HasIndex(e => e.IdSistemaVersao).IsUnique();
            entity.HasOne(e => e.SistemaVersao).WithOne(e => e.Morte)
                .HasForeignKey<SistemaMorteConfig>(e => e.IdSistemaVersao)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
