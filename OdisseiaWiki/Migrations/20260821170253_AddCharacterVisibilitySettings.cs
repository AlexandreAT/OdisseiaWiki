using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddCharacterVisibilitySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Visivel",
                table: "personagensJogador",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "personagensvisibilidade",
                columns: table => new
                {
                    IDPersonagemVisibilidade = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDPersonagem = table.Column<int>(type: "int(11)", nullable: true),
                    IDPersonagemJogador = table.Column<int>(type: "int(11)", nullable: true),
                    Vida = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Estamina = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Mana = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CapacidadeCarga = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AtributosPrincipais = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AtributosSecundarios = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Defesas = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Imagem = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Historia = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Raca = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Cidade = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Nome = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Alinhamento = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    TracosPersonalidade = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PersonagensRelacionados = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Inventario = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Proteses = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Passivas = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Ultimate = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Skills = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Magias = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Galeria = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Xp = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Nivel = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.IDPersonagemVisibilidade);
                    table.CheckConstraint("CK_PersonagemVisibilidade_Alvo", "(`IDPersonagem` IS NOT NULL AND `IDPersonagemJogador` IS NULL) OR (`IDPersonagem` IS NULL AND `IDPersonagemJogador` IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_PersonagemVisibilidade_Personagem",
                        column: x => x.IDPersonagem,
                        principalTable: "personagens",
                        principalColumn: "IDPersonagem",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PersonagemVisibilidade_PersonagemJogador",
                        column: x => x.IDPersonagemJogador,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "UX_PersonagemVisibilidade_Personagem",
                table: "personagensvisibilidade",
                column: "IDPersonagem",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_PersonagemVisibilidade_PersonagemJogador",
                table: "personagensvisibilidade",
                column: "IDPersonagemJogador",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "personagensvisibilidade");

            migrationBuilder.DropColumn(
                name: "Visivel",
                table: "personagensJogador");
        }
    }
}
