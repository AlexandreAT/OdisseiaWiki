using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OdisseiaWiki.Data;

#nullable disable

namespace OdisseiaWiki.Migrations;

[DbContext(typeof(OdisseiaContext))]
[Migration("20261027190000_AddOutfitCompatibility")]
public partial class AddOutfitCompatibility : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.AddColumn<string>(
        name: "CompatibilidadeTrajeJson", table: "sistemaitensescopos", type: "json", nullable: true);

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropColumn(
        name: "CompatibilidadeTrajeJson", table: "sistemaitensescopos");
}
