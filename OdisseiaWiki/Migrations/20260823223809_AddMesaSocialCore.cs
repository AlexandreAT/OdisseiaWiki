using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddMesaSocialCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataEntrada",
                table: "mesausuarios",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DataAtualizacao",
                table: "mesas",
                type: "datetime",
                nullable: false,
                defaultValue: new DateTime(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.Sql("""
                UPDATE mesas
                SET DataAtualizacao = DataCriacao
                WHERE DataAtualizacao = '1970-01-01 00:00:00';
                """);

            migrationBuilder.Sql("""
                UPDATE mesausuarios AS vinculo
                INNER JOIN mesas AS mesa ON mesa.IDMesa = vinculo.IDMesa
                SET vinculo.DataEntrada = mesa.DataCriacao
                WHERE vinculo.DataEntrada = '1970-01-01 00:00:00';
                """);

            migrationBuilder.AddColumn<string>(
                name: "Descricao",
                table: "mesas",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "LimiteJogadores",
                table: "mesas",
                type: "int",
                nullable: false,
                defaultValue: 4);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "mesas",
                type: "longtext",
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "mesaexpulsoesregistro",
                columns: table => new
                {
                    IdMesaExpulsaoRegistro = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Idmesa = table.Column<int>(type: "int(11)", nullable: true),
                    Idusuario = table.Column<int>(type: "int(11)", nullable: false),
                    IdusuarioMestre = table.Column<int>(type: "int(11)", nullable: false),
                    NomeMesa = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Motivo = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataExpulsao = table.Column<DateTime>(type: "datetime", nullable: false),
                    DataLeitura = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesaexpulsoesregistro", x => x.IdMesaExpulsaoRegistro);
                    table.ForeignKey(
                        name: "FK_mesaexpulsoesregistro_mesas_Idmesa",
                        column: x => x.Idmesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_mesaexpulsoesregistro_usuarios_Idusuario",
                        column: x => x.Idusuario,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_mesaexpulsoesregistro_usuarios_IdusuarioMestre",
                        column: x => x.IdusuarioMestre,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesasolicitacoesentrada",
                columns: table => new
                {
                    IdMesaSolicitacaoEntrada = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Idmesa = table.Column<int>(type: "int(11)", nullable: false),
                    Idusuario = table.Column<int>(type: "int(11)", nullable: false),
                    Mensagem = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DataSolicitacao = table.Column<DateTime>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesasolicitacoesentrada", x => x.IdMesaSolicitacaoEntrada);
                    table.ForeignKey(
                        name: "FK_mesasolicitacoesentrada_mesas_Idmesa",
                        column: x => x.Idmesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_mesasolicitacoesentrada_usuarios_Idusuario",
                        column: x => x.Idusuario,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.Sql("""
                DELETE duplicado
                FROM mesausuarios AS duplicado
                INNER JOIN mesausuarios AS mantido
                    ON mantido.IDMesa = duplicado.IDMesa
                    AND mantido.IDUsuario = duplicado.IDUsuario
                    AND mantido.IDMesaUsuario < duplicado.IDMesaUsuario
                WHERE duplicado.IDMesa IS NOT NULL
                    AND duplicado.IDUsuario IS NOT NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "UX_MesaUsuario_Mesa_Usuario",
                table: "mesausuarios",
                columns: new[] { "IDMesa", "IDUsuario" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_mesaexpulsoesregistro_Idmesa",
                table: "mesaexpulsoesregistro",
                column: "Idmesa");

            migrationBuilder.CreateIndex(
                name: "IX_mesaexpulsoesregistro_IdusuarioMestre",
                table: "mesaexpulsoesregistro",
                column: "IdusuarioMestre");

            migrationBuilder.CreateIndex(
                name: "IX_mesaexpulsoesregistro_Idusuario_DataLeitura",
                table: "mesaexpulsoesregistro",
                columns: new[] { "Idusuario", "DataLeitura" });

            migrationBuilder.CreateIndex(
                name: "IX_mesasolicitacoesentrada_Idusuario",
                table: "mesasolicitacoesentrada",
                column: "Idusuario");

            migrationBuilder.CreateIndex(
                name: "UX_MesaSolicitacao_Mesa_Usuario",
                table: "mesasolicitacoesentrada",
                columns: new[] { "Idmesa", "Idusuario" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "mesaexpulsoesregistro");

            migrationBuilder.DropTable(
                name: "mesasolicitacoesentrada");

            migrationBuilder.DropIndex(
                name: "UX_MesaUsuario_Mesa_Usuario",
                table: "mesausuarios");

            migrationBuilder.DropColumn(
                name: "DataEntrada",
                table: "mesausuarios");

            migrationBuilder.DropColumn(
                name: "DataAtualizacao",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "Descricao",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "LimiteJogadores",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "mesas");
        }
    }
}
