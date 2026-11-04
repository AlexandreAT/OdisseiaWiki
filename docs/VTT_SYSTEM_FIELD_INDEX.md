# Índice de campos do Sistema para o VTT

Revisão: 04/11/2026. Base: `main`, commit `a7903719`.

Este anexo acompanha o [levantamento funcional](VTT_SYSTEM_CAPABILITIES.md). Lista os contratos de configuração, catálogo, resolução e versionamento encontrados no backend. **Existir neste índice não significa possuir automação:** o comportamento e os limites estão no levantamento principal.

São **52 classes e 445 declarações de propriedades**, conferidas contra os três arquivos de origem. Campos de classes-base também pertencem às classes derivadas, sem repetição neste índice. Não inclui propriedades de entidades de banco que não fazem parte desses DTOs, nem inventa entradas editáveis para respostas de leitura.

Os nomes abaixo são os nomes C#; no JSON HTTP normalmente são serializados em camelCase. `?` indica tipo anulável. IDs, snapshots resolvidos, avisos, proveniência e resumos são metadados ou respostas, não regras livremente editáveis. Os campos específicos de itens/poderes e do modo roguelike estão nas seções próprias do documento principal e em seus contratos vinculados.

## SistemaConfiguracaoDtos.cs

Origem: [SistemaConfiguracaoDtos.cs](../OdisseiaWiki/Dtos/SistemaConfiguracaoDtos.cs).

### SistemaConfiguracaoGeralDto

| Campo | Tipo |
|---|---|
| `DadoTesteGeral` | `string` |
| `UsaVantagem` | `bool` |
| `UsaDesvantagem` | `bool` |
| `CriticoNatural` | `int` |
| `FalhaCriticaNatural` | `int` |
| `RegraArredondamento` | `string` |
| `RegraEspecificaPrevalece` | `bool` |
| `AutoridadeMestre` | `bool` |
| `ObservacoesRegrasFundamentais` | `string?` |
| `Modulos` | `List<SistemaModuloDto>` |

### SistemaCriacaoConfigDto

| Campo | Tipo |
|---|---|
| `NivelInicial` | `int` |
| `PontosIniciais` | `int` |
| `PontosAtributoIniciais` | `int` |
| `PontosSkillIniciais` | `int` |
| `MaximoSkillsIniciais` | `int` |
| `MaximoMagiasIniciais` | `int` |
| `MaximoUltimatesIniciais` | `int` |
| `Racas` | `List<SistemaRacaConfigDto>` |
| `Atributos` | `List<SistemaAtributoConfigDto>` |
| `Recursos` | `List<SistemaRecursoConfigDto>` |

### SistemaProgressaoConfigDto

| Campo | Tipo |
|---|---|
| `DadoLootFaces` | `int?` |
| `InfluenciasAtributos` | `List<SistemaAtributoRecursoDto>` |
| `NivelMaximo` | `int` |
| `PermiteXpExcedente` | `bool` |
| `Niveis` | `List<SistemaNivelDto>` |
| `Marcos` | `List<SistemaMarcoNivelDto>` |
| `FontesExperiencia` | `List<SistemaFonteExperienciaDto>` |

### SistemaAtributoRecursoDto

| Campo | Tipo |
|---|---|
| `CodigoAtributo` | `string` |
| `Recurso` | `string` |
| `PercentualPorValor` | `decimal` |

### SistemaExploracaoConfigDto

| Campo | Tipo |
|---|---|
| `Movimento` | `SistemaMovimentoConfigDto?` |
| `PontosAcao` | `SistemaPontosAcaoConfigDto?` |
| `Acoes` | `List<SistemaAcaoConfigDto>` |
| `CargaUsaLimite` | `bool` |
| `PenalidadeExcessoCarga` | `string?` |
| `FurtividadeObservacoes` | `string?` |

### SistemaCombateConfigDto

| Campo | Tipo |
|---|---|
| `UsaIniciativa` | `bool` |
| `FormulaIniciativa` | `string?` |
| `SegundosPorTurno` | `int` |
| `EstaminaPorAtaqueAdicional` | `int` |
| `LimitesAcoesPorArma` | `List<SistemaLimiteAcoesArmaDto>` |
| `DanoAreaPorResultado` | `List<SistemaDanoAreaResultadoDto>` |
| `RegraDeclaracaoAcoes` | `string?` |
| `ResultadosDado` | `List<SistemaResultadoDadoDto>` |
| `TiposDano` | `List<SistemaTipoDanoDto>` |
| `TiposDefesa` | `List<SistemaTipoDefesaDto>` |

