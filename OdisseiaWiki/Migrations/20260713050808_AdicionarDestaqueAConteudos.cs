using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarDestaqueAConteudos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "racas",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "personagens",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "itens",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "infolore",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "cidades",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "Proficiencias",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "Passivas",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Destaque",
                table: "Pages",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "racas");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "personagens");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "itens");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "infolore");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "cidades");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "Proficiencias");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "Passivas");

            migrationBuilder.DropColumn(
                name: "Destaque",
                table: "Pages");
        }
    }
}
