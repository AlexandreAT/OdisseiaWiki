using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OdisseiaWiki.Migrations
{
    /// <inheritdoc />
    public partial class AddGameplayCombatState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoRecurso",
                table: "sistemacondicoes",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "CodigoRecursoGatilho",
                table: "sistemacondicoes",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "CooldownTurnos",
                table: "sistemacondicoes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MomentoEfeito",
                table: "sistemacondicoes",
                type: "varchar(30)",
                maxLength: 30,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "OperacaoEfeito",
                table: "sistemacondicoes",
                type: "varchar(30)",
                maxLength: 30,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "OperadorGatilho",
                table: "sistemacondicoes",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "RegraRemocao",
                table: "sistemacondicoes",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true,
                collation: "utf8mb4_general_ci")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "ValorEfeito",
                table: "sistemacondicoes",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorGatilho",
                table: "sistemacondicoes",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE `sistemacondicoes`
                SET `CodigoRecursoGatilho` = COALESCE(`CodigoRecursoGatilho`, 'ESTAMINA'),
                    `OperadorGatilho` = COALESCE(`OperadorGatilho`, '<='),
                    `ValorGatilho` = COALESCE(`ValorGatilho`, 0),
                    `CodigoRecurso` = COALESCE(`CodigoRecurso`, 'ESTAMINA'),
                    `OperacaoEfeito` = COALESCE(`OperacaoEfeito`, 'REDUZIR_LIMITE_PERCENTUAL'),
                    `ValorEfeito` = COALESCE(`ValorEfeito`, 25),
                    `MomentoEfeito` = COALESCE(`MomentoEfeito`, 'ENQUANTO_ATIVA'),
                    `RegraRemocao` = COALESCE(`RegraRemocao`, 'Descanso normal ou longo')
                WHERE UPPER(REPLACE(REPLACE(`Codigo`, '-', '_'), ' ', '_')) = 'FADIGA';

                UPDATE `sistemacondicoes`
                SET `CodigoRecursoGatilho` = COALESCE(`CodigoRecursoGatilho`, 'MANA'),
                    `OperadorGatilho` = COALESCE(`OperadorGatilho`, '<='),
                    `ValorGatilho` = COALESCE(`ValorGatilho`, 0),
                    `CodigoRecurso` = COALESCE(`CodigoRecurso`, 'MANA'),
                    `OperacaoEfeito` = COALESCE(`OperacaoEfeito`, 'BLOQUEAR_RECUPERACAO'),
                    `MomentoEfeito` = COALESCE(`MomentoEfeito`, 'ENQUANTO_ATIVA'),
                    `RegraRemocao` = COALESCE(`RegraRemocao`, 'Após a duração configurada')
                WHERE UPPER(REPLACE(REPLACE(`Codigo`, '-', '_'), ' ', '_')) IN ('DEPENDENCIA_MANA', 'DEPENDENCIA_DE_MANA');");

            migrationBuilder.AddColumn<long>(
                name: "IDParticipanteCombate",
                table: "mesaeventos",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "mesacombateparticipantes",
                columns: table => new
                {
                    IDMesaCombateParticipante = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesaCombate = table.Column<long>(type: "bigint", nullable: false),
                    Tipo = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDPersonagemJogador = table.Column<int>(type: "int(11)", nullable: true),
                    IDUsuarioControlador = table.Column<int>(type: "int(11)", nullable: true),
                    NomeSnapshot = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ImagemSnapshot = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ModificadorIniciativa = table.Column<int>(type: "int", nullable: false),
                    Iniciativa = table.Column<int>(type: "int", nullable: true),
                    ValorNaturalIniciativa = table.Column<int>(type: "int", nullable: true),
                    Ordem = table.Column<int>(type: "int", nullable: false),
                    SucessosSobrevivencia = table.Column<int>(type: "int", nullable: false),
                    FalhasSobrevivencia = table.Column<int>(type: "int", nullable: false),
                    TurnosConcluidos = table.Column<int>(type: "int", nullable: false),
                    CriadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IniciativaRoladaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesacombateparticipantes", x => x.IDMesaCombateParticipante);
                    table.ForeignKey(
                        name: "FK_mesacombateparticipantes_personagensJogador_IDPersonagemJoga~",
                        column: x => x.IDPersonagemJogador,
                        principalTable: "personagensJogador",
                        principalColumn: "IDPersonagemJogador",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_mesacombateparticipantes_usuarios_IDUsuarioControlador",
                        column: x => x.IDUsuarioControlador,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesacombates",
                columns: table => new
                {
                    IDMesaCombate = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesaSessao = table.Column<long>(type: "bigint", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RodadaAtual = table.Column<int>(type: "int", nullable: false),
                    IndiceTurnoAtual = table.Column<int>(type: "int", nullable: false),
                    IDParticipanteAtual = table.Column<long>(type: "bigint", nullable: true),
                    Revisao = table.Column<long>(type: "bigint", nullable: false),
                    IDUsuarioCriacao = table.Column<int>(type: "int(11)", nullable: true),
                    IDUsuarioEncerramento = table.Column<int>(type: "int(11)", nullable: true),
                    CriadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IniciadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    EncerradoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ChaveAtiva = table.Column<int>(type: "int", nullable: true, computedColumnSql: "CASE WHEN `Status` <> 'Encerrado' THEN 1 ELSE NULL END", stored: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesacombates", x => x.IDMesaCombate);
                    table.ForeignKey(
                        name: "FK_MesaCombate_ParticipanteAtual",
                        column: x => x.IDParticipanteAtual,
                        principalTable: "mesacombateparticipantes",
                        principalColumn: "IDMesaCombateParticipante",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MesaCombate_Sessao",
                        column: x => x.IDMesaSessao,
                        principalTable: "mesasessoes",
                        principalColumn: "IDMesaSessao",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_mesacombates_usuarios_IDUsuarioCriacao",
                        column: x => x.IDUsuarioCriacao,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_mesacombates_usuarios_IDUsuarioEncerramento",
                        column: x => x.IDUsuarioEncerramento,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesacondicoesativas",
                columns: table => new
                {
                    IDMesaCondicaoAtiva = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesaCombate = table.Column<long>(type: "bigint", nullable: false),
                    IDParticipante = table.Column<long>(type: "bigint", nullable: false),
                    IDSistemaCondicao = table.Column<int>(type: "int", nullable: false),
                    CodigoSnapshot = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeSnapshot = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Acumulos = table.Column<int>(type: "int", nullable: false),
                    Valor = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    Duracao = table.Column<int>(type: "int", nullable: true),
                    UnidadeDuracao = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RodadaAplicacao = table.Column<int>(type: "int", nullable: false),
                    TurnoAplicacao = table.Column<int>(type: "int", nullable: false),
                    TurnosRestantes = table.Column<int>(type: "int", nullable: true),
                    CooldownTurnos = table.Column<int>(type: "int", nullable: true),
                    GatilhoRearmado = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    RegraSnapshotJson = table.Column<string>(type: "json", nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IDUsuarioAplicacao = table.Column<int>(type: "int(11)", nullable: true),
                    AplicadaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    RemovidaEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MotivoRemocao = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesacondicoesativas", x => x.IDMesaCondicaoAtiva);
                    table.ForeignKey(
                        name: "FK_mesacondicoesativas_mesacombateparticipantes_IDParticipante",
                        column: x => x.IDParticipante,
                        principalTable: "mesacombateparticipantes",
                        principalColumn: "IDMesaCombateParticipante",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_mesacondicoesativas_mesacombates_IDMesaCombate",
                        column: x => x.IDMesaCombate,
                        principalTable: "mesacombates",
                        principalColumn: "IDMesaCombate",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_mesacondicoesativas_sistemacondicoes_IDSistemaCondicao",
                        column: x => x.IDSistemaCondicao,
                        principalTable: "sistemacondicoes",
                        principalColumn: "IdSistemaCondicao",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_mesacondicoesativas_usuarios_IDUsuarioAplicacao",
                        column: x => x.IDUsuarioAplicacao,
                        principalTable: "usuarios",
                        principalColumn: "IDUsuario",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateTable(
                name: "mesacooldownsativos",
                columns: table => new
                {
                    IDMesaCooldownAtivo = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    IDMesaCombate = table.Column<long>(type: "bigint", nullable: false),
                    IDParticipante = table.Column<long>(type: "bigint", nullable: false),
                    TipoOrigem = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IdOrigem = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NomeSnapshot = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TurnosRestantes = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, collation: "utf8mb4_general_ci")
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RodadaInicio = table.Column<int>(type: "int", nullable: false),
                    TurnoInicio = table.Column<int>(type: "int", nullable: false),
                    CriadoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EncerradoEmUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mesacooldownsativos", x => x.IDMesaCooldownAtivo);
                    table.ForeignKey(
                        name: "FK_mesacooldownsativos_mesacombateparticipantes_IDParticipante",
                        column: x => x.IDParticipante,
                        principalTable: "mesacombateparticipantes",
                        principalColumn: "IDMesaCombateParticipante",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_mesacooldownsativos_mesacombates_IDMesaCombate",
                        column: x => x.IDMesaCombate,
                        principalTable: "mesacombates",
                        principalColumn: "IDMesaCombate",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4")
                .Annotation("Relational:Collation", "utf8mb4_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_mesaeventos_IDParticipanteCombate",
                table: "mesaeventos",
                column: "IDParticipanteCombate");

            migrationBuilder.CreateIndex(
                name: "IX_mesacombateparticipantes_IDMesaCombate_Ordem",
                table: "mesacombateparticipantes",
                columns: new[] { "IDMesaCombate", "Ordem" });

            migrationBuilder.CreateIndex(
                name: "IX_mesacombateparticipantes_IDPersonagemJogador",
                table: "mesacombateparticipantes",
                column: "IDPersonagemJogador");

            migrationBuilder.CreateIndex(
                name: "IX_mesacombateparticipantes_IDUsuarioControlador",
                table: "mesacombateparticipantes",
                column: "IDUsuarioControlador");

            migrationBuilder.CreateIndex(
                name: "UX_MesaCombateParticipante_Personagem",
                table: "mesacombateparticipantes",
                columns: new[] { "IDMesaCombate", "IDPersonagemJogador" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_mesacombates_IDParticipanteAtual",
                table: "mesacombates",
                column: "IDParticipanteAtual");

            migrationBuilder.CreateIndex(
                name: "IX_mesacombates_IDUsuarioCriacao",
                table: "mesacombates",
                column: "IDUsuarioCriacao");

            migrationBuilder.CreateIndex(
                name: "IX_mesacombates_IDUsuarioEncerramento",
                table: "mesacombates",
                column: "IDUsuarioEncerramento");

            migrationBuilder.CreateIndex(
                name: "UX_MesaCombate_Sessao_Ativo",
                table: "mesacombates",
                columns: new[] { "IDMesaSessao", "ChaveAtiva" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_mesacondicoesativas_IDMesaCombate",
                table: "mesacondicoesativas",
                column: "IDMesaCombate");

            migrationBuilder.CreateIndex(
                name: "IX_mesacondicoesativas_IDParticipante_Status_CodigoSnapshot",
                table: "mesacondicoesativas",
                columns: new[] { "IDParticipante", "Status", "CodigoSnapshot" });

            migrationBuilder.CreateIndex(
                name: "IX_mesacondicoesativas_IDSistemaCondicao",
                table: "mesacondicoesativas",
                column: "IDSistemaCondicao");

            migrationBuilder.CreateIndex(
                name: "IX_mesacondicoesativas_IDUsuarioAplicacao",
                table: "mesacondicoesativas",
                column: "IDUsuarioAplicacao");

            migrationBuilder.CreateIndex(
                name: "IX_mesacooldownsativos_IDMesaCombate",
                table: "mesacooldownsativos",
                column: "IDMesaCombate");

            migrationBuilder.CreateIndex(
                name: "IX_mesacooldownsativos_IDParticipante_Status_TipoOrigem_IdOrigem",
                table: "mesacooldownsativos",
                columns: new[] { "IDParticipante", "Status", "TipoOrigem", "IdOrigem" });

            migrationBuilder.AddForeignKey(
                name: "FK_MesaEvento_ParticipanteCombate",
                table: "mesaeventos",
                column: "IDParticipanteCombate",
                principalTable: "mesacombateparticipantes",
                principalColumn: "IDMesaCombateParticipante",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_mesacombateparticipantes_mesacombates_IDMesaCombate",
                table: "mesacombateparticipantes",
                column: "IDMesaCombate",
                principalTable: "mesacombates",
                principalColumn: "IDMesaCombate",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MesaEvento_ParticipanteCombate",
                table: "mesaeventos");

            migrationBuilder.DropForeignKey(
                name: "FK_mesacombateparticipantes_mesacombates_IDMesaCombate",
                table: "mesacombateparticipantes");

            migrationBuilder.DropTable(
                name: "mesacondicoesativas");

            migrationBuilder.DropTable(
                name: "mesacooldownsativos");

            migrationBuilder.DropTable(
                name: "mesacombates");

            migrationBuilder.DropTable(
                name: "mesacombateparticipantes");

            migrationBuilder.DropIndex(
                name: "IX_mesaeventos_IDParticipanteCombate",
                table: "mesaeventos");

            migrationBuilder.DropColumn(
                name: "CodigoRecurso",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "CodigoRecursoGatilho",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "CooldownTurnos",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "MomentoEfeito",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "OperacaoEfeito",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "OperadorGatilho",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "RegraRemocao",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "ValorEfeito",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "ValorGatilho",
                table: "sistemacondicoes");

            migrationBuilder.DropColumn(
                name: "IDParticipanteCombate",
                table: "mesaeventos");
        }
    }
}
