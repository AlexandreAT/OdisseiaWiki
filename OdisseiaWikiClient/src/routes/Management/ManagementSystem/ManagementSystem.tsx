import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CriarSistemaRpgPayload,
  CriarSistemaVersaoPayload,
  DuplicarSistemaVersaoPayload,
  SistemaModuloKey,
  SistemaRpgResumo,
  SistemaVersaoResumo,
} from '../../../models/SistemaRpg';
import { SystemCatalog } from './components/SystemCatalog/SystemCatalog';
import {
  ConfirmActionDialog,
  SystemFormDialog,
  VersionFormDialog,
} from './components/SystemDialogs/SystemDialogs';
import { SystemWorkspace } from './components/SystemWorkspace/SystemWorkspace';
import { SystemManagementContainer } from './ManagementSystem.style';
import { useManagementSystem } from './useManagementSystem';

interface ManagementSystemProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onDirtyChange?: (dirty: boolean) => void;
}

interface ConfirmState {
  title: string;
  message: string;
  detail?: string;
  confirmText: string;
  danger?: boolean;
  action: () => Promise<boolean | void> | boolean | void;
}

export const ManagementSystem = ({ theme, neon, onDirtyChange }: ManagementSystemProps) => {
  const management = useManagementSystem();
  const [systemDialog, setSystemDialog] = useState<{ system?: SistemaRpgResumo | null } | null>(null);
  const [versionDialog, setVersionDialog] = useState<{
    mode: 'create' | 'duplicate';
    sourceVersion?: SistemaVersaoResumo | null;
  } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [catalogDirty, setCatalogDirty] = useState(false);
  const hasUnsavedChanges = management.dirty || catalogDirty;

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
    return () => onDirtyChange?.(false);
  }, [hasUnsavedChanges, onDirtyChange]);

  const runWithDirtyGuard = (action: () => void, includeCatalog = true) => {
    const shouldGuard = management.dirty || (includeCatalog && catalogDirty);
    if (!shouldGuard) {
      action();
      return;
    }
    setConfirm({
      title: 'Descartar alterações não salvas?',
      message: 'A versão atual possui alterações que ainda não foram salvas.',
      detail: 'Ao continuar, as alterações locais do módulo ou do catálogo serão descartadas.',
      confirmText: 'Descartar e continuar',
      danger: true,
      action,
    });
  };

  const requestSystemToggle = (system: SistemaRpgResumo) => {
    setConfirm({
      title: system.ativo ? 'Desativar sistema?' : 'Ativar sistema?',
      message: system.ativo
        ? `O sistema “${system.nome}” deixará de ser oferecido para novos usos.`
        : `O sistema “${system.nome}” voltará a ficar disponível.`,
      detail: system.ativo
        ? 'Versões e mesas já vinculadas não serão removidas.'
        : undefined,
      confirmText: system.ativo ? 'Desativar' : 'Ativar',
      action: () => management.toggleSystemActive(system),
    });
  };

  const requestSystemDelete = (system: SistemaRpgResumo) => {
    setConfirm({
      title: 'Excluir sistema?',
      message: `Você está tentando excluir “${system.nome}”.`,
      detail: 'A API bloqueará a exclusão quando houver versões publicadas, histórico ou mesas vinculadas. Prefira desativar o sistema quando ele já tiver sido utilizado.',
      confirmText: 'Excluir sistema',
      danger: true,
      action: () => management.deleteSystem(system.idSistemaRpg),
    });
  };

  const requestPublish = () => {
    const version = management.selectedVersion;
    if (!version) return;
    if (catalogDirty) {
      toast.error('Salve ou descarte as alterações do catálogo de itens antes de publicar.');
      return;
    }

    const openPublishConfirmation = () => setConfirm({
      title: `Publicar versão ${version.numeroVersao}?`,
      message: 'Depois de publicada, esta versão ficará protegida contra alterações diretas.',
      detail: 'Mesas existentes continuarão na versão atual até uma migração explícita. A publicação não altera fichas ou mesas automaticamente.',
      confirmText: 'Publicar versão',
      action: () => management.publishVersion(version.idSistemaVersao),
    });

    if (!management.dirty) {
      openPublishConfirmation();
      return;
    }

    setConfirm({
      title: 'Salvar antes de publicar?',
      message: 'Existem alterações não salvas no módulo atual.',
      detail: 'O módulo precisa ser salvo e validado antes da confirmação final de publicação.',
      confirmText: 'Salvar e continuar',
      action: async () => {
        const saved = await management.saveModule();
        if (saved) window.setTimeout(openPublishConfirmation, 0);
        return saved;
      },
    });
  };

  const requestArchive = () => {
    const version = management.selectedVersion;
    if (!version) return;
    setConfirm({
      title: `Arquivar versão ${version.numeroVersao}?`,
      message: 'Ela deixará de ser oferecida para novas mesas, mas continuará disponível para leitura histórica.',
      detail: 'Mesas atualmente vinculadas a esta versão continuarão funcionando e não serão migradas.',
      confirmText: 'Arquivar versão',
      action: () => management.archiveVersion(version.idSistemaVersao),
    });
  };

  const requestDeleteVersion = () => {
    const version = management.selectedVersion;
    if (!version) return;
    setConfirm({
      title: `Excluir rascunho ${version.numeroVersao}?`,
      message: 'Esta ação remove permanentemente o rascunho e suas configurações.',
      detail: 'Versões publicadas, usadas por mesas ou utilizadas como base podem ter a exclusão bloqueada pelo servidor.',
      confirmText: 'Excluir rascunho',
      danger: true,
      action: () => management.deleteVersion(version.idSistemaVersao),
    });
  };

  const submitSystem = async (payload: CriarSistemaRpgPayload): Promise<boolean> => {
    const editingSystem = systemDialog?.system;
    if (!editingSystem) return management.createSystem(payload);
    return management.updateSystem(editingSystem.idSistemaRpg, {
      nome: payload.nome,
      descricao: payload.descricao,
      ativo: payload.ativo,
    });
  };

  const submitVersion = async (payload: CriarSistemaVersaoPayload): Promise<boolean> => {
    if (versionDialog?.mode === 'duplicate' && versionDialog.sourceVersion) {
      const duplicatePayload: DuplicarSistemaVersaoPayload = {
        numeroVersao: payload.numeroVersao,
        changelog: payload.changelog,
      };
      return management.duplicateVersion(
        versionDialog.sourceVersion.idSistemaVersao,
        duplicatePayload,
      );
    }
    return management.createVersion(payload);
  };

  return (
    <SystemManagementContainer>
      {!management.selectedSystem ? (
        <SystemCatalog
          systems={management.systems}
          loading={management.systemsLoading}
          error={management.systemsError}
          theme={theme}
          neon={neon}
          onRetry={management.retrySystems}
          onOpen={(system) => runWithDirtyGuard(() => management.selectSystem(system.idSistemaRpg))}
          onCreate={() => setSystemDialog({ system: null })}
          onEdit={(system) => setSystemDialog({ system })}
          onToggleActive={requestSystemToggle}
          onDelete={requestSystemDelete}
        />
      ) : (
        <SystemWorkspace
          system={management.selectedSystem}
          versions={management.versions}
          versionsLoading={management.versionsLoading}
          versionsError={management.versionsError}
          selectedVersion={management.selectedVersion}
          activeModule={management.activeModule}
          moduleConfig={management.moduleConfig}
          moduleLoading={management.moduleLoading}
          moduleError={management.moduleError}
          validationErrors={management.validationErrors}
          dirty={management.dirty}
          saving={management.saving}
          lastSavedAt={management.lastSavedAt}
          readOnly={management.isReadOnly}
          raceOptions={management.raceOptions}
          theme={theme}
          neon={neon}
          onBack={() => runWithDirtyGuard(() => management.selectSystem(null))}
          onEditSystem={() => setSystemDialog({ system: management.selectedSystem })}
          onToggleSystem={() => requestSystemToggle(management.selectedSystem as SistemaRpgResumo)}
          onDeleteSystem={() => requestSystemDelete(management.selectedSystem as SistemaRpgResumo)}
          onRetryVersions={management.retryVersions}
          onCreateVersion={() => setVersionDialog({
            mode: 'create',
            sourceVersion: management.selectedVersion,
          })}
          onSelectVersion={(id) => runWithDirtyGuard(() => management.selectVersion(id))}
          onDuplicateVersion={() => setVersionDialog({
            mode: 'duplicate',
            sourceVersion: management.selectedVersion,
          })}
          onPublishVersion={requestPublish}
          onArchiveVersion={requestArchive}
          onDeleteVersion={requestDeleteVersion}
          onMigrationComplete={() => {
            management.retryVersions();
            management.retrySystems();
          }}
          onSelectModule={(moduleKey: SistemaModuloKey) => {
            if (moduleKey === management.activeModule) return;
            runWithDirtyGuard(() => management.selectModule(moduleKey), false);
          }}
          onChangeModule={management.setModuleConfig}
          onRetryModule={management.retryModule}
          onCreateEmptyModule={management.createEmptyModule}
          onSave={() => void management.saveModule()}
          onDiscard={() => {
            setConfirm({
              title: 'Descartar alterações?',
              message: 'O módulo será restaurado para a última versão salva no servidor.',
              confirmText: 'Descartar',
              danger: true,
              action: management.discardModuleChanges,
            });
          }}
          onCatalogDirtyChange={setCatalogDirty}
        />
      )}

      <SystemFormDialog
        open={Boolean(systemDialog)}
        system={systemDialog?.system}
        theme={theme}
        neon={neon}
        onClose={() => setSystemDialog(null)}
        onSubmit={submitSystem}
      />

      <VersionFormDialog
        open={Boolean(versionDialog)}
        mode={versionDialog?.mode ?? 'create'}
        sourceVersion={versionDialog?.sourceVersion}
        versions={management.versions}
        theme={theme}
        neon={neon}
        onClose={() => setVersionDialog(null)}
        onSubmit={submitVersion}
      />

      <ConfirmActionDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        detail={confirm?.detail}
        confirmText={confirm?.confirmText ?? 'Confirmar'}
        danger={confirm?.danger}
        theme={theme}
        neon={neon}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const result = await confirm.action();
          if (result !== false) setConfirm(null);
        }}
      />
    </SystemManagementContainer>
  );
};
