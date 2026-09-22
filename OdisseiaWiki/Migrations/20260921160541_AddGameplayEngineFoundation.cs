using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddGameplayEngineFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "RevisaoRuntime",
                table: "personagensJogador",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "IDMesaSessaoAtiva",
                table: "mesas",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "RevisaoRuntime",
                table: "mesas",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "mesasessoes",
                columns: table => new
                {
                    IDMesaSessao = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesa = table.Column<int>(type: "int(11)", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDSistemaVersao = table.Column<int>(type: "int", nullable: false),
                    IDUsuarioCriacao = table.Column<int>(type: "int(11)", nullable: true),
                    IDUsuarioEncerramento = table.Column<int>(type: "int(11)", nullable: true),
                    IniciadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EncerradaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    RevisaoEstado = table.Column<long>(type: "bigint", nullable: false),
                    UltimaSequenciaEvento = table.Column<long>(type: "bigint", nullable: false),
                    ChaveAtiva = table.Column<int>(type: "int", nullable: true, computedColumnSql: "CASE WHEN `Status` = 'Ativa' THEN 1 ELSE NULL END", stored: true),
                    VersaoSchema = table.Column<int>(type: "int", nullable: false),
                    ContextoAberturaJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MotivoEncerramento = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesasessoes", x => x.IDMesaSessao);
                    table.ForeignKey(
                        name: "FK_MesaSessao_Mesa",
                        column: x => x.IDMesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MesaSessao_SistemaVersao",
                        column: x => x.IDSistemaVersao,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MesaSessao_UsuarioCriacao",
                        column: x => x.IDUsuarioCriacao,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MesaSessao_UsuarioEncerramento",
                        column: x => x.IDUsuarioEncerramento,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesacomandos",
                columns: table => new
                {
                    IDMesaComando = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesa = table.Column<int>(type: "int(11)", nullable: false),
                    IDMesaSessao = table.Column<long>(type: "bigint", nullable: true),
                    ChaveIdempotencia = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HashPayload = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDUsuarioAtor = table.Column<int>(type: "int(11)", nullable: true),
                    IDPersonagemJogador = table.Column<int>(type: "int(11)", nullable: true),
                    Tipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RevisaoMesaEsperada = table.Column<long>(type: "bigint", nullable: true),
                    RevisaoSessaoEsperada = table.Column<long>(type: "bigint", nullable: true),
                    RevisaoPersonagemEsperada = table.Column<long>(type: "bigint", nullable: true),
                    RevisoesAlvosJson = table.Column<string>(type: "json", nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RespostaJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CriadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ConcluidoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesacomandos", x => x.IDMesaComando);
                    table.ForeignKey(
                        name: "FK_MesaComando_Mesa",
                        column: x => x.IDMesa,
                        principalTable: "mesas",
                        principalColumn: "IDMesa",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MesaComando_Personagem",
                        column: x => x.IDPersonagemJogador,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MesaComando_Sessao",
                        column: x => x.IDMesaSessao,
                        principalTable: "mesasessoes",
                        principalColumn: "IDMesaSessao",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MesaComando_UsuarioAtor",
                        column: x => x.IDUsuarioAtor,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesaeventos",
                columns: table => new
                {
                    IDMesaEvento = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesaSessao = table.Column<long>(type: "bigint", nullable: false),
                    IDMesaComando = table.Column<long>(type: "bigint", nullable: true),
                    Sequencia = table.Column<long>(type: "bigint", nullable: false),
                    Tipo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Origem = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Visibilidade = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDUsuarioAtor = table.Column<int>(type: "int(11)", nullable: true),
                    IDPersonagemJogador = table.Column<int>(type: "int(11)", nullable: true),
                    IDSistemaRpg = table.Column<int>(type: "int", nullable: true),
                    IDSistemaVersaoEfetiva = table.Column<int>(type: "int", nullable: true),
                    IDSistemaVersaoPersonagem = table.Column<int>(type: "int", nullable: true),
                    CodigoRegra = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SchemaVersion = table.Column<int>(type: "int", nullable: false),
                    DadosJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OcorreuEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesaeventos", x => x.IDMesaEvento);
                    table.ForeignKey(
                        name: "FK_MesaEvento_Comando",
                        column: x => x.IDMesaComando,
                        principalTable: "mesacomandos",
                        principalColumn: "IDMesaComando",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MesaEvento_Personagem",
                        column: x => x.IDPersonagemJogador,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MesaEvento_Sessao",
                        column: x => x.IDMesaSessao,
                        principalTable: "mesasessoes",
                        principalColumn: "IDMesaSessao",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MesaEvento_SistemaRpg",
                        column: x => x.IDSistemaRpg,
                        principalTable: "sistemasrpg",
                        principalColumn: "IdSistemaRpg",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MesaEvento_SistemaVersaoEfetiva",
                        column: x => x.IDSistemaVersaoEfetiva,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MesaEvento_SistemaVersaoPersonagem",
                        column: x => x.IDSistemaVersaoPersonagem,
                        principalTable: "sistemaversoes",
                        principalColumn: "IdSistemaVersao",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MesaEvento_UsuarioAtor",
                        column: x => x.IDUsuarioAtor,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesarolagens",
                columns: table => new
                {
                    IDMesaEvento = table.Column<long>(type: "bigint", nullable: false),
                    Expressao = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GruposJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModificadoresJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValorNatural = table.Column<int>(type: "int", nullable: true),
                    Subtotal = table.Column<int>(type: "int", nullable: false),
                    Total = table.Column<int>(type: "int", nullable: false),
                    CodigoResultado = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeResultado = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ValorAssociado = table.Column<int>(type: "int", nullable: true),
                    Manual = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesarolagens", x => x.IDMesaEvento);
                    table.ForeignKey(
                        name: "FK_MesaRolagem_Evento",
                        column: x => x.IDMesaEvento,
                        principalTable: "mesaeventos",
                        principalColumn: "IDMesaEvento",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "UX_Mesa_SessaoAtiva",
                table: "mesas",
                column: "IDMesaSessaoAtiva",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MesaComando_Sessao_Data",
                table: "mesacomandos",
                columns: new[] { "IDMesaSessao", "CriadoEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_mesacomandos_IDPersonagemJogador",
                table: "mesacomandos",
                column: "IDPersonagemJogador");

            migrationBuilder.CreateIndex(
                name: "IX_mesacomandos_IDUsuarioAtor",
                table: "mesacomandos",
                column: "IDUsuarioAtor");

            migrationBuilder.CreateIndex(
                name: "UX_MesaComando_Mesa_Ator_Chave",
                table: "mesacomandos",
                columns: new[] { "IDMesa", "IDUsuarioAtor", "ChaveIdempotencia" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MesaEvento_Personagem_Data",
                table: "mesaeventos",
                columns: new[] { "IDPersonagemJogador", "OcorreuEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MesaEvento_Sessao_Data",
                table: "mesaeventos",
                columns: new[] { "IDMesaSessao", "OcorreuEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MesaEvento_Tipo_Regra",
                table: "mesaeventos",
                columns: new[] { "Tipo", "CodigoRegra" });

            migrationBuilder.CreateIndex(
                name: "IX_mesaeventos_IDMesaComando",
                table: "mesaeventos",
                column: "IDMesaComando");

            migrationBuilder.CreateIndex(
                name: "IX_mesaeventos_IDSistemaRpg",
                table: "mesaeventos",
                column: "IDSistemaRpg");

            migrationBuilder.CreateIndex(
                name: "IX_mesaeventos_IDSistemaVersaoEfetiva",
                table: "mesaeventos",
                column: "IDSistemaVersaoEfetiva");

            migrationBuilder.CreateIndex(
                name: "IX_mesaeventos_IDSistemaVersaoPersonagem",
                table: "mesaeventos",
                column: "IDSistemaVersaoPersonagem");

            migrationBuilder.CreateIndex(
                name: "IX_mesaeventos_IDUsuarioAtor",
                table: "mesaeventos",
                column: "IDUsuarioAtor");

            migrationBuilder.CreateIndex(
                name: "UX_MesaEvento_Sessao_Sequencia",
                table: "mesaeventos",
                columns: new[] { "IDMesaSessao", "Sequencia" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MesaSessao_Mesa_Status_Inicio",
                table: "mesasessoes",
                columns: new[] { "IDMesa", "Status", "IniciadaEmUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_mesasessoes_IDSistemaVersao",
                table: "mesasessoes",
                column: "IDSistemaVersao");

            migrationBuilder.CreateIndex(
                name: "IX_mesasessoes_IDUsuarioCriacao",
                table: "mesasessoes",
                column: "IDUsuarioCriacao");

            migrationBuilder.CreateIndex(
                name: "IX_mesasessoes_IDUsuarioEncerramento",
                table: "mesasessoes",
                column: "IDUsuarioEncerramento");

            migrationBuilder.CreateIndex(
                name: "UX_MesaSessao_Mesa_Ativa",
                table: "mesasessoes",
                columns: new[] { "IDMesa", "ChaveAtiva" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Mesa_SessaoAtiva",
                table: "mesas",
                column: "IDMesaSessaoAtiva",
                principalTable: "mesasessoes",
                principalColumn: "IDMesaSessao",
                onDelete: ReferentialAction.Restrict);

            // Mesas já ao vivo continuam com uma sessão e histórico após a atualização.
            migrationBuilder.Sql("""
                INSERT INTO mesasessoes
                    (IDMesa, Status, IDSistemaVersao, IDUsuarioCriacao, IniciadaEmUtc,
                     RevisaoEstado, UltimaSequenciaEvento, VersaoSchema, ContextoAberturaJson)
                SELECT m.IDMesa, 'Ativa', m.IdSistemaVersao, m.IDUsuarioCriacao,
                       UTC_TIMESTAMP(6), 1, 1, 1,
                       '{"schemaVersion":1,"origem":"Migracao"}'
                FROM mesas AS m
                INNER JOIN sistemaversoes AS v ON v.IdSistemaVersao = m.IdSistemaVersao
                WHERE m.AoVivo = 1 AND m.PadraoSistema = 0 AND v.Status <> 'Rascunho';
                """);

            migrationBuilder.Sql("""
                UPDATE mesas AS m
                INNER JOIN mesasessoes AS s ON s.IDMesa = m.IDMesa AND s.Status = 'Ativa'
                SET m.IDMesaSessaoAtiva = s.IDMesaSessao, m.RevisaoRuntime = 1
                WHERE m.AoVivo = 1 AND m.IDMesaSessaoAtiva IS NULL;
                """);

            migrationBuilder.Sql("""
                INSERT INTO mesaeventos
                    (IDMesaSessao, Sequencia, Tipo, Origem, Visibilidade,
                     IDUsuarioAtor, IDSistemaVersaoEfetiva, CodigoRegra,
                     SchemaVersion, DadosJson, OcorreuEmUtc)
                SELECT s.IDMesaSessao, 1, 'SESSAO_INICIADA', 'Administrativa',
                       'PublicaMesa', s.IDUsuarioCriacao, s.IDSistemaVersao,
                       'SESSAO_INICIAR', 1,
                       '{"schemaVersion":1,"titulo":"Sessão em andamento","descricao":"Sessão anterior preservada na atualização.","manual":false}',
                       s.IniciadaEmUtc
                FROM mesasessoes AS s
                INNER JOIN mesas AS m ON m.IDMesaSessaoAtiva = s.IDMesaSessao;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Mesa_SessaoAtiva",
                table: "mesas");

            migrationBuilder.DropTable(
                name: "mesarolagens");

            migrationBuilder.DropTable(
                name: "mesaeventos");

            migrationBuilder.DropTable(
                name: "mesacomandos");

            migrationBuilder.DropTable(
                name: "mesasessoes");

            migrationBuilder.DropIndex(
                name: "UX_Mesa_SessaoAtiva",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "RevisaoRuntime",
                table: "personagensJogador");

            migrationBuilder.DropColumn(
                name: "IDMesaSessaoAtiva",
                table: "mesas");

            migrationBuilder.DropColumn(
                name: "RevisaoRuntime",
                table: "mesas");
        }
    }
}
