using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddGameRunFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gamemodeversions",
                columns: table => new
                {
                    IDGameModeVersion = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NumeroVersao = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SchemaVersion = table.Column<int>(type: "int", nullable: false),
                    ConfiguracaoJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CriadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    PublicadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gamemodeversions", x => x.IDGameModeVersion);
                    table.ForeignKey(
                        name: "FK_GameModeVersion_SistemaVersao",
                        column: x => x.IDSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "gameruns",
                columns: table => new
                {
                    IDGameRun = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDUsuario = table.Column<int>(type: "int(11)", nullable: false),
                    IDPersonagemJogadorOrigem = table.Column<int>(type: "int", nullable: false),
                    IDGameModeVersion = table.Column<int>(type: "int", nullable: false),
                    IDSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Seed = table.Column<long>(type: "bigint", nullable: false),
                    Fase = table.Column<int>(type: "int", nullable: false),
                    NoAtualId = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Revisao = table.Column<long>(type: "bigint", nullable: false),
                    ChaveAtiva = table.Column<int>(type: "int", nullable: true, computedColumnSql: "CASE WHEN `Status` = 'Ativa' THEN 1 ELSE NULL END", stored: true),
                    SnapshotInicialJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EstadoAtualJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MapaJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LoadoutJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CriadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AtualizadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EncerradaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gameruns", x => x.IDGameRun);
                    table.ForeignKey(
                        name: "FK_GameRun_ModeVersion",
                        column: x => x.IDGameModeVersion,
                        principalTable: "gamemodeversions",
                        principalColumn: "IDGameModeVersion",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GameRun_SistemaVersao",
                        column: x => x.IDSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GameRun_Usuario",
                        column: x => x.IDUsuario,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "gameruncommands",
                columns: table => new
                {
                    IDGameRunCommand = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDGameRun = table.Column<long>(type: "bigint", nullable: false),
                    IDUsuario = table.Column<int>(type: "int", nullable: false),
                    ChaveIdempotencia = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HashPayload = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tipo = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RevisaoEsperada = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RespostaJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CriadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ConcluidoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gameruncommands", x => x.IDGameRunCommand);
                    table.ForeignKey(
                        name: "FK_GameRunCommand_Run",
                        column: x => x.IDGameRun,
                        principalTable: "gameruns",
                        principalColumn: "IDGameRun",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "UX_GameModeVersion_Sistema_Codigo_Versao",
                table: "gamemodeversions",
                columns: new[] { "IDSistemaVersao", "Codigo", "NumeroVersao" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gameruncommands_IDGameRun",
                table: "gameruncommands",
                column: "IDGameRun");

            migrationBuilder.CreateIndex(
                name: "UX_GameRunCommand_Usuario_Chave",
                table: "gameruncommands",
                columns: new[] { "IDUsuario", "ChaveIdempotencia" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GameRun_Usuario_Criacao",
                table: "gameruns",
                columns: new[] { "IDUsuario", "CriadaEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_gameruns_IDGameModeVersion",
                table: "gameruns",
                column: "IDGameModeVersion");

            migrationBuilder.CreateIndex(
                name: "IX_gameruns_IDSistemaVersao",
                table: "gameruns",
                column: "IDSistemaVersao");

            migrationBuilder.CreateIndex(
                name: "UX_GameRun_Usuario_Ativa",
                table: "gameruns",
                columns: new[] { "IDUsuario", "ChaveAtiva" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gameruncommands");

            migrationBuilder.DropTable(
                name: "gameruns");

            migrationBuilder.DropTable(
                name: "gamemodeversions");
        }
    }
}
