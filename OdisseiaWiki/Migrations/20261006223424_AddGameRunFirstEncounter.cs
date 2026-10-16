using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddGameRunFirstEncounter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "gamerunbattles",
                columns: table => new
                {
                    IDGameRunBattle = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDGameRun = table.Column<long>(type: "bigint", nullable: false),
                    NoId = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Seed = table.Column<int>(type: "int", nullable: false),
                    VencedorId = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResultadoJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EstadoAntesJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EstadoDepoisJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CriadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gamerunbattles", x => x.IDGameRunBattle);
                    table.ForeignKey(
                        name: "FK_GameRunBattle_Run",
                        column: x => x.IDGameRun,
                        principalTable: "gameruns",
                        principalColumn: "IDGameRun",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "UX_GameRunBattle_Run_No",
                table: "gamerunbattles",
                columns: new[] { "IDGameRun", "NoId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "gamerunbattles");
        }
    }
}
