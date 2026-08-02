using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddSistemasRpgConfiguraveis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IDSistemaVersao",
                table: "mesas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "sistemaacoesconfig",
                columns: table => new
                {
                    IdSistemaAcaoConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CustoPontosAcao = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    CustoEstamina = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CustoMana = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    EncerraTurno = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PermiteCombo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ExigeAlvo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Formula = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaacoesconfig", x => x.IdSistemaAcaoConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaatributosconfig",
                columns: table => new
                {
                    IdSistemaAtributoConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    CodigoAtributo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Grupo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValorMinimo = table.Column<int>(type: "int", nullable: false),
                    ValorMaximoNatural = table.Column<int>(type: "int", nullable: false),
                    ValorMaximoAbsoluto = table.Column<int>(type: "int", nullable: true),
                    ValorComum = table.Column<int>(type: "int", nullable: false),
                    FormulaTeste = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LimiteUso = table.Column<int>(type: "int", nullable: true),
                    TipoLimiteUso = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaatributosconfig", x => x.IdSistemaAtributoConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemacondicoes",
                columns: table => new
                {
                    IdSistemaCondicao = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DuracaoPadrao = table.Column<int>(type: "int", nullable: true),
                    UnidadeDuracao = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Empilhavel = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    RemocaoAutomatica = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PermiteSobrescrever = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ValorPadrao = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ConfiguracaoPadraoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemacondicoes", x => x.IdSistemaCondicao);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemadescansosconfig",
                columns: table => new
                {
                    IdSistemaDescansoConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DuracaoMinimaMinutos = table.Column<int>(type: "int", nullable: true),
                    DuracaoMaximaMinutos = table.Column<int>(type: "int", nullable: true),
                    RecuperacaoVida = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RecuperacaoMana = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RecuperacaoEstamina = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TipoRecuperacao = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExigeGuarda = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IntervaloTesteGuardaMinutos = table.Column<int>(type: "int", nullable: true),
                    PermiteAtividades = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemadescansosconfig", x => x.IdSistemaDescansoConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemafontesexperiencia",
                columns: table => new
                {
                    IdSistemaFonteExperiencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TipoTeste = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Formula = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValorMinimo = table.Column<int>(type: "int", nullable: true),
                    ValorMaximo = table.Column<int>(type: "int", nullable: true),
                    UsaVantagem = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemafontesexperiencia", x => x.IdSistemaFonteExperiencia);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemamarcosnivel",
                columns: table => new
                {
                    IdSistemaMarcoNivel = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Nivel = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TipoRecompensa = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemamarcosnivel", x => x.IdSistemaMarcoNivel);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemamodulos",
                columns: table => new
                {
                    IdSistemaModulo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    TipoModulo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Habilitado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    SchemaVersion = table.Column<int>(type: "int", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemamodulos", x => x.IdSistemaModulo);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemamortesconfig",
                columns: table => new
                {
                    IdSistemaMorteConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    LimiteBeiraDaMorte = table.Column<int>(type: "int", nullable: false),
                    QuantidadeTestesCombate = table.Column<int>(type: "int", nullable: false),
                    QuantidadeTestesForaCombate = table.Column<int>(type: "int", nullable: false),
                    SucessosNecessarios = table.Column<int>(type: "int", nullable: false),
                    DadoSobrevivencia = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResultadoMinimoSucesso = table.Column<int>(type: "int", nullable: false),
                    LimiteVidaDesmembramento = table.Column<int>(type: "int", nullable: false),
                    MultiplicadorDanoDesmembramento = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    LimiteVidaInstaKill = table.Column<int>(type: "int", nullable: false),
                    MultiplicadorDanoInstaKill = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    PermiteEstabilizacaoManual = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Observacoes = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemamortesconfig", x => x.IdSistemaMorteConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemamovimentosconfig",
                columns: table => new
                {
                    IdSistemaMovimentoConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    UsaGrid = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    MetrosPorQuadrado = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    MovimentoGratuito = table.Column<int>(type: "int", nullable: false),
                    CustoEstaminaPorQuadrado = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    MaximoQuadradosTurno = table.Column<int>(type: "int", nullable: true),
                    PermiteMoverAposAtaque = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Observacoes = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemamovimentosconfig", x => x.IdSistemaMovimentoConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaniveis",
                columns: table => new
                {
                    IdSistemaNivel = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Nivel = table.Column<int>(type: "int", nullable: false),
                    XpParaProximoNivel = table.Column<int>(type: "int", nullable: false),
                    PontosNivel = table.Column<int>(type: "int", nullable: false),
                    PontosAtributo = table.Column<int>(type: "int", nullable: false),
                    PontosSkill = table.Column<int>(type: "int", nullable: false),
                    PontosUltimate = table.Column<int>(type: "int", nullable: false),
                    PermiteNovaMagia = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PermiteNovaSkill = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Observacao = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaniveis", x => x.IdSistemaNivel);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemapontosacaoconfig",
                columns: table => new
                {
                    IdSistemaPontosAcaoConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Habilitado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PontosPorTurno = table.Column<int>(type: "int", nullable: false),
                    SegundosPorPonto = table.Column<int>(type: "int", nullable: false),
                    PermiteAcumular = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    LimiteAcumulado = table.Column<int>(type: "int", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemapontosacaoconfig", x => x.IdSistemaPontosAcaoConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaracasconfig",
                columns: table => new
                {
                    IdSistemaRacaConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    IdRaca = table.Column<int>(type: "int(11)", nullable: true),
                    CodigoRaca = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeExibicao = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Jogavel = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    VidaBase = table.Column<int>(type: "int", nullable: false),
                    EstaminaBase = table.Column<int>(type: "int", nullable: false),
                    ManaBase = table.Column<int>(type: "int", nullable: false),
                    CapacidadeCargaBase = table.Column<int>(type: "int", nullable: false),
                    CodigoAtributoInicial = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaracasconfig", x => x.IdSistemaRacaConfig);
                    table.ForeignKey(
                        name: "FK_SistemaRacaConfig_Raca",
                        column: x => x.IdRaca,
                        principalTable: "racas",
                        principalColumn: "IDRaca",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaracaspassivas",
                columns: table => new
                {
                    IdSistemaRacaPassiva = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaRacaConfig = table.Column<int>(type: "int", nullable: false),
                    IdPassiva = table.Column<int>(type: "int", nullable: true),
                    CodigoPassiva = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeExibicao = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Variante = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    NivelDesbloqueio = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaracaspassivas", x => x.IdSistemaRacaPassiva);
                    table.ForeignKey(
                        name: "FK_SistemaRacaPassiva_Passiva",
                        column: x => x.IdPassiva,
                        principalTable: "Passivas",
                        principalColumn: "Idpassiva",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_sistemaracaspassivas_sistemaracasconfig_IdSistemaRacaConfig",
                        column: x => x.IdSistemaRacaConfig,
                        principalTable: "sistemaracasconfig",
                        principalColumn: "IdSistemaRacaConfig",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemarecursosconfig",
                columns: table => new
                {
                    IdSistemaRecursoConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValorMinimo = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ValorPadrao = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ValorMaximo = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    PermiteValorNegativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    RecuperacaoPadrao = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RecuperacaoDescansoSimples = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RecuperacaoDescansoNormal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    RecuperacaoDescansoLongo = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CondicaoAoZerar = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FormulaValorInicial = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FormulaValorMaximo = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Formula = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemarecursosconfig", x => x.IdSistemaRecursoConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaresultadosdado",
                columns: table => new
                {
                    IdSistemaResultadoDado = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    CodigoTeste = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeTeste = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Dado = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    QuantidadeDados = table.Column<int>(type: "int", nullable: false),
                    ResultadoMinimo = table.Column<int>(type: "int", nullable: false),
                    ResultadoMaximo = table.Column<int>(type: "int", nullable: false),
                    ExigeNatural = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CodigoResultado = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeResultado = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EfeitoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaresultadosdado", x => x.IdSistemaResultadoDado);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaskillsconfig",
                columns: table => new
                {
                    IdSistemaSkillConfig = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    MaximoSkills = table.Column<int>(type: "int", nullable: false),
                    NivelMaximoSkill = table.Column<int>(type: "int", nullable: false),
                    MaximoUltimates = table.Column<int>(type: "int", nullable: false),
                    NivelDesbloqueioUltimate = table.Column<int>(type: "int", nullable: false),
                    MaximoMagias = table.Column<int>(type: "int", nullable: true),
                    UsaCooldown = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PermiteArtesEtericas = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Observacoes = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaskillsconfig", x => x.IdSistemaSkillConfig);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemasrpg",
                columns: table => new
                {
                    IdSistemaRpg = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IdVersaoPublicada = table.Column<int>(type: "int", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemasrpg", x => x.IdSistemaRpg);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaversoes",
                columns: table => new
                {
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaRpg = table.Column<int>(type: "int", nullable: false),
                    NumeroVersao = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdVersaoBase = table.Column<int>(type: "int", nullable: true),
                    Changelog = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataCriacao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataPublicacao = table.Column<DateTime>(type: "datetime", nullable: true),
                    DataArquivamento = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaversoes", x => x.IdSistemaVersao);
                    table.ForeignKey(
                        name: "FK_SistemaVersao_SistemaRpg",
                        column: x => x.IdSistemaRpg,
                        principalTable: "sistemasrpg",
                        principalColumn: "IdSistemaRpg",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SistemaVersao_VersaoBase",
                        column: x => x.IdVersaoBase,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistematiposdano",
                columns: table => new
                {
                    IdSistemaTipoDano = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IgnoraArmadura = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IgnoraProtecao = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IgnoraEscudo = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Periodico = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Area = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistematiposdano", x => x.IdSistemaTipoDano);
                    table.ForeignKey(
                        name: "FK_sistematiposdano_sistemaversoes_IdSistemaVersao",
                        column: x => x.IdSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistematiposdefesa",
                columns: table => new
                {
                    IdSistemaTipoDefesa = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OrdemAplicacao = table.Column<int>(type: "int", nullable: false),
                    TipoComportamento = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Formula = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistematiposdefesa", x => x.IdSistemaTipoDefesa);
                    table.ForeignKey(
                        name: "FK_sistematiposdefesa_sistemaversoes_IdSistemaVersao",
                        column: x => x.IdSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistematiposmagia",
                columns: table => new
                {
                    IdSistemaTipoMagia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", maxLength: 2000, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Cor = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Afinidade = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CustoBase = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistematiposmagia", x => x.IdSistemaTipoMagia);
                    table.ForeignKey(
                        name: "FK_sistematiposmagia_sistemaversoes_IdSistemaVersao",
                        column: x => x.IdSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Mesa_SistemaVersao",
                table: "mesas",
                column: "IDSistemaVersao");

            migrationBuilder.CreateIndex(
                name: "IX_sistemaacoesconfig_IdSistemaVersao_Codigo",
                table: "sistemaacoesconfig",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaatributosconfig_IdSistemaVersao_CodigoAtributo",
                table: "sistemaatributosconfig",
                columns: new[] { "IdSistemaVersao", "CodigoAtributo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemacondicoes_IdSistemaVersao_Codigo",
                table: "sistemacondicoes",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemadescansosconfig_IdSistemaVersao_Tipo",
                table: "sistemadescansosconfig",
                columns: new[] { "IdSistemaVersao", "Tipo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemafontesexperiencia_IdSistemaVersao_Codigo",
                table: "sistemafontesexperiencia",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemamarcosnivel_IdSistemaVersao_Codigo",
                table: "sistemamarcosnivel",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_SistemaModulo_Versao_Tipo",
                table: "sistemamodulos",
                columns: new[] { "IdSistemaVersao", "TipoModulo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemamortesconfig_IdSistemaVersao",
                table: "sistemamortesconfig",
                column: "IdSistemaVersao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemamovimentosconfig_IdSistemaVersao",
                table: "sistemamovimentosconfig",
                column: "IdSistemaVersao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaniveis_IdSistemaVersao_Nivel",
                table: "sistemaniveis",
                columns: new[] { "IdSistemaVersao", "Nivel" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemapontosacaoconfig_IdSistemaVersao",
                table: "sistemapontosacaoconfig",
                column: "IdSistemaVersao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaracasconfig_IdRaca",
                table: "sistemaracasconfig",
                column: "IdRaca");

            migrationBuilder.CreateIndex(
                name: "IX_sistemaracasconfig_IdSistemaVersao_CodigoRaca",
                table: "sistemaracasconfig",
                columns: new[] { "IdSistemaVersao", "CodigoRaca" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaracasconfig_IdSistemaVersao_IdRaca",
                table: "sistemaracasconfig",
                columns: new[] { "IdSistemaVersao", "IdRaca" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaracaspassivas_IdPassiva",
                table: "sistemaracaspassivas",
                column: "IdPassiva");

            migrationBuilder.CreateIndex(
                name: "IX_sistemaracaspassivas_IdSistemaRacaConfig_CodigoPassiva_Varia~",
                table: "sistemaracaspassivas",
                columns: new[] { "IdSistemaRacaConfig", "CodigoPassiva", "Variante" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemarecursosconfig_IdSistemaVersao_Codigo",
                table: "sistemarecursosconfig",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaresultadosdado_IdSistemaVersao_CodigoTeste_ResultadoM~",
                table: "sistemaresultadosdado",
                columns: new[] { "IdSistemaVersao", "CodigoTeste", "ResultadoMinimo", "ResultadoMaximo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaskillsconfig_IdSistemaVersao",
                table: "sistemaskillsconfig",
                column: "IdSistemaVersao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemasrpg_IdVersaoPublicada",
                table: "sistemasrpg",
                column: "IdVersaoPublicada");

            migrationBuilder.CreateIndex(
                name: "UX_SistemaRpg_Codigo",
                table: "sistemasrpg",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistematiposdano_IdSistemaVersao_Codigo",
                table: "sistematiposdano",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistematiposdefesa_IdSistemaVersao_Codigo",
                table: "sistematiposdefesa",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistematiposmagia_IdSistemaVersao_Codigo",
                table: "sistematiposmagia",
                columns: new[] { "IdSistemaVersao", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaversoes_IdVersaoBase",
                table: "sistemaversoes",
                column: "IdVersaoBase");

            migrationBuilder.CreateIndex(
                name: "UX_SistemaVersao_Sistema_Numero",
                table: "sistemaversoes",
                columns: new[] { "IdSistemaRpg", "NumeroVersao" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Mesa_SistemaVersao",
                table: "mesas",
                column: "IDSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemaacoesconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemaacoesconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemaatributosconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemaatributosconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemacondicoes_sistemaversoes_IdSistemaVersao",
                table: "sistemacondicoes",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemadescansosconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemadescansosconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemafontesexperiencia_sistemaversoes_IdSistemaVersao",
                table: "sistemafontesexperiencia",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemamarcosnivel_sistemaversoes_IdSistemaVersao",
                table: "sistemamarcosnivel",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemamodulos_sistemaversoes_IdSistemaVersao",
                table: "sistemamodulos",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemamortesconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemamortesconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemamovimentosconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemamovimentosconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemaniveis_sistemaversoes_IdSistemaVersao",
                table: "sistemaniveis",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemapontosacaoconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemapontosacaoconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemaracasconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemaracasconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemarecursosconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemarecursosconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemaresultadosdado_sistemaversoes_IdSistemaVersao",
                table: "sistemaresultadosdado",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_sistemaskillsconfig_sistemaversoes_IdSistemaVersao",
                table: "sistemaskillsconfig",
                column: "IdSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SistemaRpg_VersaoPublicada",
                table: "sistemasrpg",
                column: "IdVersaoPublicada",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mesa_SistemaVersao",
                table: "mesas");

            migrationBuilder.DropForeignKey(
                name: "FK_SistemaRpg_VersaoPublicada",
                table: "sistemasrpg");

            migrationBuilder.DropTable(
                name: "sistemaacoesconfig");

            migrationBuilder.DropTable(
                name: "sistemaatributosconfig");

            migrationBuilder.DropTable(
                name: "sistemacondicoes");

            migrationBuilder.DropTable(
                name: "sistemadescansosconfig");

            migrationBuilder.DropTable(
                name: "sistemafontesexperiencia");

            migrationBuilder.DropTable(
                name: "sistemamarcosnivel");

            migrationBuilder.DropTable(
                name: "sistemamodulos");

            migrationBuilder.DropTable(
                name: "sistemamortesconfig");

            migrationBuilder.DropTable(
                name: "sistemamovimentosconfig");

            migrationBuilder.DropTable(
                name: "sistemaniveis");

            migrationBuilder.DropTable(
                name: "sistemapontosacaoconfig");

            migrationBuilder.DropTable(
                name: "sistemaracaspassivas");

            migrationBuilder.DropTable(
                name: "sistemarecursosconfig");

            migrationBuilder.DropTable(
                name: "sistemaresultadosdado");

            migrationBuilder.DropTable(
                name: "sistemaskillsconfig");

            migrationBuilder.DropTable(
                name: "sistematiposdano");

            migrationBuilder.DropTable(
                name: "sistematiposdefesa");

            migrationBuilder.DropTable(
                name: "sistematiposmagia");

            migrationBuilder.DropTable(
                name: "sistemaracasconfig");

            migrationBuilder.DropTable(
                name: "sistemaversoes");

            migrationBuilder.DropTable(
                name: "sistemasrpg");

            migrationBuilder.DropIndex(
                name: "IX_Mesa_SistemaVersao",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "IDSistemaVersao",
                table: "mesas");
        }
    }
}
