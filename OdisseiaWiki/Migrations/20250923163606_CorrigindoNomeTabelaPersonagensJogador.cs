using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class CorrigindoNomeTabelaPersonagensJogador : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "personagensJogador",
                columns: table => new
                {
                    IDPersonagemJogador = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesa = table.Column<int>(type: "int(11)", nullable: false),
                    IDUsuario = table.Column<int>(type: "int(11)", nullable: false),
                    InfoSecundariasJson = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDRaca = table.Column<int>(type: "int(11)", nullable: false),
                    IDCidade = table.Column<int>(type: "int(11)", nullable: true),
                    StatusJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Alinhamento = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tracos = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Costumes = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Imagem = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GaleriaImagem = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    InventarioJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Skills = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Magia = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Historia = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PersonagemsVinculados = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nanites = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataCriacao = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "current_timestamp()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.IDPersonagemJogador);
                    table.ForeignKey(
                        name: "FK_PersonagensJogador_Cidade",
                        column: x => x.IDCidade,
                        principalTable: "cidades",
                        principalColumn: "IDCidade");
                    table.ForeignKey(
                        name: "FK_PersonagensJogador_Mesa",
                        column: x => x.IDMesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonagensJogador_Raca",
                        column: x => x.IDRaca,
                        principalTable: "racas",
                        principalColumn: "IDRaca");
                    table.ForeignKey(
                        name: "FK_PersonagensJogador_Usuario",
                        column: x => x.IDUsuario,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "ID_cidades",
                table: "personagensJogador",
                column: "IDCidade");

            migrationBuilder.CreateIndex(
                name: "ID_mesas",
                table: "personagensJogador",
                column: "IDMesa");

            migrationBuilder.CreateIndex(
                name: "ID_racas",
                table: "personagensJogador",
                column: "IDRaca");

            migrationBuilder.CreateIndex(
                name: "ID_usuarios",
                table: "personagensJogador",
                column: "IDUsuario");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "personagensJogador");
        }
    }
}