### SistemaLimiteAcoesArmaDto

| Campo | Tipo |
|---|---|
| `TipoArma` | `string` |
| `MaximoTiros` | `int` |
| `MaximoRajadas` | `int` |
| `MaximoGolpes` | `int` |

### SistemaDanoAreaResultadoDto

| Campo | Tipo |
|---|---|
| `CodigoResultado` | `string` |
| `Percentual` | `decimal` |

### SistemaPoderesConfigDto

| Campo | Tipo |
|---|---|
| `LimiteMagias` | `int` |
| `PermiteMagiasCompostas` | `bool` |
| `RegraAprendizadoMagia` | `string?` |
| `TiposMagia` | `List<SistemaTipoMagiaDto>` |
| `SkillConfig` | `SistemaSkillConfigDto?` |

### SistemaSobrevivenciaConfigDto

| Campo | Tipo |
|---|---|
| `CodigosRemocaoConfirmada` | `List<string>` |
| `Condicoes` | `List<SistemaCondicaoDto>` |
| `Descansos` | `List<SistemaDescansoConfigDto>` |
| `Morte` | `SistemaMorteConfigDto?` |
| `RegraLoot` | `string?` |
| `RegraRefeicoes` | `string?` |

### SistemaModuloDto

| Campo | Tipo |
|---|---|
| `IdSistemaModulo` | `int` |
| `TipoModulo` | `SistemaModuloTipo` |
| `Habilitado` | `bool` |
| `SchemaVersion` | `int` |
| `Ordem` | `int` |

### SistemaNivelDto

| Campo | Tipo |
|---|---|
| `IdSistemaNivel` | `int` |
| `Nivel` | `int` |
| `XpParaProximoNivel` | `int` |
| `PontosNivel` | `int` |
| `PontosAtributo` | `int` |
| `PontosSkill` | `int` |
| `PontosUltimate` | `int` |
| `PermiteNovaMagia` | `bool` |
| `PermiteNovaSkill` | `bool` |
| `Observacao` | `string?` |
| `Ordem` | `int` |

### SistemaMarcoNivelDto

| Campo | Tipo |
|---|---|
| `IdSistemaMarcoNivel` | `int` |
| `Nivel` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `TipoRecompensa` | `string` |
| `ConfiguracaoJson` | `string?` |
| `Ordem` | `int` |

### SistemaFonteExperienciaDto

| Campo | Tipo |
|---|---|
| `IdSistemaFonteExperiencia` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `TipoTeste` | `string?` |
| `Formula` | `string?` |
| `ValorMinimo` | `int?` |
| `ValorMaximo` | `int?` |
| `UsaVantagem` | `bool` |
| `Descricao` | `string?` |
| `ConfiguracaoJson` | `string?` |
| `Ordem` | `int` |

### SistemaRacaConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaRacaConfig` | `int` |
| `IdRaca` | `int?` |
| `CodigoRaca` | `string?` |
| `NomeRaca` | `string?` |
| `Jogavel` | `bool` |
| `VidaBase` | `int` |
| `EstaminaBase` | `int` |
| `ManaBase` | `int` |
| `CapacidadeCargaBase` | `int` |
| `CodigoAtributoInicial` | `string?` |
| `Passivas` | `string?` |
| `Variantes` | `string?` |
| `NivelDesbloqueio` | `int` |
| `Observacoes` | `string?` |
| `Ordem` | `int` |
| `PassivasVinculadas` | `List<SistemaRacaPassivaDto>` |

### SistemaRacaPassivaDto

| Campo | Tipo |
|---|---|
| `IdSistemaRacaPassiva` | `int` |
| `IdPassiva` | `int?` |
| `CodigoPassiva` | `string` |
| `NomeExibicao` | `string` |
| `Variante` | `string?` |
| `Ordem` | `int` |
| `NivelDesbloqueio` | `int` |

### SistemaAtributoConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaAtributo` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Grupo` | `SistemaAtributoGrupo` |
| `ValorMinimo` | `int` |
| `ValorMaximoNatural` | `int` |
| `ValorMaximoAbsoluto` | `int?` |
| `ValorComum` | `int` |
| `FormulaTeste` | `string?` |
| `LimiteUso` | `int?` |
| `TipoLimiteUso` | `string?` |
| `Descricao` | `string?` |
| `Ordem` | `int` |
| `Ativo` | `bool` |

### SistemaRecursoConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaRecurso` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `ValorMinimo` | `decimal` |
| `ValorPadrao` | `decimal` |
| `ValorMaximo` | `decimal?` |
| `PermiteValorNegativo` | `bool` |
| `RecuperacaoPadrao` | `decimal` |
| `RecuperacaoDescansoSimples` | `decimal` |
| `RecuperacaoDescansoNormal` | `decimal` |
| `RecuperacaoDescansoLongo` | `decimal` |
| `CondicaoAoZerar` | `string?` |
| `FormulaValorInicial` | `string?` |
| `FormulaValorMaximo` | `string?` |
| `Formula` | `string?` |
| `Ordem` | `int` |
| `Ativo` | `bool` |

### SistemaMovimentoConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaMovimentoConfig` | `int` |
| `UsaGrid` | `bool` |
| `MetrosPorQuadrado` | `decimal` |
| `MovimentoGratuito` | `int` |
| `CustoEstaminaPorQuadrado` | `decimal` |
| `MaximoQuadradosTurno` | `int?` |
| `PermiteMoverAposAtaque` | `bool` |
| `Observacoes` | `string?` |

### SistemaPontosAcaoConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaPontosAcaoConfig` | `int` |
| `Habilitado` | `bool` |
| `PontosPorTurno` | `int` |
| `SegundosPorPonto` | `int` |
| `PermiteAcumular` | `bool` |
| `LimiteAcumulado` | `int` |

### SistemaAcaoConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaAcaoConfig` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Tipo` | `string` |
| `CustoPontosAcao` | `decimal` |
| `CustoEstamina` | `decimal` |
| `CustoMana` | `decimal` |
| `EncerraTurno` | `bool` |
| `PermiteCombo` | `bool` |
| `ExigeAlvo` | `bool` |
| `Formula` | `string?` |
| `Descricao` | `string?` |
| `Ordem` | `int` |
| `ConfiguracaoJson` | `string?` |

### SistemaResultadoDadoDto

| Campo | Tipo |
|---|---|
| `IdSistemaResultadoDado` | `int` |
| `CodigoTeste` | `string` |
| `NomeTeste` | `string` |
| `Dado` | `string` |
| `QuantidadeDados` | `int` |
| `ResultadoMinimo` | `int` |
| `ResultadoMaximo` | `int` |
| `ExigeNatural` | `bool` |
| `CodigoResultado` | `string` |
| `NomeResultado` | `string` |
| `Descricao` | `string?` |
| `EfeitoJson` | `string?` |
| `Ordem` | `int` |

### SistemaTipoDanoDto

| Campo | Tipo |
|---|---|
| `IdSistemaTipoDano` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `IgnoraArmadura` | `bool` |
| `IgnoraProtecao` | `bool` |
| `IgnoraEscudo` | `bool` |
| `Periodico` | `bool` |
| `Area` | `bool` |
| `ConfiguracaoJson` | `string?` |
| `Ordem` | `int` |

### SistemaTipoDefesaDto

| Campo | Tipo |
|---|---|
| `IdSistemaTipoDefesa` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `OrdemAplicacao` | `int` |
| `TipoComportamento` | `string` |
| `Formula` | `string?` |
| `ConfiguracaoJson` | `string?` |
| `Ordem` | `int` |

### SistemaTipoMagiaDto

| Campo | Tipo |
|---|---|
| `IdSistemaTipoMagia` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `Cor` | `string?` |
| `Afinidade` | `string?` |
| `CustoBase` | `decimal` |
| `Ordem` | `int` |
| `ConfiguracaoJson` | `string?` |

### SistemaSkillConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaSkillConfig` | `int` |
| `MaximoSkills` | `int` |
| `NivelMaximoSkill` | `int` |
| `MaximoUltimates` | `int` |
| `NivelDesbloqueioUltimate` | `int` |
| `MaximoMagias` | `int?` |
| `UsaCooldown` | `bool` |
| `PermiteArtesEtericas` | `bool` |
| `Observacoes` | `string?` |

