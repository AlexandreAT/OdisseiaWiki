using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddGameplayEffectApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "mesaefeitosaplicados",
                columns: table => new
                {
                    IDMesaEfeitoAplicado = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesaSessao = table.Column<long>(type: "bigint", nullable: false),
                    IDEventoOrigem = table.Column<long>(type: "bigint", nullable: false),
                    IDEventoAplicacao = table.Column<long>(type: "bigint", nullable: false),
                    IDPersonagemAlvo = table.Column<int>(type: "int(11)", nullable: true),
                    ChaveEfeito = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HashPlano = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AplicadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesaefeitosaplicados", x => x.IDMesaEfeitoAplicado);
                    table.ForeignKey(
                        name: "FK_MesaEfeito_EventoAplicacao",
                        column: x => x.IDEventoAplicacao,
                        principalTable: "mesaeventos",
                        principalColumn: "IDMesaEvento",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MesaEfeito_EventoOrigem",
                        column: x => x.IDEventoOrigem,
                        principalTable: "mesaeventos",
                        principalColumn: "IDMesaEvento",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MesaEfeito_PersonagemAlvo",
                        column: x => x.IDPersonagemAlvo,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MesaEfeito_Sessao",
                        column: x => x.IDMesaSessao,
                        principalTable: "mesasessoes",
                        principalColumn: "IDMesaSessao",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_MesaEfeito_Alvo_Data",
                table: "mesaefeitosaplicados",
                columns: new[] { "IDPersonagemAlvo", "AplicadoEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_mesaefeitosaplicados_IDEventoOrigem",
                table: "mesaefeitosaplicados",
                column: "IDEventoOrigem");

            migrationBuilder.CreateIndex(
                name: "UX_MesaEfeito_EventoAplicacao",
                table: "mesaefeitosaplicados",
                column: "IDEventoAplicacao",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_MesaEfeito_Sessao_Origem_Chave_Alvo",
                table: "mesaefeitosaplicados",
                columns: new[] { "IDMesaSessao", "IDEventoOrigem", "ChaveEfeito", "IDPersonagemAlvo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "mesaefeitosaplicados");
        }
    }
}
