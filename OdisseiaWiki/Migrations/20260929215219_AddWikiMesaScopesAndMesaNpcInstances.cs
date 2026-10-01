using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddWikiMesaScopesAndMesaNpcInstances : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IDWikiEscopo",
                table: "racas",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "IDPersonagemOrigem",
                table: "personagensJogador",
                type: "int(11)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdVarianteOrigem",
                table: "personagensJogador",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "IDWikiEscopo",
                table: "personagens",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "IDPersonagemOrigem",
                table: "mesacombateparticipantes",
                type: "int(11)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdVarianteOrigem",
                table: "mesacombateparticipantes",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "IDWikiEscopo",
                table: "itens",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaRpg",
                table: "cidades",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IDWikiEscopo",
                table: "cidades",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "IDWikiEscopo",
                table: "Passivas",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaRpg",
                table: "Pages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IDWikiEscopo",
                table: "Pages",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateTable(
                name: "wikiescopos",
                columns: table => new
                {
                    IDWikiEscopo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Tipo = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Chave = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDMesa = table.Column<int>(type: "int(11)", nullable: true),
                    DataCriacao = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wikiescopos", x => x.IDWikiEscopo);
                    table.ForeignKey(
                        name: "FK_WikiEscopo_Mesa",
                        column: x => x.IDMesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.InsertData(
                table: "wikiescopos",
                columns: new[] { "IDWikiEscopo", "Tipo", "Chave", "IDMesa", "DataCriacao" },
                values: new object[] { 1, "Oficial", "OFICIAL", null, new DateTime(2026, 9, 29, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.CreateIndex(
                name: "IX_Raca_WikiEscopo",
                table: "racas",
                column: "IDWikiEscopo");

            migrationBuilder.CreateIndex(
                name: "IX_PersonagemJogador_Mesa_NpcOrigem",
                table: "personagensJogador",
                columns: new[] { "IDMesa", "IDPersonagemOrigem" });

            migrationBuilder.CreateIndex(
                name: "IX_personagensJogador_IDPersonagemOrigem",
                table: "personagensJogador",
                column: "IDPersonagemOrigem");

            migrationBuilder.CreateIndex(
                name: "IX_Personagem_WikiEscopo",
                table: "personagens",
                column: "IDWikiEscopo");

            migrationBuilder.CreateIndex(
                name: "IX_MesaCombateParticipante_PersonagemOrigem",
                table: "mesacombateparticipantes",
                column: "IDPersonagemOrigem");

            migrationBuilder.CreateIndex(
                name: "IX_Item_WikiEscopo",
                table: "itens",
                column: "IDWikiEscopo");

            migrationBuilder.CreateIndex(
                name: "IX_Cidade_SistemaRpg",
                table: "cidades",
                column: "IDSistemaRpg");

            migrationBuilder.CreateIndex(
                name: "IX_Cidade_WikiEscopo",
                table: "cidades",
                column: "IDWikiEscopo");

            migrationBuilder.CreateIndex(
                name: "IX_Passiva_WikiEscopo",
                table: "Passivas",
                column: "IDWikiEscopo");

            migrationBuilder.CreateIndex(
                name: "IX_Page_WikiEscopo",
                table: "Pages",
                column: "IDWikiEscopo");

            migrationBuilder.CreateIndex(
                name: "IX_Pages_IDSistemaRpg",
                table: "Pages",
                column: "IDSistemaRpg");

            migrationBuilder.CreateIndex(
                name: "UX_Page_WikiEscopo_Slug",
                table: "Pages",
                columns: new[] { "IDWikiEscopo", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_WikiEscopo_Chave",
                table: "wikiescopos",
                column: "Chave",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_WikiEscopo_Mesa",
                table: "wikiescopos",
                column: "IDMesa",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Page_SistemaRpg",
                table: "Pages",
                column: "IDSistemaRpg",
                principalTable: "sistemasrpg",
                principalColumn: "IdSistemaRpg",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Page_WikiEscopo",
                table: "Pages",
                column: "IDWikiEscopo",
                principalTable: "wikiescopos",
                principalColumn: "IDWikiEscopo",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Passiva_WikiEscopo",
                table: "Passivas",
                column: "IDWikiEscopo",
                principalTable: "wikiescopos",
                principalColumn: "IDWikiEscopo",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cidade_SistemaRpg",
                table: "cidades",
                column: "IDSistemaRpg",
                principalTable: "sistemasrpg",
                principalColumn: "IdSistemaRpg",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Cidade_WikiEscopo",
                table: "cidades",
                column: "IDWikiEscopo",
                principalTable: "wikiescopos",
                principalColumn: "IDWikiEscopo",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Item_WikiEscopo",
                table: "itens",
                column: "IDWikiEscopo",
                principalTable: "wikiescopos",
                principalColumn: "IDWikiEscopo",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MesaCombateParticipante_PersonagemOrigem",
                table: "mesacombateparticipantes",
                column: "IDPersonagemOrigem",
                principalTable: "personagens",
                principalColumn: "IDPersonagem",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Personagem_WikiEscopo",
                table: "personagens",
                column: "IDWikiEscopo",
                principalTable: "wikiescopos",
                principalColumn: "IDWikiEscopo",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PersonagensJogador_PersonagemOrigem",
                table: "personagensJogador",
                column: "IDPersonagemOrigem",
                principalTable: "personagens",
                principalColumn: "IDPersonagem",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Raca_WikiEscopo",
                table: "racas",
                column: "IDWikiEscopo",
                principalTable: "wikiescopos",
                principalColumn: "IDWikiEscopo",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Page_SistemaRpg",
                table: "Pages");

            migrationBuilder.DropForeignKey(
                name: "FK_Page_WikiEscopo",
                table: "Pages");

            migrationBuilder.DropForeignKey(
                name: "FK_Passiva_WikiEscopo",
                table: "Passivas");

            migrationBuilder.DropForeignKey(
                name: "FK_Cidade_SistemaRpg",
                table: "cidades");

            migrationBuilder.DropForeignKey(
                name: "FK_Cidade_WikiEscopo",
                table: "cidades");

            migrationBuilder.DropForeignKey(
                name: "FK_Item_WikiEscopo",
                table: "itens");

            migrationBuilder.DropForeignKey(
                name: "FK_MesaCombateParticipante_PersonagemOrigem",
                table: "mesacombateparticipantes");

            migrationBuilder.DropForeignKey(
                name: "FK_Personagem_WikiEscopo",
                table: "personagens");

            migrationBuilder.DropForeignKey(
                name: "FK_PersonagensJogador_PersonagemOrigem",
                table: "personagensJogador");

            migrationBuilder.DropForeignKey(
                name: "FK_Raca_WikiEscopo",
                table: "racas");

            migrationBuilder.DropTable(
                name: "wikiescopos");

            migrationBuilder.DropIndex(
                name: "IX_Raca_WikiEscopo",
                table: "racas");

            migrationBuilder.DropIndex(
                name: "IX_PersonagemJogador_Mesa_NpcOrigem",
                table: "personagensJogador");

            migrationBuilder.DropIndex(
                name: "IX_personagensJogador_IDPersonagemOrigem",
                table: "personagensJogador");

            migrationBuilder.DropIndex(
                name: "IX_Personagem_WikiEscopo",
                table: "personagens");

            migrationBuilder.DropIndex(
                name: "IX_MesaCombateParticipante_PersonagemOrigem",
                table: "mesacombateparticipantes");

            migrationBuilder.DropIndex(
                name: "IX_Item_WikiEscopo",
                table: "itens");

            migrationBuilder.DropIndex(
                name: "IX_Cidade_SistemaRpg",
                table: "cidades");

            migrationBuilder.DropIndex(
                name: "IX_Cidade_WikiEscopo",
                table: "cidades");

            migrationBuilder.DropIndex(
                name: "IX_Passiva_WikiEscopo",
                table: "Passivas");

            migrationBuilder.DropIndex(
                name: "IX_Page_WikiEscopo",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "IX_Pages_IDSistemaRpg",
                table: "Pages");

            migrationBuilder.DropIndex(
                name: "UX_Page_WikiEscopo_Slug",
                table: "Pages");

            migrationBuilder.DropColumn(
                name: "IDWikiEscopo",
                table: "racas");

            migrationBuilder.DropColumn(
                name: "IDPersonagemOrigem",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "IdVarianteOrigem",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "IDWikiEscopo",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "IDPersonagemOrigem",
                table: "mesacombateparticipantes");

            migrationBuilder.DropColumn(
                name: "IdVarianteOrigem",
                table: "mesacombateparticipantes");

            migrationBuilder.DropColumn(
                name: "IDWikiEscopo",
                table: "itens");

            migrationBuilder.DropColumn(
                name: "IDSistemaRpg",
                table: "cidades");

            migrationBuilder.DropColumn(
                name: "IDWikiEscopo",
                table: "cidades");

            migrationBuilder.DropColumn(
                name: "IDWikiEscopo",
                table: "Passivas");

            migrationBuilder.DropColumn(
                name: "IDSistemaRpg",
                table: "Pages");

            migrationBuilder.DropColumn(
                name: "IDWikiEscopo",
                table: "Pages");
        }
    }
}
