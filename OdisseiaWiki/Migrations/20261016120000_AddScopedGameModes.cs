using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OdisseiaWiki.Data;

#nullable disable

namespace OdisseiaWiki.Migrations;

[DbContext(typeof(OdisseiaContext))]
[Migration("20261016120000_AddScopedGameModes")]
public partial class AddScopedGameModes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>("IDMesa", "gamemodeversions", type: "int", nullable: true);
        migrationBuilder.AddColumn<int>("IDUsuarioCriacao", "gamemodeversions", type: "int", nullable: true);
        migrationBuilder.AddColumn<string>("Nome", "gamemodeversions", type: "varchar(100)", maxLength: 100, nullable: true);
        migrationBuilder.AddColumn<string>("Descricao", "gamemodeversions", type: "varchar(500)", maxLength: 500, nullable: true);
        migrationBuilder.AddColumn<string>("Banner", "gamemodeversions", type: "varchar(255)", maxLength: 255, nullable: true);
        migrationBuilder.AddColumn<int>("IdOrigemGlobal", "personagens", type: "int", nullable: true);
        migrationBuilder.AddColumn<string>("IdOrigemGlobal", "itens", type: "varchar(50)", maxLength: 50, nullable: true);
        migrationBuilder.CreateIndex("IX_GameModeVersion_Mesa_Sistema_Status", "gamemodeversions",
            new[] { "IDMesa", "IDSistemaVersao", "Status" });
        migrationBuilder.CreateIndex("IX_GameModeVersion_Mesa", "gamemodeversions", "IDMesa");
        migrationBuilder.CreateIndex("UX_Personagem_Escopo_OrigemGlobal", "personagens",
            new[] { "IDWikiEscopo", "IdOrigemGlobal" }, unique: true);
        migrationBuilder.CreateIndex("UX_Item_Escopo_OrigemGlobal", "itens",
            new[] { "IDWikiEscopo", "IdOrigemGlobal" }, unique: true);
        migrationBuilder.AddForeignKey(
            name: "FK_GameModeVersion_Mesa",
            table: "gamemodeversions",
            column: "IDMesa",
            principalTable: "mesas",
            principalColumn: "IDMesa",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_GameModeVersion_Mesa", "gamemodeversions");
        migrationBuilder.DropIndex("IX_GameModeVersion_Mesa", "gamemodeversions");
        migrationBuilder.DropIndex("IX_GameModeVersion_Mesa_Sistema_Status", "gamemodeversions");
        migrationBuilder.DropIndex("UX_Personagem_Escopo_OrigemGlobal", "personagens");
        migrationBuilder.DropIndex("UX_Item_Escopo_OrigemGlobal", "itens");
        migrationBuilder.DropColumn("IDMesa", "gamemodeversions");
        migrationBuilder.DropColumn("IDUsuarioCriacao", "gamemodeversions");
        migrationBuilder.DropColumn("Nome", "gamemodeversions");
        migrationBuilder.DropColumn("Descricao", "gamemodeversions");
        migrationBuilder.DropColumn("Banner", "gamemodeversions");
        migrationBuilder.DropColumn("IdOrigemGlobal", "personagens");
        migrationBuilder.DropColumn("IdOrigemGlobal", "itens");
    }
}
