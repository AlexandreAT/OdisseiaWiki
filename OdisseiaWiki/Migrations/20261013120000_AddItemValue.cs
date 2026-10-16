using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using OdisseiaWiki.Data;

#nullable disable

namespace OdisseiaWiki.Migrations;

[DbContext(typeof(OdisseiaContext))]
[Migration("20261013120000_AddItemValue")]
public partial class AddItemValue : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.AddColumn<decimal>(
            name: "Valor", table: "itens", type: "decimal(18,2)", nullable: true);

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn(name: "Valor", table: "itens");
}
