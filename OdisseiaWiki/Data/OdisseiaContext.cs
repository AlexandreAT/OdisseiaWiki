using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Models;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace OdisseiaWiki.Data;

public partial class OdisseiaContext : DbContext
{
    public OdisseiaContext()
    {
    }

    public OdisseiaContext(DbContextOptions<OdisseiaContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cidade> Cidades { get; set; }

    public virtual DbSet<Infolore> Infolores { get; set; }

    public virtual DbSet<Mesa> Mesas { get; set; }

    public virtual DbSet<MesaEntidadeConfig> MesaEntidadeConfigs { get; set; }

    public virtual DbSet<Mesausuario> Mesausuarios { get; set; }

    public virtual DbSet<MesaSolicitacaoEntrada> MesaSolicitacoesEntrada { get; set; }

    public virtual DbSet<MesaExpulsaoRegistro> MesaExpulsoesRegistro { get; set; }

    public virtual DbSet<Personageminfolore> Personageminfolores { get; set; }

    public virtual DbSet<Personagen> Personagens { get; set; }

    public virtual DbSet<PersonagemVisibilidade> PersonagensVisibilidade { get; set; }

    public virtual DbSet<PersonagemJogador> PersonagemJogadores { get; set; }

    public virtual DbSet<Raca> Racas { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<UsuarioEmailToken> UsuariosEmailTokens { get; set; }

    public virtual DbSet<Item> Itens { get; set; }

    public DbSet<Page> Pages { get; set; }

    public DbSet<PageBlock> PageBlocks { get; set; }

    public virtual DbSet<Passiva> Passivas { get; set; }

    public virtual DbSet<Passivaraca> Passivaracas { get; set; }

    public virtual DbSet<Proficiencia> Proficiencias { get; set; }

    public virtual DbSet<PersonagemProficiencia> PersonagemProficiencias { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_general_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Page>()
            .HasMany(p => p.Blocks)
            .WithOne(b => b.Page)
            .HasForeignKey(b => b.IdPage)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Cidade>(entity =>
        {
            entity.HasKey(e => e.Idcidade).HasName("PRIMARY");

            entity.ToTable("cidades");

            entity.Property(e => e.Idcidade)
                .HasColumnType("int(11)")
                .HasColumnName("IDCidade");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.GaleriaImagem).HasColumnType("longtext");
            entity.Property(e => e.Tags).HasColumnType("longtext");
            entity.Property(e => e.PontosDeInteresse).HasColumnType("longtext");
            entity.Property(e => e.Visivel).HasColumnType("tinyint(1)");
        });

        modelBuilder.Entity<Infolore>(entity =>
        {
            entity.HasKey(e => e.IdinfoLore).HasName("PRIMARY");

            entity.ToTable("infolore");

            entity.Property(e => e.IdinfoLore)
                .HasColumnType("int(11)")
                .HasColumnName("IDInfoLore");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.Conteudo).HasColumnType("text");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Titulo).HasMaxLength(150);
            entity.Property(e => e.Tags).HasColumnType("longtext");
            entity.Property(e => e.Visivel).HasColumnType("tinyint(1)");
        });

