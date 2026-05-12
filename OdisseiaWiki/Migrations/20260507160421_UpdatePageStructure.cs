using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePageStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PageBlocks_Pages_PageIdPage",
                table: "PageBlocks");

            migrationBuilder.DropIndex(
                name: "IX_PageBlocks_PageIdPage",
                table: "PageBlocks");

            migrationBuilder.DropColumn(
                name: "PageIdPage",
                table: "PageBlocks");

            migrationBuilder.AlterColumn<int>(
                name: "Tipo",
                table: "PageBlocks",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .OldAnnotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_PageBlocks_IdPage",
                table: "PageBlocks",
                column: "IdPage");

            migrationBuilder.AddForeignKey(
                name: "FK_PageBlocks_Pages_IdPage",
                table: "PageBlocks",
                column: "IdPage",
                principalTable: "Pages",
                principalColumn: "IdPage",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PageBlocks_Pages_IdPage",
                table: "PageBlocks");

            migrationBuilder.DropIndex(
                name: "IX_PageBlocks_IdPage",
                table: "PageBlocks");

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "PageBlocks",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                collation: "utf8mb4_general_ci",
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "PageIdPage",
                table: "PageBlocks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PageBlocks_PageIdPage",
                table: "PageBlocks",
                column: "PageIdPage");

            migrationBuilder.AddForeignKey(
                name: "FK_PageBlocks_Pages_PageIdPage",
                table: "PageBlocks",
                column: "PageIdPage",
                principalTable: "Pages",
                principalColumn: "IdPage",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
