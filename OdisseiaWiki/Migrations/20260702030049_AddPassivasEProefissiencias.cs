using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddPassivasEProefissiencias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Idpassiva",
                table: "personagensJogador",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Implantes",
                table: "personagensJogador",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "PassivaIdpassiva",
                table: "personagensJogador",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ultimate",
                table: "personagensJogador",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "Idpassiva",
                table: "personagens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Implantes",
                table: "personagens",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "PassivaIdpassiva",
                table: "personagens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Ultimate",
                table: "personagens",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Passivas",
                columns: table => new
                {
                    Idpassiva = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StatusJson = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tags = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Visivel = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passivas", x => x.Idpassiva);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "Proficiencias",
                columns: table => new
                {
                    Idproficiencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StatusJson = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tags = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Visivel = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proficiencias", x => x.Idproficiencia);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "Passivaracas",
                columns: table => new
                {
                    IdpassivaRaca = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Idraca = table.Column<int>(type: "int", nullable: false),
                    Idpassiva = table.Column<int>(type: "int", nullable: false),
                    RacaIdraca = table.Column<int>(type: "int(11)", nullable: false),
                    PassivaIdpassiva = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Passivaracas", x => x.IdpassivaRaca);
                    table.ForeignKey(
                        name: "FK_Passivaracas_Passivas_PassivaIdpassiva",
                        column: x => x.PassivaIdpassiva,
                        principalTable: "Passivas",
                        principalColumn: "Idpassiva",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Passivaracas_racas_RacaIdraca",
                        column: x => x.RacaIdraca,
                        principalTable: "racas",
                        principalColumn: "IDRaca",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "PersonagemProficiencias",
                columns: table => new
                {
                    IdpersonagemProficiencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Idpersonagem = table.Column<int>(type: "int", nullable: true),
                    IdpersonagemJogador = table.Column<int>(type: "int", nullable: true),
                    Idproficiencia = table.Column<int>(type: "int", nullable: false),
                    PersonagemIdpersonagem = table.Column<int>(type: "int(11)", nullable: true),
                    PersonagemJogadorIdpersonagemJogador = table.Column<int>(type: "int(11)", nullable: true),
                    ProficienciaIdproficiencia = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PersonagemProficiencias", x => x.IdpersonagemProficiencia);
                    table.ForeignKey(
                        name: "FK_PersonagemProficiencias_Proficiencias_ProficienciaIdproficie~",
                        column: x => x.ProficienciaIdproficiencia,
                        principalTable: "Proficiencias",
                        principalColumn: "Idproficiencia",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonagemProficiencias_personagensJogador_PersonagemJogador~",
                        column: x => x.PersonagemJogadorIdpersonagemJogador,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador");
                    table.ForeignKey(
                        name: "FK_PersonagemProficiencias_personagens_PersonagemIdpersonagem",
                        column: x => x.PersonagemIdpersonagem,
                        principalTable: "personagens",
                        principalColumn: "IDPersonagem");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_personagensJogador_PassivaIdpassiva",
                table: "personagensJogador",
                column: "PassivaIdpassiva");

            migrationBuilder.CreateIndex(
                name: "IX_personagens_PassivaIdpassiva",
                table: "personagens",
                column: "PassivaIdpassiva");

            migrationBuilder.CreateIndex(
                name: "IX_Passivaracas_PassivaIdpassiva",
                table: "Passivaracas",
                column: "PassivaIdpassiva");

            migrationBuilder.CreateIndex(
                name: "IX_Passivaracas_RacaIdraca",
                table: "Passivaracas",
                column: "RacaIdraca");

            migrationBuilder.CreateIndex(
                name: "IX_PersonagemProficiencias_PersonagemIdpersonagem",
                table: "PersonagemProficiencias",
                column: "PersonagemIdpersonagem");

            migrationBuilder.CreateIndex(
                name: "IX_PersonagemProficiencias_PersonagemJogadorIdpersonagemJogador",
                table: "PersonagemProficiencias",
                column: "PersonagemJogadorIdpersonagemJogador");

            migrationBuilder.CreateIndex(
                name: "IX_PersonagemProficiencias_ProficienciaIdproficiencia",
                table: "PersonagemProficiencias",
                column: "ProficienciaIdproficiencia");

            migrationBuilder.AddForeignKey(
                name: "FK_personagens_Passivas_PassivaIdpassiva",
                table: "personagens",
                column: "PassivaIdpassiva",
                principalTable: "Passivas",
                principalColumn: "Idpassiva");

            migrationBuilder.AddForeignKey(
                name: "FK_personagensJogador_Passivas_PassivaIdpassiva",
                table: "personagensJogador",
                column: "PassivaIdpassiva",
                principalTable: "Passivas",
                principalColumn: "Idpassiva");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_personagens_Passivas_PassivaIdpassiva",
                table: "personagens");

            migrationBuilder.DropForeignKey(
                name: "FK_personagensJogador_Passivas_PassivaIdpassiva",
                table: "personagensJogador");

            migrationBuilder.DropTable(
                name: "Passivaracas");

            migrationBuilder.DropTable(
                name: "PersonagemProficiencias");

            migrationBuilder.DropTable(
                name: "Passivas");

            migrationBuilder.DropTable(
                name: "Proficiencias");

            migrationBuilder.DropIndex(
                name: "IX_personagensJogador_PassivaIdpassiva",
                table: "personagensJogador");

            migrationBuilder.DropIndex(
                name: "IX_personagens_PassivaIdpassiva",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "Idpassiva",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "Implantes",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "PassivaIdpassiva",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "Ultimate",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "Idpassiva",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "Implantes",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "PassivaIdpassiva",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "Ultimate",
                table: "personagens");
        }
    }
}
