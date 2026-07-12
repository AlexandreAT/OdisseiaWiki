using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddMesaPadraoSistema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoSistema",
                table: "mesas",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "PadraoSistema",
                table: "mesas",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "UX_Mesa_CodigoSistema",
                table: "mesas",
                column: "CodigoSistema",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UX_Mesa_CodigoSistema",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "CodigoSistema",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "PadraoSistema",
                table: "mesas");
        }
    }
}
