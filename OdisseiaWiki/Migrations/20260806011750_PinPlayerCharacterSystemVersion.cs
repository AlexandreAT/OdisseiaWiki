using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class PinPlayerCharacterSystemVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IDSistemaVersao",
                table: "personagensJogador",
                type: "int",
                nullable: true);

            // Reconstruct the last published ruleset that existed when each sheet was created.
            // This prevents a recent Mesa publication from silently upgrading legacy player sheets.
            migrationBuilder.Sql(
                """
                UPDATE `personagensJogador` AS `personagem`
                INNER JOIN `mesas` AS `mesa` ON `mesa`.`IDMesa` = `personagem`.`IDMesa`
                LEFT JOIN `sistemaversoes` AS `versaoMesa`
                    ON `versaoMesa`.`IdSistemaVersao` = `mesa`.`IDSistemaVersao`
                SET `personagem`.`IDSistemaVersao` = COALESCE(
                    (
                        SELECT `versaoHistorica`.`IdSistemaVersao`
                        FROM `sistemaversoes` AS `versaoHistorica`
                        WHERE `versaoHistorica`.`IdSistemaRpg` = `versaoMesa`.`IdSistemaRpg`
                          AND `versaoHistorica`.`DataPublicacao` IS NOT NULL
                          AND `versaoHistorica`.`DataPublicacao` <= `personagem`.`DataCriacao`
                        ORDER BY `versaoHistorica`.`DataPublicacao` DESC
                        LIMIT 1
                    ),
                    `mesa`.`IDSistemaVersao`
                )
                WHERE `personagem`.`IDSistemaVersao` IS NULL
                  AND `mesa`.`IDSistemaVersao` IS NOT NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PersonagensJogador_SistemaVersao",
                table: "personagensJogador",
                column: "IDSistemaVersao");

            migrationBuilder.AddForeignKey(
                name: "FK_PersonagensJogador_SistemaVersao",
                table: "personagensJogador",
                column: "IDSistemaVersao",
                principalTable: "sistemaversoes",
                principalColumn: "IdSistemaVersao",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PersonagensJogador_SistemaVersao",
                table: "personagensJogador");

            migrationBuilder.DropIndex(
                name: "IX_PersonagensJogador_SistemaVersao",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "IDSistemaVersao",
                table: "personagensJogador");
        }
    }
}
