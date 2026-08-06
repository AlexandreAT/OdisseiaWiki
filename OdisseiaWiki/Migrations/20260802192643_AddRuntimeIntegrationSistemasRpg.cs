using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddRuntimeIntegrationSistemasRpg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AcompanharPublicacaoAtual",
                table: "racas",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaRpg",
                table: "racas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaVersao",
                table: "racas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AcompanharPublicacaoAtual",
                table: "personagens",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaRpg",
                table: "personagens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaVersao",
                table: "personagens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AcompanharPublicacaoAtual",
                table: "itens",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaRpg",
                table: "itens",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IDSistemaVersao",
                table: "itens",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "sistemaitensescopos",
                columns: table => new
                {
                    IdSistemaItemEscopo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    IdEscopoPai = table.Column<int>(type: "int", nullable: true),
                    Nivel = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CodigoCaminho = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    Ativo = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaitensescopos", x => x.IdSistemaItemEscopo);
                    table.ForeignKey(
                        name: "FK_sistemaitensescopos_sistemaitensescopos_IdEscopoPai",
                        column: x => x.IdEscopoPai,
                        principalTable: "sistemaitensescopos",
                        principalColumn: "IdSistemaItemEscopo",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sistemaitensescopos_sistemaversoes_IdSistemaVersao",
                        column: x => x.IdSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemapatchnotes",
                columns: table => new
                {
                    IdSistemaPatchNote = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaRpg = table.Column<int>(type: "int", nullable: false),
                    IdSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    IdVersaoAnterior = table.Column<int>(type: "int", nullable: true),
                    CodigoSistema = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeSistema = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NumeroVersaoAnterior = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NumeroVersaoNova = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Titulo = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Resumo = table.Column<string>(type: "varchar(2000)", maxLength: 2000, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    VersaoInicial = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DataGeracao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DiffJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemapatchnotes", x => x.IdSistemaPatchNote);
                    table.ForeignKey(
                        name: "FK_SistemaPatchNote_SistemaRpg",
                        column: x => x.IdSistemaRpg,
                        principalTable: "sistemasrpg",
                        principalColumn: "IdSistemaRpg",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SistemaPatchNote_Versao",
                        column: x => x.IdSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SistemaPatchNote_VersaoAnterior",
                        column: x => x.IdVersaoAnterior,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaitenscampos",
                columns: table => new
                {
                    IdSistemaItemCampo = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaItemEscopo = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Tipo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Unidade = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Obrigatorio = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaitenscampos", x => x.IdSistemaItemCampo);
                    table.ForeignKey(
                        name: "FK_sistemaitenscampos_sistemaitensescopos_IdSistemaItemEscopo",
                        column: x => x.IdSistemaItemEscopo,
                        principalTable: "sistemaitensescopos",
                        principalColumn: "IdSistemaItemEscopo",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaitensfaixas",
                columns: table => new
                {
                    IdSistemaItemFaixa = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaItemEscopo = table.Column<int>(type: "int", nullable: false),
                    CodigoCampo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValorMinimo = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ValorMaximo = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ValorReferencia = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Unidade = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaitensfaixas", x => x.IdSistemaItemFaixa);
                    table.CheckConstraint("CK_SistemaItemFaixa_Intervalo", "`ValorMinimo` IS NULL OR `ValorMaximo` IS NULL OR `ValorMinimo` <= `ValorMaximo`");
                    table.ForeignKey(
                        name: "FK_sistemaitensfaixas_sistemaitensescopos_IdSistemaItemEscopo",
                        column: x => x.IdSistemaItemEscopo,
                        principalTable: "sistemaitensescopos",
                        principalColumn: "IdSistemaItemEscopo",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "sistemaitensreferencias",
                columns: table => new
                {
                    IdSistemaItemReferencia = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IdSistemaItemEscopo = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Codigo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Nome = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Valor = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Descricao = table.Column<string>(type: "text", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Ordem = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sistemaitensreferencias", x => x.IdSistemaItemReferencia);
                    table.ForeignKey(
                        name: "FK_sistemaitensreferencias_sistemaitensescopos_IdSistemaItemEsc~",
                        column: x => x.IdSistemaItemEscopo,
                        principalTable: "sistemaitensescopos",
                        principalColumn: "IdSistemaItemEscopo",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Raca_SistemaRpg",
                table: "racas",
                column: "IDSistemaRpg");

            migrationBuilder.CreateIndex(
                name: "IX_Raca_SistemaVersao",
                table: "racas",
                column: "IDSistemaVersao");

            migrationBuilder.AddCheckConstraint(
                name: "CK_racas_SistemaRuntimeVinculo",
                table: "racas",
                sql: "(`AcompanharPublicacaoAtual` = 1 AND `IDSistemaVersao` IS NULL) OR (`AcompanharPublicacaoAtual` = 0 AND `IDSistemaRpg` IS NOT NULL AND `IDSistemaVersao` IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_Personagem_SistemaRpg",
                table: "personagens",
                column: "IDSistemaRpg");

            migrationBuilder.CreateIndex(
                name: "IX_Personagem_SistemaVersao",
                table: "personagens",
                column: "IDSistemaVersao");

            migrationBuilder.AddCheckConstraint(
                name: "CK_personagens_SistemaRuntimeVinculo",
                table: "personagens",
                sql: "(`AcompanharPublicacaoAtual` = 1 AND `IDSistemaVersao` IS NULL) OR (`AcompanharPublicacaoAtual` = 0 AND `IDSistemaRpg` IS NOT NULL AND `IDSistemaVersao` IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_Item_SistemaRpg",
                table: "itens",
                column: "IDSistemaRpg");

            migrationBuilder.CreateIndex(
                name: "IX_Item_SistemaVersao",
                table: "itens",
                column: "IDSistemaVersao");

            migrationBuilder.AddCheckConstraint(
                name: "CK_itens_SistemaRuntimeVinculo",
                table: "itens",
                sql: "(`AcompanharPublicacaoAtual` = 1 AND `IDSistemaVersao` IS NULL) OR (`AcompanharPublicacaoAtual` = 0 AND `IDSistemaRpg` IS NOT NULL AND `IDSistemaVersao` IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_sistemaitenscampos_IdSistemaItemEscopo_Codigo",
                table: "sistemaitenscampos",
                columns: new[] { "IdSistemaItemEscopo", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SistemaItemEscopo_Versao_Nivel_Codigo",
                table: "sistemaitensescopos",
                columns: new[] { "IdSistemaVersao", "Nivel", "Codigo" });

            migrationBuilder.CreateIndex(
                name: "IX_sistemaitensescopos_IdEscopoPai",
                table: "sistemaitensescopos",
                column: "IdEscopoPai");

            migrationBuilder.CreateIndex(
                name: "UX_SistemaItemEscopo_Versao_Caminho",
                table: "sistemaitensescopos",
                columns: new[] { "IdSistemaVersao", "CodigoCaminho" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaitensfaixas_IdSistemaItemEscopo_CodigoCampo",
                table: "sistemaitensfaixas",
                columns: new[] { "IdSistemaItemEscopo", "CodigoCampo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sistemaitensreferencias_IdSistemaItemEscopo_Tipo_Codigo",
                table: "sistemaitensreferencias",
                columns: new[] { "IdSistemaItemEscopo", "Tipo", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SistemaPatchNote_Sistema_Data",
                table: "sistemapatchnotes",
                columns: new[] { "IdSistemaRpg", "DataGeracao" });

            migrationBuilder.CreateIndex(
                name: "IX_sistemapatchnotes_IdVersaoAnterior",
                table: "sistemapatchnotes",
                column: "IdVersaoAnterior");

            migrationBuilder.CreateIndex(
                name: "UX_SistemaPatchNote_Versao",
                table: "sistemapatchnotes",
                column: "IdSistemaVersao",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Item_SistemaRpg",
                table: "itens",
                column: "IDSistemaRpg",
                principalTable: "sistemasrpg",
                principalColumn: "IdSistemaRpg",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Item_SistemaVersao",
                table: "itens",
                column: "IDSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Personagem_SistemaRpg",
                table: "personagens",
                column: "IDSistemaRpg",
                principalTable: "sistemasrpg",
                principalColumn: "IdSistemaRpg",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Personagem_SistemaVersao",
                table: "personagens",
                column: "IDSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Raca_SistemaRpg",
                table: "racas",
                column: "IDSistemaRpg",
                principalTable: "sistemasrpg",
                principalColumn: "IdSistemaRpg",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Raca_SistemaVersao",
                table: "racas",
                column: "IDSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Item_SistemaRpg",
                table: "itens");

            migrationBuilder.DropForeignKey(
                name: "FK_Item_SistemaVersao",
                table: "itens");

            migrationBuilder.DropForeignKey(
                name: "FK_Personagem_SistemaRpg",
                table: "personagens");

            migrationBuilder.DropForeignKey(
                name: "FK_Personagem_SistemaVersao",
                table: "personagens");

            migrationBuilder.DropForeignKey(
                name: "FK_Raca_SistemaRpg",
                table: "racas");

            migrationBuilder.DropForeignKey(
                name: "FK_Raca_SistemaVersao",
                table: "racas");

            migrationBuilder.DropTable(
                name: "sistemaitenscampos");

            migrationBuilder.DropTable(
                name: "sistemaitensfaixas");

            migrationBuilder.DropTable(
                name: "sistemaitensreferencias");

            migrationBuilder.DropTable(
                name: "sistemapatchnotes");

            migrationBuilder.DropTable(
                name: "sistemaitensescopos");

            migrationBuilder.DropIndex(
                name: "IX_Raca_SistemaRpg",
                table: "racas");

            migrationBuilder.DropIndex(
                name: "IX_Raca_SistemaVersao",
                table: "racas");

            migrationBuilder.DropCheckConstraint(
                name: "CK_racas_SistemaRuntimeVinculo",
                table: "racas");

            migrationBuilder.DropIndex(
                name: "IX_Personagem_SistemaRpg",
                table: "personagens");

            migrationBuilder.DropIndex(
                name: "IX_Personagem_SistemaVersao",
                table: "personagens");

            migrationBuilder.DropCheckConstraint(
                name: "CK_personagens_SistemaRuntimeVinculo",
                table: "personagens");

            migrationBuilder.DropIndex(
                name: "IX_Item_SistemaRpg",
                table: "itens");

            migrationBuilder.DropIndex(
                name: "IX_Item_SistemaVersao",
                table: "itens");

            migrationBuilder.DropCheckConstraint(
                name: "CK_itens_SistemaRuntimeVinculo",
                table: "itens");

            migrationBuilder.DropColumn(
                name: "AcompanharPublicacaoAtual",
                table: "racas");

            migrationBuilder.DropColumn(
                name: "IDSistemaRpg",
                table: "racas");

            migrationBuilder.DropColumn(
                name: "IDSistemaVersao",
                table: "racas");

            migrationBuilder.DropColumn(
                name: "AcompanharPublicacaoAtual",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "IDSistemaRpg",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "IDSistemaVersao",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "AcompanharPublicacaoAtual",
                table: "itens");

            migrationBuilder.DropColumn(
                name: "IDSistemaRpg",
                table: "itens");

            migrationBuilder.DropColumn(
                name: "IDSistemaVersao",
                table: "itens");
        }
    }
}
