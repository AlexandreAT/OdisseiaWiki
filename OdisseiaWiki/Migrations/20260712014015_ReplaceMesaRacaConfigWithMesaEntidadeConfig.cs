using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceMesaRacaConfigWithMesaEntidadeConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "mesaentidadeconfig",
                columns: table => new
                {
                    IDMesaEntidadeConfig = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesa = table.Column<int>(type: "int(11)", nullable: false),
                    TipoEntidade = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Identidade = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ConfigJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataCriacao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataAtualizacao = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.IDMesaEntidadeConfig);
                    table.ForeignKey(
                        name: "FK_MesaEntidadeConfig_Mesa",
                        column: x => x.IDMesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.Sql(@"
                INSERT INTO mesaentidadeconfig
                    (IDMesa, TipoEntidade, Identidade, ConfigJson, DataCriacao, DataAtualizacao)
                SELECT
                    IDMesa,
                    'Raca',
                    CAST(IDRaca AS CHAR),
                    CASE
                        WHEN StatusJson IS NULL THEN JSON_OBJECT()
                        WHEN JSON_VALID(StatusJson) THEN JSON_OBJECT('statusJson', JSON_EXTRACT(StatusJson, '$'))
                        ELSE JSON_OBJECT('legacyStatusJson', StatusJson)
                    END,
                    UTC_TIMESTAMP(),
                    UTC_TIMESTAMP()
                FROM mesaracaconfig;
            ");

            migrationBuilder.CreateIndex(
                name: "UX_MesaEntidadeConfig_Mesa_Tipo_Entidade",
                table: "mesaentidadeconfig",
                columns: new[] { "IDMesa", "TipoEntidade", "Identidade" },
                unique: true);

            migrationBuilder.DropTable(
                name: "mesaracaconfig");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "mesaracaconfig",
                columns: table => new
                {
                    IDMesaRacaConfig = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesa = table.Column<int>(type: "int(11)", nullable: false),
                    IDRaca = table.Column<int>(type: "int(11)", nullable: false),
                    StatusJson = table.Column<string>(type: "longtext", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.IDMesaRacaConfig);
                    table.ForeignKey(
                        name: "ID mesas",
                        column: x => x.IDMesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa");
                    table.ForeignKey(
                        name: "ID raca",
                        column: x => x.IDRaca,
                        principalTable: "racas",
                        principalColumn: "IDRaca");
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "ID mesas",
                table: "mesaracaconfig",
                column: "IDMesa");

            migrationBuilder.CreateIndex(
                name: "ID raca",
                table: "mesaracaconfig",
                column: "IDRaca");

            migrationBuilder.Sql(@"
                INSERT INTO mesaracaconfig (IDMesa, IDRaca, StatusJson)
                SELECT
                    IDMesa,
                    CAST(Identidade AS UNSIGNED),
                    CAST(JSON_EXTRACT(ConfigJson, '$.statusJson') AS CHAR)
                FROM mesaentidadeconfig
                WHERE TipoEntidade = 'Raca';
            ");

            migrationBuilder.DropTable(
                name: "mesaentidadeconfig");
        }
    }
}