        modelBuilder.Entity<Mesa>(entity =>
        {
            entity.HasKey(e => e.Idmesa).HasName("PRIMARY");

            entity.ToTable("mesas");

            entity.HasIndex(e => e.IdusuarioCriacao, "ID usuario criacao");
            entity.HasIndex(e => e.CodigoSistema)
                .IsUnique()
                .HasDatabaseName("UX_Mesa_CodigoSistema");

            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.DataAtualizacao).HasColumnType("datetime");
            entity.Property(e => e.CodigoSistema).HasMaxLength(50);
            entity.Property(e => e.IdusuarioCriacao)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuarioCriacao");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.Descricao).HasMaxLength(500);
            entity.Property(e => e.Tags).HasColumnType("longtext");
            entity.Property(e => e.LimiteJogadores).HasDefaultValue(4);
            entity.Property(e => e.PadraoSistema).HasColumnType("tinyint(1)");
            entity.Property(e => e.AoVivo).HasColumnType("tinyint(1)").HasDefaultValue(false);

            entity.HasOne(d => d.IdusuarioCriacaoNavigation).WithMany(p => p.Mesas)
                .HasForeignKey(d => d.IdusuarioCriacao)
                .HasConstraintName("ID usuario criacao");
        });

        modelBuilder.Entity<MesaEntidadeConfig>(entity =>
        {
            entity.HasKey(e => e.IdmesaEntidadeConfig).HasName("PRIMARY");

            entity.ToTable("mesaentidadeconfig");

            entity.HasIndex(e => new { e.Idmesa, e.TipoEntidade, e.Identidade })
                .IsUnique()
                .HasDatabaseName("UX_MesaEntidadeConfig_Mesa_Tipo_Entidade");

            entity.Property(e => e.IdmesaEntidadeConfig)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesaEntidadeConfig");
            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.TipoEntidade).HasConversion<string>().HasMaxLength(50);
            entity.Property(e => e.Identidade).HasMaxLength(100);
            entity.Property(e => e.ConfigJson).HasColumnType("json");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.DataAtualizacao).HasColumnType("datetime");

            entity.HasOne(d => d.IdmesaNavigation).WithMany(p => p.MesaEntidadeConfigs)
                .HasForeignKey(d => d.Idmesa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_MesaEntidadeConfig_Mesa");
        });

        modelBuilder.Entity<Mesausuario>(entity =>
        {
            entity.HasKey(e => e.IdmesaUsuario).HasName("PRIMARY");

            entity.ToTable("mesausuarios");

            entity.HasIndex(e => e.Idmesa, "ID mesa");

            entity.HasIndex(e => e.Idusuario, "ID usuario");

            entity.HasIndex(e => new { e.Idmesa, e.Idusuario })
                .IsUnique()
                .HasDatabaseName("UX_MesaUsuario_Mesa_Usuario");

            entity.Property(e => e.IdmesaUsuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesaUsuario");
            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");
            entity.Property(e => e.DataEntrada).HasColumnType("datetime");

            entity.HasOne(d => d.IdmesaNavigation).WithMany(p => p.Mesausuarios)
                .HasForeignKey(d => d.Idmesa)
                .HasConstraintName("ID mesa");

            entity.HasOne(d => d.IdusuarioNavigation).WithMany(p => p.Mesausuarios)
                .HasForeignKey(d => d.Idusuario)
                .HasConstraintName("ID usuario");
        });

        modelBuilder.Entity<MesaSolicitacaoEntrada>(entity =>
        {
            entity.ToTable("mesasolicitacoesentrada");
            entity.HasKey(e => e.IdMesaSolicitacaoEntrada);
            entity.HasIndex(e => new { e.Idmesa, e.Idusuario })
                .IsUnique()
                .HasDatabaseName("UX_MesaSolicitacao_Mesa_Usuario");
            entity.Property(e => e.IdMesaSolicitacaoEntrada)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesaSolicitacaoEntrada");
            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");
            entity.Property(e => e.Mensagem).HasMaxLength(200);
            entity.Property(e => e.DataSolicitacao).HasColumnType("datetime");
            entity.HasOne(e => e.Mesa)
                .WithMany(e => e.SolicitacoesEntrada)
                .HasForeignKey(e => e.Idmesa)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Usuario)
                .WithMany(e => e.MesaSolicitacoesEntrada)
                .HasForeignKey(e => e.Idusuario)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MesaExpulsaoRegistro>(entity =>
        {
            entity.ToTable("mesaexpulsoesregistro");
            entity.HasKey(e => e.IdMesaExpulsaoRegistro);
            entity.Property(e => e.IdMesaExpulsaoRegistro)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesaExpulsaoRegistro");
            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");
            entity.Property(e => e.IdusuarioMestre)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuarioMestre");
            entity.Property(e => e.NomeMesa).HasMaxLength(100);
            entity.Property(e => e.Motivo).HasMaxLength(500);
            entity.Property(e => e.DataExpulsao).HasColumnType("datetime");
            entity.Property(e => e.DataLeitura).HasColumnType("datetime");
            entity.HasIndex(e => new { e.Idusuario, e.DataLeitura });
            entity.HasOne(e => e.Mesa)
                .WithMany(e => e.Expulsoes)
                .HasForeignKey(e => e.Idmesa)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Usuario)
                .WithMany(e => e.MesaExpulsoesRecebidas)
                .HasForeignKey(e => e.Idusuario)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Mestre)
                .WithMany(e => e.MesaExpulsoesAplicadas)
                .HasForeignKey(e => e.IdusuarioMestre)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Personageminfolore>(entity =>
        {
            entity.HasKey(e => e.IdpersonagemInfoLore).HasName("PRIMARY");

            entity.ToTable("personageminfolore");

            entity.Property(e => e.IdpersonagemInfoLore)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagemInfoLore");
            entity.Property(e => e.IdinfoLore)
                .HasColumnType("int(11)")
                .HasColumnName("IDInfoLore");
            entity.Property(e => e.Idpersonagem)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagem");
        });

        modelBuilder.Entity<Personagen>(entity =>
        {
            entity.HasKey(e => e.Idpersonagem).HasName("PRIMARY");

            entity.ToTable("personagens");

            entity.HasIndex(e => e.Idcidade, "ID cidades");

            entity.HasIndex(e => e.Idraca, "ID racas");

            entity.Property(e => e.Idpersonagem)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagem");
            entity.Property(e => e.Alinhamento).HasMaxLength(50);
            entity.Property(e => e.Costumes).HasColumnType("text");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.Idcidade)
                .HasColumnType("int(11)")
                .HasColumnName("IDCidade");
            entity.Property(e => e.Idraca)
                .HasColumnType("int(11)")
                .HasColumnName("IDRaca");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nanites).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.Tracos).HasColumnType("text");
            entity.Property(e => e.Tags).HasColumnType("longtext");
            entity.Property(e => e.Visivel).HasColumnType("tinyint(1)");

            entity.HasOne(d => d.IdcidadeNavigation).WithMany(p => p.Personagens)
                .HasForeignKey(d => d.Idcidade)
                .HasConstraintName("ID cidades");

            entity.HasOne(d => d.IdracaNavigation).WithMany(p => p.Personagens)
                .HasForeignKey(d => d.Idraca)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ID racas");
        });

        modelBuilder.Entity<PersonagemVisibilidade>(entity =>
        {
            entity.HasKey(e => e.IdpersonagemVisibilidade).HasName("PRIMARY");

            entity.ToTable("personagensvisibilidade", table => table.HasCheckConstraint(
                "CK_PersonagemVisibilidade_Alvo",
                "(`IDPersonagem` IS NOT NULL AND `IDPersonagemJogador` IS NULL) OR " +
                "(`IDPersonagem` IS NULL AND `IDPersonagemJogador` IS NOT NULL)"));

            entity.HasIndex(e => e.Idpersonagem)
                .IsUnique()
                .HasDatabaseName("UX_PersonagemVisibilidade_Personagem");
            entity.HasIndex(e => e.IdpersonagemJogador)
                .IsUnique()
                .HasDatabaseName("UX_PersonagemVisibilidade_PersonagemJogador");

            entity.Property(e => e.IdpersonagemVisibilidade)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagemVisibilidade");
            entity.Property(e => e.Idpersonagem)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagem");
            entity.Property(e => e.IdpersonagemJogador)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagemJogador");
            entity.Property(e => e.Vida).HasColumnType("tinyint(1)");
            entity.Property(e => e.Estamina).HasColumnType("tinyint(1)");
            entity.Property(e => e.Mana).HasColumnType("tinyint(1)");
            entity.Property(e => e.CapacidadeCarga).HasColumnType("tinyint(1)");
            entity.Property(e => e.AtributosPrincipais).HasColumnType("tinyint(1)");
            entity.Property(e => e.AtributosSecundarios).HasColumnType("tinyint(1)");
            entity.Property(e => e.Defesas).HasColumnType("tinyint(1)");
            entity.Property(e => e.Imagem).HasColumnType("tinyint(1)");
            entity.Property(e => e.Historia).HasColumnType("tinyint(1)");
            entity.Property(e => e.Raca).HasColumnType("tinyint(1)");
            entity.Property(e => e.Cidade).HasColumnType("tinyint(1)");
            entity.Property(e => e.Nome).HasColumnType("tinyint(1)");
            entity.Property(e => e.Alinhamento).HasColumnType("tinyint(1)");
            entity.Property(e => e.TracosPersonalidade).HasColumnType("tinyint(1)");
            entity.Property(e => e.PersonagensRelacionados).HasColumnType("tinyint(1)");
            entity.Property(e => e.Inventario).HasColumnType("tinyint(1)");
            entity.Property(e => e.Proteses).HasColumnType("tinyint(1)");
            entity.Property(e => e.Passivas).HasColumnType("tinyint(1)");
            entity.Property(e => e.Ultimate).HasColumnType("tinyint(1)");
            entity.Property(e => e.Skills).HasColumnType("tinyint(1)");
            entity.Property(e => e.Magias).HasColumnType("tinyint(1)");
            entity.Property(e => e.Galeria).HasColumnType("tinyint(1)");
            entity.Property(e => e.Xp).HasColumnType("tinyint(1)");
            entity.Property(e => e.Nivel).HasColumnType("tinyint(1)");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.DataAtualizacao).HasColumnType("datetime");

            entity.HasOne(e => e.Personagem)
                .WithOne(e => e.ConfiguracaoVisibilidade)
                .HasForeignKey<PersonagemVisibilidade>(e => e.Idpersonagem)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_PersonagemVisibilidade_Personagem");

            entity.HasOne(e => e.PersonagemJogador)
                .WithOne(e => e.ConfiguracaoVisibilidade)
                .HasForeignKey<PersonagemVisibilidade>(e => e.IdpersonagemJogador)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_PersonagemVisibilidade_PersonagemJogador");
        });

        modelBuilder.Entity<Raca>(entity =>
        {
            entity.HasKey(e => e.Idraca).HasName("PRIMARY");

            entity.ToTable("racas");

            entity.Property(e => e.Idraca)
                .HasColumnType("int(11)")
                .HasColumnName("IDRaca");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.GaleriaImagem).HasColumnType("longtext");
            entity.Property(e => e.Tags).HasColumnType("longtext");
            entity.Property(e => e.Variacoes).HasColumnType("longtext");
            entity.Property(e => e.Visivel).HasColumnType("tinyint(1)");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Idusuario).HasName("PRIMARY");

            entity.ToTable("usuarios");

            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");
            entity.Property(e => e.Celular).HasMaxLength(15);
            entity.Property(e => e.DataRegistro).HasColumnType("datetime");
            entity.Property(e => e.EmailConfirmado)
                .HasColumnType("tinyint(1)")
                .HasDefaultValue(true);
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.ImagemUrl).HasMaxLength(255);
            entity.Property(e => e.Nickname).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.Senha).HasMaxLength(100);
        });

        modelBuilder.Entity<UsuarioEmailToken>(entity =>
        {
            entity.HasKey(e => e.IdusuarioEmailToken).HasName("PRIMARY");

            entity.ToTable("usuariosemailtokens");

            entity.HasIndex(e => e.HashToken)
                .IsUnique()
                .HasDatabaseName("UX_UsuarioEmailToken_Hash");
            entity.HasIndex(e => new { e.Idusuario, e.Tipo, e.DataUso, e.DataInvalidacao })
                .HasDatabaseName("IX_UsuarioEmailToken_Usuario_Tipo_Ativo");

            entity.Property(e => e.IdusuarioEmailToken)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuarioEmailToken");
            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");
            entity.Property(e => e.Tipo)
                .HasConversion<string>()
                .HasMaxLength(30);
            entity.Property(e => e.HashToken).HasMaxLength(64);
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.DataExpiracao).HasColumnType("datetime");
            entity.Property(e => e.DataUso).HasColumnType("datetime");
            entity.Property(e => e.DataInvalidacao).HasColumnType("datetime");

            entity.HasOne(e => e.Usuario)
                .WithMany(e => e.EmailTokens)
                .HasForeignKey(e => e.Idusuario)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_UsuarioEmailToken_Usuario");
        });

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Iditem).HasName("PRIMARY");

            entity.ToTable("itens");

            entity.Property(e => e.Iditem)
                .HasColumnName("IDItem")
                .IsRequired();

            entity.Property(e => e.Nome).HasMaxLength(100);

            entity.Property(e => e.Tipo)
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasColumnName("Tipo");

            entity.Property(e => e.DataCriacao)
                .HasColumnType("datetime");

            entity.Property(e => e.Discricao)
                .HasDefaultValue(0);
            
            entity.Property(e => e.Tags).HasColumnType("longtext");
            entity.Property(e => e.Visivel).HasColumnType("tinyint(1)");
        });

        modelBuilder.Entity<PersonagemJogador>(entity =>
        {
            entity.HasKey(e => e.IdpersonagemJogador).HasName("PRIMARY");

            entity.ToTable("personagensJogador");

            entity.HasIndex(e => e.Idmesa, "ID_mesas");
            entity.HasIndex(e => e.Idusuario, "ID_usuarios");
            entity.HasIndex(e => e.Idraca, "ID_racas");
            entity.HasIndex(e => e.Idcidade, "ID_cidades");

            entity.Property(e => e.IdpersonagemJogador)
                .HasColumnType("int(11)")
                .HasColumnName("IDPersonagemJogador");

            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");

            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");

            entity.Property(e => e.Idraca)
                .HasColumnType("int(11)")
                .HasColumnName("IDRaca");

            entity.Property(e => e.Idcidade)
                .HasColumnType("int(11)")
                .HasColumnName("IDCidade");

            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.Alinhamento).HasMaxLength(50);
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nanites).HasMaxLength(50);

            entity.Property(e => e.Costumes).HasColumnType("text");
            entity.Property(e => e.Tracos).HasColumnType("text");
            entity.Property(e => e.Historia).HasColumnType("text");
            entity.Property(e => e.InventarioJson).HasColumnType("json");
            entity.Property(e => e.StatusJson).HasColumnType("json");
            entity.Property(e => e.InfoSecundariasJson).HasColumnType("text");
            entity.Property(e => e.Visivel).HasColumnType("tinyint(1)").HasDefaultValue(true);

            entity.Property(e => e.DataCriacao);
              
            entity.HasOne(d => d.Mesa).WithMany(p => p.PersonagensJogadores)
                .HasForeignKey(d => d.Idmesa)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_PersonagensJogador_Mesa");

            entity.HasOne(d => d.Usuario).WithMany(p => p.PersonagensJogadores)
                .HasForeignKey(d => d.Idusuario)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_PersonagensJogador_Usuario");

            entity.HasOne(d => d.IdracaNavigation).WithMany()
                .HasForeignKey(d => d.Idraca)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PersonagensJogador_Raca");

            entity.HasOne(d => d.IdcidadeNavigation).WithMany()
                .HasForeignKey(d => d.Idcidade)
                .HasConstraintName("FK_PersonagensJogador_Cidade");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
