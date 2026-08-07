import AddIcon from '@mui/icons-material/Add';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import { LoadingIndicator } from '../../../../../components/Generic/LoadingIndicator';
import {
  getSistemaVersaoStatusLabel,
  isSistemaVersaoRascunho,
  SistemaModuloConfigMap,
  SistemaModuloKey,
  SistemaRpgResumo,
  SistemaVersaoResumo,
  SISTEMA_MODULO_LABELS,
} from '../../../../../models/SistemaRpg';
import {
  ActionButton,
  BackButton,
  CardDate,
  Changelog,
  DirtyIndicator,
  EditorPanel,
  HeaderActions,
  ModuleNav,
  ModuleNavButton,
  ReadOnlyBanner,
  SaveBar,
  StatePanel,
  StatusPill,
  SystemMeta,
  SystemTitle,
  VersionActions,
  VersionButton,
  VersionHeader,
  VersionList,
  VersionRail,
  VersionRailHeader,
  WorkspaceHeader,
  WorkspaceLayout,
} from '../../ManagementSystem.style';
import { SistemaValidationErrors } from '../../systemValidation';
import { ModuleEditor } from '../ModuleEditor/ModuleEditor';
import { RaceOption } from '../ModuleForms/ModuleForm.types';
import { SystemVersionOperations } from '../SystemVersionOperations/SystemVersionOperations';
import { SystemItemCatalog } from '../SystemItemCatalog/SystemItemCatalog';

type AnyModuleConfig = SistemaModuloConfigMap[SistemaModuloKey];

interface SystemWorkspaceProps {
  system: SistemaRpgResumo;
  versions: SistemaVersaoResumo[];
  versionsLoading: boolean;
  versionsError: string | null;
  selectedVersion: SistemaVersaoResumo | null;
  activeModule: SistemaModuloKey;
  moduleConfig: AnyModuleConfig | null;
  moduleLoading: boolean;
  moduleError: string | null;
  validationErrors: SistemaValidationErrors;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  readOnly: boolean;
  raceOptions: RaceOption[];
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onBack: () => void;
  onEditSystem: () => void;
  onToggleSystem: () => void;
  onDeleteSystem: () => void;
  onRetryVersions: () => void;
  onCreateVersion: () => void;
  onSelectVersion: (id: number) => void;
  onDuplicateVersion: () => void;
  onPublishVersion: () => void;
  onArchiveVersion: () => void;
  onDeleteVersion: () => void;
  onMigrationComplete: () => void;
  onSelectModule: (moduleKey: SistemaModuloKey) => void;
  onChangeModule: (config: AnyModuleConfig) => void;
  onRetryModule: () => void;
  onCreateEmptyModule: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onCatalogDirtyChange: (dirty: boolean) => void;
}

const MODULE_KEYS = Object.keys(SISTEMA_MODULO_LABELS) as SistemaModuloKey[];

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const statusStyle = (version: SistemaVersaoResumo): 'draft' | 'published' | 'archived' => {
  const label = getSistemaVersaoStatusLabel(version.status);
  if (label === 'Rascunho') return 'draft';
  if (label === 'Publicado') return 'published';
  return 'archived';
};

