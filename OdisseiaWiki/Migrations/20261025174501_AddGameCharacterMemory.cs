using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddGameCharacterMemory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gamecharactermemories",
                columns: table => new
                {
                    IDPersonagemJogador = table.Column<int>(type: "int(11)", nullable: false),
                    EstadoJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AtualizadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gamecharactermemories", x => x.IDPersonagemJogador);
                    table.ForeignKey(
                        name: "FK_GameCharacterMemory_Personagem",
                        column: x => x.IDPersonagemJogador,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gamecharactermemories");
        }
    }
}
