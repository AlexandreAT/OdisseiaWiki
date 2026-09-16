using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountEmailSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EmailConfirmado",
                table: "usuarios",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "usuariosemailtokens",
                columns: table => new
                {
                    IDUsuarioEmailToken = table.Column<int>(type: "int(11)", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDUsuario = table.Column<int>(type: "int(11)", nullable: false),
                    Tipo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HashToken = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataCriacao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataExpiracao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataUso = table.Column<DateTime>(type: "datetime", nullable: true),
                    DataInvalidacao = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PRIMARY", x => x.IDUsuarioEmailToken);
                    table.ForeignKey(
                        name: "FK_UsuarioEmailToken_Usuario",
                        column: x => x.IDUsuario,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioEmailToken_Usuario_Tipo_Ativo",
                table: "usuariosemailtokens",
                columns: new[] { "IDUsuario", "Tipo", "DataUso", "DataInvalidacao" });

            migrationBuilder.CreateIndex(
                name: "UX_UsuarioEmailToken_Hash",
                table: "usuariosemailtokens",
                column: "HashToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "usuariosemailtokens");

            migrationBuilder.DropColumn(
                name: "EmailConfirmado",
                table: "usuarios");
        }
    }
}