export const SystemWorkspace = ({
  system,
  versions,
  versionsLoading,
  versionsError,
  selectedVersion,
  activeModule,
  moduleConfig,
  moduleLoading,
  moduleError,
  validationErrors,
  dirty,
  saving,
  lastSavedAt,
  readOnly,
  raceOptions,
  theme,
  neon,
  onBack,
  onEditSystem,
  onToggleSystem,
  onDeleteSystem,
  onRetryVersions,
  onCreateVersion,
  onSelectVersion,
  onDuplicateVersion,
  onPublishVersion,
  onArchiveVersion,
  onDeleteVersion,
  onMigrationComplete,
  onSelectModule,
  onChangeModule,
  onRetryModule,
  onCreateEmptyModule,
  onSave,
  onDiscard,
  onCatalogDirtyChange,
}: SystemWorkspaceProps) => (
  <>
    <WorkspaceHeader theme={theme} neon={neon}>
      <SystemTitle>
        <BackButton type="button" theme={theme} neon={neon} onClick={onBack}>
          <ArrowBackIcon fontSize="small" /> Voltar aos sistemas
        </BackButton>
        <h2>{system.nome}</h2>
        <SystemMeta>
          <code>{system.codigo}</code>
          <StatusPill $status={system.ativo ? 'active' : 'inactive'}>
            {system.ativo ? 'Ativo' : 'Inativo'}
          </StatusPill>
          <span>{system.quantidadeMesas} {system.quantidadeMesas === 1 ? 'mesa vinculada' : 'mesas vinculadas'}</span>
        </SystemMeta>
        <p>{system.descricao?.trim() || 'Sem descrição cadastrada.'}</p>
      </SystemTitle>
      <HeaderActions>
        <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onEditSystem}>
          <EditOutlinedIcon /> Editar sistema
        </ActionButton>
        <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onToggleSystem}>
          <PowerSettingsNewIcon /> {system.ativo ? 'Desativar' : 'Ativar'}
        </ActionButton>
        <ActionButton type="button" theme={theme} neon={neon} $compact $danger onClick={onDeleteSystem}>
          <DeleteOutlineIcon /> Excluir
        </ActionButton>
      </HeaderActions>
    </WorkspaceHeader>

    <WorkspaceLayout>
      <VersionRail theme={theme} neon={neon}>
        <VersionRailHeader>
          <h3>Versões</h3>
          <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onCreateVersion}>
            <AddIcon /> Nova
          </ActionButton>
        </VersionRailHeader>

        {versionsLoading && (
          <StatePanel theme={theme} neon={neon} role="status">
            <LoadingIndicator compact label="Carregando versões" />
          </StatePanel>
        )}
        {!versionsLoading && versionsError && (
          <StatePanel theme={theme} neon={neon} $error role="alert">
            {versionsError}
            <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onRetryVersions}>
              <RefreshIcon /> Recarregar
            </ActionButton>
          </StatePanel>
        )}
        {!versionsLoading && !versionsError && versions.length === 0 && (
          <StatePanel theme={theme} neon={neon}>
            Nenhuma versão cadastrada.
          </StatePanel>
        )}
        {!versionsLoading && !versionsError && versions.length > 0 && (
          <VersionList>
            {versions.map((version) => (
              <VersionButton
                type="button"
                key={version.idSistemaVersao}
                theme={theme}
                neon={neon}
                $selected={selectedVersion?.idSistemaVersao === version.idSistemaVersao}
                onClick={() => onSelectVersion(version.idSistemaVersao)}
              >
                <div>
                  <strong>v{version.numeroVersao}</strong>
                  <small>{formatDate(version.dataAtualizacao)}</small>
                </div>
                <StatusPill $status={statusStyle(version)}>{getSistemaVersaoStatusLabel(version.status)}</StatusPill>
              </VersionButton>
            ))}
          </VersionList>
        )}
      </VersionRail>

      <EditorPanel theme={theme} neon={neon}>
        {!selectedVersion ? (
          <StatePanel theme={theme} neon={neon}>
            <SettingsSuggestOutlinedIcon />
            Selecione uma versão ou crie o primeiro rascunho deste sistema.
          </StatePanel>
        ) : (
          <>
            <VersionHeader>
              <div>
                <h3>Versão {selectedVersion.numeroVersao}</h3>
                <SystemMeta>
                  <StatusPill $status={statusStyle(selectedVersion)}>
                    {getSistemaVersaoStatusLabel(selectedVersion.status)}
                  </StatusPill>
                  <CardDate dateTime={selectedVersion.dataAtualizacao}>
                    Atualizada em {formatDate(selectedVersion.dataAtualizacao)}
                  </CardDate>
                  <span>{selectedVersion.quantidadeMesas} {selectedVersion.quantidadeMesas === 1 ? 'mesa' : 'mesas'}</span>
                </SystemMeta>
                {selectedVersion.changelog && (
                  <Changelog>
                    <summary>Ver changelog</summary>
                    <p>{selectedVersion.changelog}</p>
                  </Changelog>
                )}
              </div>
              <VersionActions>
                <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onDuplicateVersion}>
                  <ContentCopyIcon /> Duplicar
                </ActionButton>
                {isSistemaVersaoRascunho(selectedVersion.status) && (
                  <>
                    <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onPublishVersion}>
                      <PublishOutlinedIcon /> Publicar
                    </ActionButton>
                    <ActionButton type="button" theme={theme} neon={neon} $compact $danger onClick={onDeleteVersion}>
                      <DeleteOutlineIcon /> Excluir
                    </ActionButton>
                  </>
                )}
                {getSistemaVersaoStatusLabel(selectedVersion.status) === 'Publicado' && (
                  <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onArchiveVersion}>
                    <ArchiveOutlinedIcon /> Arquivar
                  </ActionButton>
                )}
              </VersionActions>
            </VersionHeader>

            {readOnly && (
              <ReadOnlyBanner>
                Versões {isSistemaVersaoRascunho(selectedVersion.status) ? 'em rascunho' : getSistemaVersaoStatusLabel(selectedVersion.status) === 'Publicado' ? 'publicadas' : 'arquivadas'} são somente leitura.
                Duplique esta versão para continuar evoluindo as regras sem alterar mesas existentes.
              </ReadOnlyBanner>
            )}

            {getSistemaVersaoStatusLabel(selectedVersion.status) === 'Publicado' && (
              <SystemVersionOperations
                version={selectedVersion}
                systemActive={system.ativo}
                theme={theme}
                neon={neon}
                onMigrationComplete={onMigrationComplete}
              />
            )}

            <SystemItemCatalog
              idSistemaVersao={selectedVersion.idSistemaVersao}
              readOnly={readOnly}
              theme={theme}
              neon={neon}
              onDirtyChange={onCatalogDirtyChange}
            />

            <ModuleNav theme={theme} neon={neon} aria-label="Módulos da versão">
              {MODULE_KEYS.map((moduleKey) => (
                <ModuleNavButton
                  type="button"
                  key={moduleKey}
                  theme={theme}
                  neon={neon}
                  $selected={activeModule === moduleKey}
                  $hasError={activeModule === moduleKey && Object.keys(validationErrors).length > 0}
                  onClick={() => onSelectModule(moduleKey)}
                >
                  {SISTEMA_MODULO_LABELS[moduleKey]}
                </ModuleNavButton>
              ))}
            </ModuleNav>

            <ModuleEditor
              moduleKey={activeModule}
              systemCode={system.codigo}
              config={moduleConfig}
              loading={moduleLoading}
              error={moduleError}
              errors={validationErrors}
              readOnly={readOnly}
              theme={theme}
              neon={neon}
              raceOptions={raceOptions}
              onChange={onChangeModule}
              onRetry={onRetryModule}
              onCreateEmpty={onCreateEmptyModule}
            />

            {!readOnly && moduleConfig && (
              <SaveBar theme={theme} neon={neon}>
                <DirtyIndicator $dirty={dirty}>
                  {dirty
                    ? 'Alterações não salvas'
                    : lastSavedAt ? `Salvo às ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Módulo sincronizado'}
                </DirtyIndicator>
                {dirty && (
                  <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onDiscard} disabled={saving}>
                    <UndoIcon /> Descartar
                  </ActionButton>
                )}
                <ActionButton type="button" theme={theme} neon={neon} $compact onClick={onSave} disabled={!dirty || saving}>
                  <SaveOutlinedIcon /> {saving ? 'Salvando...' : 'Salvar módulo'}
                </ActionButton>
              </SaveBar>
            )}

          </>
        )}
      </EditorPanel>
    </WorkspaceLayout>
  </>
);
