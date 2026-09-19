using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileNicknameUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE `usuarios` AS `target`
                INNER JOIN (
                    SELECT * FROM (
                        SELECT
                            `source`.`IDUsuario`,
                            CONCAT(
                                'legacy-',
                                `source`.`IDUsuario`,
                                '-',
                                LEFT(SHA2(CONCAT(COALESCE(`source`.`Email`, ''), ':', `source`.`IDUsuario`), 256), 20)
                            ) AS `NovoNickname`
                        FROM `usuarios` AS `source`
                        INNER JOIN (
                            SELECT
                                LOWER(`Nickname`) AS `NicknameNormalizado`,
                                MIN(`IDUsuario`) AS `IDUsuarioPreservado`
                            FROM `usuarios`
                            GROUP BY LOWER(`Nickname`)
                            HAVING COUNT(*) > 1
                        ) AS `duplicados`
                            ON LOWER(`source`.`Nickname`) = `duplicados`.`NicknameNormalizado`
                            AND `source`.`IDUsuario` <> `duplicados`.`IDUsuarioPreservado`
                    ) AS `calculados`
                ) AS `alteracoes`
                    ON `target`.`IDUsuario` = `alteracoes`.`IDUsuario`
                SET `target`.`Nickname` = `alteracoes`.`NovoNickname`;
                """);

            migrationBuilder.CreateIndex(
                name: "UX_Usuario_Nickname",
                table: "usuarios",
                column: "Nickname",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Usuario_Nickname",
                table: "usuarios");
        }
    }
}
