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

    public virtual DbSet<Mesaracaconfig> Mesaracaconfigs { get; set; }

    public virtual DbSet<Mesausuario> Mesausuarios { get; set; }

    public virtual DbSet<Personageminfolore> Personageminfolores { get; set; }

    public virtual DbSet<Personagen> Personagens { get; set; }

    public virtual DbSet<PersonagemJogador> PersonagemJogadores { get; set; }

    public virtual DbSet<Raca> Racas { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<Item> Itens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_general_ci")
            .HasCharSet("utf8mb4");

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
        });

        modelBuilder.Entity<Infolore>(entity =>
        {
            entity.HasKey(e => e.IdinfoLore).HasName("PRIMARY");

            entity.ToTable("infolore");

            entity.Property(e => e.IdinfoLore)
                .HasColumnType("int(11)")
                .HasColumnName("IDInfoLore");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.Descricao).HasColumnType("text");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Ordem).HasColumnType("int(11)");
            entity.Property(e => e.Titulo).HasMaxLength(150);
        });

        modelBuilder.Entity<Mesa>(entity =>
        {
            entity.HasKey(e => e.Idmesa).HasName("PRIMARY");

            entity.ToTable("mesas");

            entity.HasIndex(e => e.IdusuarioCriacao, "ID usuario criacao");

            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.IdusuarioCriacao)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuarioCriacao");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nome).HasMaxLength(100);

            entity.HasOne(d => d.IdusuarioCriacaoNavigation).WithMany(p => p.Mesas)
                .HasForeignKey(d => d.IdusuarioCriacao)
                .HasConstraintName("ID usuario criacao");
        });

        modelBuilder.Entity<Mesaracaconfig>(entity =>
        {
            entity.HasKey(e => e.IdmesaRacaConfig).HasName("PRIMARY");

            entity.ToTable("mesaracaconfig");

            entity.HasIndex(e => e.Idmesa, "ID mesas");

            entity.HasIndex(e => e.Idraca, "ID raca");

            entity.Property(e => e.IdmesaRacaConfig)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesaRacaConfig");
            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.Idraca)
                .HasColumnType("int(11)")
                .HasColumnName("IDRaca");

            entity.HasOne(d => d.IdmesaNavigation).WithMany(p => p.Mesaracaconfigs)
                .HasForeignKey(d => d.Idmesa)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ID mesas");

            entity.HasOne(d => d.IdracaNavigation).WithMany(p => p.Mesaracaconfigs)
                .HasForeignKey(d => d.Idraca)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ID raca");
        });

        modelBuilder.Entity<Mesausuario>(entity =>
        {
            entity.HasKey(e => e.IdmesaUsuario).HasName("PRIMARY");

            entity.ToTable("mesausuarios");

            entity.HasIndex(e => e.Idmesa, "ID mesa");

            entity.HasIndex(e => e.Idusuario, "ID usuario");

            entity.Property(e => e.IdmesaUsuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesaUsuario");
            entity.Property(e => e.Idmesa)
                .HasColumnType("int(11)")
                .HasColumnName("IDMesa");
            entity.Property(e => e.Idusuario)
                .HasColumnType("int(11)")
                .HasColumnName("IDUsuario");

            entity.HasOne(d => d.IdmesaNavigation).WithMany(p => p.Mesausuarios)
                .HasForeignKey(d => d.Idmesa)
                .HasConstraintName("ID mesa");

            entity.HasOne(d => d.IdusuarioNavigation).WithMany(p => p.Mesausuarios)
                .HasForeignKey(d => d.Idusuario)
                .HasConstraintName("ID usuario");
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

            entity.HasOne(d => d.IdcidadeNavigation).WithMany(p => p.Personagens)
                .HasForeignKey(d => d.Idcidade)
                .HasConstraintName("ID cidades");

            entity.HasOne(d => d.IdracaNavigation).WithMany(p => p.Personagens)
                .HasForeignKey(d => d.Idraca)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ID racas");
        });

        modelBuilder.Entity<Raca>(entity =>
        {
            entity.HasKey(e => e.Idraca).HasName("PRIMARY");

            entity.ToTable("racas");

            entity.Property(e => e.Idraca)
                .HasColumnType("int(11)")
                .HasColumnName("IDRaca");
            entity.Property(e => e.DataCriacao).HasColumnType("datetime");
            entity.Property(e => e.Imagem).HasMaxLength(255);
            entity.Property(e => e.Nome).HasMaxLength(100);
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
            entity.Property(e => e.Email).HasMaxLength(50);
            entity.Property(e => e.ImagemUrl).HasMaxLength(255);
            entity.Property(e => e.Nickname).HasMaxLength(50);
            entity.Property(e => e.Nome).HasMaxLength(100);
            entity.Property(e => e.Senha).HasMaxLength(100);
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