### SistemaCondicaoDto

| Campo | Tipo |
|---|---|
| `IdSistemaCondicao` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `Tipo` | `string` |
| `DuracaoPadrao` | `int?` |
| `UnidadeDuracao` | `SistemaUnidadeDuracao` |
| `Empilhavel` | `bool` |
| `RemocaoAutomatica` | `bool` |
| `PermiteSobrescrever` | `bool` |
| `ValorPadrao` | `decimal?` |
| `CodigoRecurso` | `string?` |
| `OperacaoEfeito` | `string?` |
| `ValorEfeito` | `decimal?` |
| `MomentoEfeito` | `string?` |
| `CodigoRecursoGatilho` | `string?` |
| `OperadorGatilho` | `string?` |
| `ValorGatilho` | `decimal?` |
| `CooldownTurnos` | `int?` |
| `RegraRemocao` | `string?` |
| `ConfiguracaoPadraoJson` | `string?` |
| `Ordem` | `int` |

### SistemaDescansoConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaDescansoConfig` | `int` |
| `Tipo` | `string` |
| `Nome` | `string` |
| `DuracaoMinimaMinutos` | `int?` |
| `DuracaoMaximaMinutos` | `int?` |
| `RecuperacaoVida` | `decimal` |
| `RecuperacaoMana` | `decimal` |
| `RecuperacaoEstamina` | `decimal` |
| `TipoRecuperacao` | `SistemaRecuperacaoTipo` |
| `ExigeGuarda` | `bool` |
| `IntervaloTesteGuardaMinutos` | `int?` |
| `PermiteAtividades` | `bool` |
| `ConfiguracaoJson` | `string?` |
| `Ordem` | `int` |

### SistemaMorteConfigDto

| Campo | Tipo |
|---|---|
| `IdSistemaMorteConfig` | `int` |
| `LimiteBeiraDaMorte` | `int` |
| `QuantidadeTestesCombate` | `int` |
| `QuantidadeTestesForaCombate` | `int` |
| `SucessosNecessarios` | `int` |
| `DadoSobrevivencia` | `string` |
| `ResultadoMinimoSucesso` | `int` |
| `LimiteVidaDesmembramento` | `int` |
| `MultiplicadorDanoDesmembramento` | `decimal` |
| `LimiteVidaInstaKill` | `int` |
| `MultiplicadorDanoInstaKill` | `decimal` |
| `PermiteEstabilizacaoManual` | `bool` |
| `Observacoes` | `string?` |
| `ConfiguracaoJson` | `string?` |

## SistemaRuntimeDtos.cs

Origem: [SistemaRuntimeDtos.cs](../OdisseiaWiki/Dtos/SistemaRuntimeDtos.cs).

### SistemaRuntimeConsultaDto

| Campo | Tipo |
|---|---|
| `IdMesa` | `int?` |
| `IdPersonagemJogador` | `int?` |
| `TipoEntidade` | `SistemaEntidadeGlobalTipo?` |
| `IdEntidade` | `string?` |
| `IdRaca` | `int?` |
| `CodigoTipoItem` | `string?` |
| `CodigoCategoriaItem` | `string?` |
| `CodigoArquetipoItem` | `string?` |

### SistemaRuntimeContextoDto

| Campo | Tipo |
|---|---|
| `IdSistemaRpg` | `int?` |
| `IdSistemaVersao` | `int?` |
| `CodigoSistema` | `string` |
| `NomeSistema` | `string?` |
| `NumeroVersao` | `string` |
| `StatusVersao` | `SistemaVersaoStatus?` |
| `Origem` | `SistemaRuntimeOrigem` |
| `IdMesa` | `int?` |
| `IdPersonagemJogador` | `int?` |
| `Entidade` | `SistemaRuntimeVinculoEntidadeDto?` |
| `AcompanhaPublicacaoAtual` | `bool` |
| `IdVersaoFixada` | `int?` |
| `AtualizacaoDisponivel` | `bool` |
| `IdVersaoDisponivel` | `int?` |
| `NumeroVersaoDisponivel` | `string?` |
| `UsaFallbackLegado` | `bool` |
| `ConfiguracaoGeral` | `SistemaConfiguracaoGeralDto?` |
| `Criacao` | `SistemaCriacaoConfigDto?` |
| `Progressao` | `SistemaProgressaoConfigDto?` |
| `Exploracao` | `SistemaExploracaoConfigDto?` |
| `Combate` | `SistemaCombateConfigDto?` |
| `Poderes` | `SistemaPoderesConfigDto?` |
| `Sobrevivencia` | `SistemaSobrevivenciaConfigDto?` |
| `ConfiguracaoRacial` | `SistemaRacaConfigDto?` |
| `Itens` | `SistemaItensConfigDto` |
| `ReferenciaItem` | `SistemaItemReferenciaEfetivaDto?` |
| `Proveniencias` | `List<SistemaRuntimeProvenienciaDto>` |
| `Warnings` | `List<SistemaRuntimeWarningDto>` |
| `Fallbacks` | `List<SistemaRuntimeFallbackDto>` |

### SistemaRuntimeVinculoEntidadeDto

| Campo | Tipo |
|---|---|
| `TipoEntidade` | `SistemaEntidadeGlobalTipo` |
| `IdEntidade` | `string` |
| `IdSistemaRpg` | `int?` |
| `IdSistemaVersao` | `int?` |
| `AcompanharPublicacaoAtual` | `bool` |

### SistemaRuntimeProvenienciaDto

| Campo | Tipo |
|---|---|
| `Caminho` | `string` |
| `Origem` | `SistemaValorProveniencia` |
| `Detalhe` | `string?` |

### SistemaRuntimeWarningDto

| Campo | Tipo |
|---|---|
| `Codigo` | `SistemaRuntimeWarningCodigo` |
| `Mensagem` | `string` |
| `Caminho` | `string?` |
| `ValorInformado` | `decimal?` |
| `ValorMinimoReferencia` | `decimal?` |
| `ValorMaximoReferencia` | `decimal?` |
| `Referencia` | `string?` |

### SistemaRuntimeFallbackDto

| Campo | Tipo |
|---|---|
| `Caminho` | `string` |
| `Motivo` | `string` |
| `Origem` | `SistemaValorProveniencia` |

### SistemaItensConfigDto

| Campo | Tipo |
|---|---|
| `RegrasTrajeConfiguradas` | `bool` |
| `ArquetiposTrajeConhecidos` | `List<string>` |
| `Tipos` | `List<SistemaItemEscopoDto>` |

### SistemaItemEscopoDto

| Campo | Tipo |
|---|---|
| `ArquetiposCompativeis` | `List<string>?` |
| `IdSistemaItemEscopo` | `int` |
| `IdEscopoPai` | `int?` |
| `Nivel` | `SistemaItemEscopoNivel` |
| `Codigo` | `string` |
| `CodigoCaminho` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `Ordem` | `int` |
| `Ativo` | `bool` |
| `Campos` | `List<SistemaItemCampoDto>` |
| `Faixas` | `List<SistemaItemFaixaDto>` |
| `Referencias` | `List<SistemaItemReferenciaDto>` |
| `Filhos` | `List<SistemaItemEscopoDto>` |

### SistemaItemCampoDto

| Campo | Tipo |
|---|---|
| `IdSistemaItemCampo` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Tipo` | `SistemaItemCampoTipo` |
| `Unidade` | `string?` |
| `Obrigatorio` | `bool` |
| `Descricao` | `string?` |
| `Ordem` | `int` |
| `CodigoCaminhoOrigem` | `string?` |

### SistemaItemFaixaDto

| Campo | Tipo |
|---|---|
| `IdSistemaItemFaixa` | `int` |
| `CodigoCampo` | `string` |
| `Nome` | `string` |
| `ValorMinimo` | `decimal?` |
| `ValorMaximo` | `decimal?` |
| `ValorReferencia` | `decimal?` |
| `Unidade` | `string?` |
| `Descricao` | `string?` |
| `Ordem` | `int` |
| `CodigoCaminhoOrigem` | `string?` |

### SistemaItemReferenciaDto

| Campo | Tipo |
|---|---|
| `IdSistemaItemReferencia` | `int` |
| `Tipo` | `SistemaItemReferenciaTipo` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Valor` | `string?` |
| `Descricao` | `string?` |
| `Ordem` | `int` |
| `CodigoCaminhoOrigem` | `string?` |

### SistemaItemReferenciaEfetivaDto

| Campo | Tipo |
|---|---|
| `CodigoTipo` | `string?` |
| `CodigoCategoria` | `string?` |
| `CodigoArquetipo` | `string?` |
| `CodigoCaminho` | `string?` |
| `Completa` | `bool` |
| `Campos` | `List<SistemaItemCampoDto>` |
| `Faixas` | `List<SistemaItemFaixaDto>` |
| `Referencias` | `List<SistemaItemReferenciaDto>` |

### SistemaRacaRuntimeOverrideDto

| Campo | Tipo |
|---|---|
| `VidaBase` | `int?` |
| `EstaminaBase` | `int?` |
| `ManaBase` | `int?` |
| `CapacidadeCargaBase` | `int?` |
| `CodigoAtributoInicial` | `string?` |

## SistemaRpgDtos.cs

Origem: [SistemaRpgDtos.cs](../OdisseiaWiki/Dtos/SistemaRpgDtos.cs).

### SistemaRpgCreateDto

| Campo | Tipo |
|---|---|
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `Ativo` | `bool` |

### SistemaRpgUpdateDto

| Campo | Tipo |
|---|---|
| `Nome` | `string` |
| `Descricao` | `string?` |
| `Ativo` | `bool` |

### SistemaRpgResumoDto

| Campo | Tipo |
|---|---|
| `IdSistemaRpg` | `int` |
| `Codigo` | `string` |
| `Nome` | `string` |
| `Descricao` | `string?` |
| `Ativo` | `bool` |
| `IdVersaoPublicada` | `int?` |
| `NumeroVersaoPublicada` | `string?` |
| `QuantidadeVersoes` | `int` |
| `QuantidadeMesas` | `int` |
| `DataCriacao` | `DateTime` |
| `DataAtualizacao` | `DateTime` |

### SistemaRpgDetalheDto

| Campo | Tipo |
|---|---|
| `Versoes` | `List<SistemaVersaoResumoDto>` |

### SistemaVersaoCreateDto

| Campo | Tipo |
|---|---|
| `NumeroVersao` | `string` |
| `IdVersaoBase` | `int?` |
| `Changelog` | `string?` |

### SistemaVersaoDuplicarDto

| Campo | Tipo |
|---|---|
| `NumeroVersao` | `string` |
| `Changelog` | `string?` |

### SistemaVersaoResumoDto

| Campo | Tipo |
|---|---|
| `IdSistemaVersao` | `int` |
| `IdSistemaRpg` | `int` |
| `NumeroVersao` | `string` |
| `Status` | `SistemaVersaoStatus` |
| `IdVersaoBase` | `int?` |
| `Changelog` | `string?` |
| `DataCriacao` | `DateTime` |
| `DataAtualizacao` | `DateTime` |
| `DataPublicacao` | `DateTime?` |
| `DataArquivamento` | `DateTime?` |
| `QuantidadeMesas` | `int` |

### SistemaVersaoDetalheDto

| Campo | Tipo |
|---|---|
| `CodigoSistema` | `string` |
| `NomeSistema` | `string` |
| `ConfiguracaoGeral` | `SistemaConfiguracaoGeralDto` |
| `Criacao` | `SistemaCriacaoConfigDto` |
| `Progressao` | `SistemaProgressaoConfigDto` |
| `Exploracao` | `SistemaExploracaoConfigDto` |
| `Combate` | `SistemaCombateConfigDto` |
| `Poderes` | `SistemaPoderesConfigDto` |
| `Sobrevivencia` | `SistemaSobrevivenciaConfigDto` |

### SistemaResolvidoDto

| Campo | Tipo |
|---|---|
| `IdSistemaRpg` | `int?` |
| `IdSistemaVersao` | `int?` |
| `CodigoSistema` | `string` |
| `NumeroVersao` | `string` |
| `Origem` | `string` |
| `UsaFallbackLegado` | `bool` |

### MesaMigrarSistemaDto

| Campo | Tipo |
|---|---|
| `IdSistemaVersao` | `int` |
| `ConfirmarPreservacaoValores` | `bool` |


