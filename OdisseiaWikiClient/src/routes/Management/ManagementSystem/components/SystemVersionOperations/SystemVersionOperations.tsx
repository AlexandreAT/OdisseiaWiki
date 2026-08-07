import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import UpgradeOutlinedIcon from '@mui/icons-material/UpgradeOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { Modal } from '../../../../../components/Generic/Modal/Modal';
import { LoadingIndicator } from '../../../../../components/Generic/LoadingIndicator';
import {
  MesaMigracaoPreview,
  SistemaPatchImpacto,
  SistemaPatchNote,
  SistemaVersaoResumo,
} from '../../../../../models/SistemaRpg';
import {
  migrarMesaParaVersaoSistemaRpg,
  obterPatchNoteSistemaRpg,
  obterPreviaMigracaoMesaSistemaRpg,
} from '../../../../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../../../../utils/apiError';
import {
  ActionButton,
  DialogFooter,
  MigrationConfirmation,
  MigrationFlow,
  MigrationNotice,
  MigrationSummaryGrid,
  PatchAlteration,
  PatchGroup,
  PatchGroups,
  PatchImpact,
  PatchPanel,
  PatchPanelHeader,
  PatchState,
  PreservedValues,
} from '../../ManagementSystem.style';

interface SystemVersionOperationsProps {
  version: SistemaVersaoResumo;
  systemActive: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onMigrationComplete: () => void;
}

const impactLabel: Record<SistemaPatchImpacto, string> = {
  Baixo: 'Baixo',
  Medio: 'Médio',
  Alto: 'Alto',
  Critico: 'Crítico',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatPatchValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const PatchNoteDetails = ({ note }: { note: SistemaPatchNote }) => (
  <PatchGroups>
    {note.grupos.length === 0 ? (
      <PatchState>Nenhuma alteração estrutural foi identificada nesta versão.</PatchState>
    ) : note.grupos.map((group) => (
      <PatchGroup key={`${group.modulo}-${group.titulo}`}>
        <summary>
          <span>{group.titulo}</span>
          <small>{group.alteracoes.length} {group.alteracoes.length === 1 ? 'alteração' : 'alterações'}</small>
          <PatchImpact $impact={group.impacto}>{impactLabel[group.impacto]}</PatchImpact>
        </summary>
        <div className="patch-alterations">
          {group.alteracoes.map((alteration, index) => (
            <PatchAlteration key={`${alteration.campo}-${alteration.identidade ?? ''}-${index}`}>
              <div>
                <strong>{alteration.descricao}</strong>
                <span>{alteration.entidade}{alteration.identidade ? ` · ${alteration.identidade}` : ''}</span>
              </div>
              <dl>
                <div>
                  <dt>Anterior</dt>
                  <dd title={formatPatchValue(alteration.valorAnterior)}>{formatPatchValue(alteration.valorAnterior)}</dd>
                </div>
                <div>
                  <dt>Novo</dt>
                  <dd title={formatPatchValue(alteration.valorNovo)}>{formatPatchValue(alteration.valorNovo)}</dd>
                </div>
              </dl>
            </PatchAlteration>
          ))}
        </div>
      </PatchGroup>
    ))}
  </PatchGroups>
);

export const SystemVersionOperations = ({
  version,
  systemActive,
  theme,
  neon,
  onMigrationComplete,
}: SystemVersionOperationsProps) => {
  const [patchNote, setPatchNote] = useState<SistemaPatchNote | null>(null);
  const [patchLoading, setPatchLoading] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [mesaId, setMesaId] = useState('');
  const [mesaError, setMesaError] = useState<string | null>(null);
  const [preview, setPreview] = useState<MesaMigracaoPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const loadPatchNote = useCallback(async (signal?: AbortSignal) => {
    setPatchLoading(true);
    setPatchError(null);
    try {
      setPatchNote(await obterPatchNoteSistemaRpg(version.idSistemaVersao, { signal }));
    } catch (error) {
      if (signal?.aborted) return;
      setPatchNote(null);
      setPatchError(getApiErrorMessage(error, 'Não foi possível carregar o patch note desta versão.'));
    } finally {
      if (!signal?.aborted) setPatchLoading(false);
    }
  }, [version.idSistemaVersao]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPatchNote(controller.signal);
    return () => controller.abort();
  }, [loadPatchNote]);

  const resetMigration = useCallback(() => {
    setMigrationOpen(false);
    setMesaId('');
    setMesaError(null);
    setPreview(null);
    setPreviewError(null);
    setConfirmed(false);
    setPreviewLoading(false);
    setMigrating(false);
  }, []);

  const requestPreview = async () => {
    const parsedMesaId = Number(mesaId);
    if (!Number.isInteger(parsedMesaId) || parsedMesaId <= 0) {
      setMesaError('Informe o identificador numérico válido da mesa.');
      return;
    }

    setMesaError(null);
    setPreviewError(null);
    setPreview(null);
    setConfirmed(false);
    setPreviewLoading(true);
    try {
      setPreview(await obterPreviaMigracaoMesaSistemaRpg(
        parsedMesaId,
        version.idSistemaVersao,
      ));
    } catch (error) {
      setPreviewError(getApiErrorMessage(error, 'Não foi possível gerar a prévia da migração.'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmMigration = async () => {
    if (!preview || !confirmed || preview.resumoMesa.quantidadeBloqueios > 0) return;
    setMigrating(true);
    setPreviewError(null);
    try {
      await migrarMesaParaVersaoSistemaRpg(preview.idMesa, preview.idSistemaVersaoDestino);
      toast.success(`Mesa “${preview.nomeMesa}” migrada para a versão ${preview.numeroVersaoDestino}.`);
      resetMigration();
      onMigrationComplete();
    } catch (error) {
      setPreviewError(getApiErrorMessage(error, 'Não foi possível concluir a migração da mesa.'));
      setMigrating(false);
    }
  };

  const hasBlockers = Boolean(preview?.resumoMesa.quantidadeBloqueios);

  return (
    <>
      <PatchPanel theme={theme} neon={neon} aria-live="polite">
        <PatchPanelHeader>
          <div>
            <DifferenceOutlinedIcon />
            <div>
              <h4>Patch note estruturado</h4>
              <p>Comparação imutável gerada no momento da publicação.</p>
            </div>
          </div>
          <div className="patch-actions">
            <ActionButton
              type="button"
              theme={theme}
              neon={neon}
              $compact
              onClick={() => void loadPatchNote()}
              disabled={patchLoading}
            >
              <RefreshIcon /> Atualizar
            </ActionButton>
            <ActionButton
              type="button"
              theme={theme}
              neon={neon}
              $compact
              onClick={() => setMigrationOpen(true)}
              disabled={!systemActive}
              title={systemActive ? undefined : 'Ative o sistema antes de migrar uma mesa.'}
            >
              <UpgradeOutlinedIcon /> Migrar mesa
            </ActionButton>
          </div>
        </PatchPanelHeader>

        {patchLoading && <PatchState role="status"><LoadingIndicator compact label="Carregando patch note" /></PatchState>}
        {!patchLoading && patchError && (
          <PatchState $error role="alert">{patchError}</PatchState>
        )}
        {!patchLoading && !patchError && patchNote && (
          <>
            <MigrationNotice>
              <strong>{patchNote.titulo}</strong>
              <span>{patchNote.resumo}</span>
              <small>
                {patchNote.numeroVersaoAnterior ?? 'Versão inicial'} → {patchNote.numeroVersaoNova}
                {' · '}Gerado em {formatDate(patchNote.dataGeracao)}
              </small>
            </MigrationNotice>
            <PatchNoteDetails note={patchNote} />
          </>
        )}
      </PatchPanel>

      {migrationOpen && (
        <Modal
          title={`Migrar mesa para a versão ${version.numeroVersao}`}
          theme={theme}
          neon={neon}
          onClose={previewLoading || migrating ? undefined : resetMigration}
          width="880px"
          mobileInset
          footer={(
            <DialogFooter>
              <CyberButton
                theme={theme}
                neon={neon}
                colorType="secondary"
                text="Cancelar"
                width="120px"
                onClick={resetMigration}
                disabled={previewLoading || migrating}
              />
              {!preview ? (
                <CyberButton
                  theme={theme}
                  neon={neon}
                  colorType="primary"
                  text="Gerar prévia"
                  width="145px"
                  onClick={requestPreview}
                  loading={previewLoading}
                />
              ) : (
                <CyberButton
                  theme={theme}
                  neon={neon}
                  colorType="primary"
                  text="Confirmar migração"
                  width="180px"
                  onClick={confirmMigration}
                  loading={migrating}
                  disabled={!confirmed || hasBlockers}
                />
              )}
            </DialogFooter>
          )}
        >
          <MigrationFlow>
            <MigrationNotice>
              <strong>Operação não destrutiva</strong>
              <span>
                A confirmação altera somente a versão vinculada à mesa. Fichas, inventários e
                valores já salvos não serão reescritos.
              </span>
            </MigrationNotice>

            <div className="migration-input-row">
              <InputText
                theme={theme}
                neon={neon}
                type="number"
                label="ID da mesa"
                value={mesaId}
                onChange={(event) => {
                  setMesaId(event.target.value);
                  setMesaError(null);
                  setPreview(null);
                  setPreviewError(null);
                  setConfirmed(false);
                }}
                error={Boolean(mesaError)}
                errorMessage={mesaError ?? undefined}
                disabled={previewLoading || migrating}
                required
              />
              {preview && (
                <ActionButton
                  type="button"
                  theme={theme}
                  neon={neon}
                  $compact
                  onClick={() => void requestPreview()}
                  disabled={previewLoading || migrating}
                >
                  <RefreshIcon /> Recalcular prévia
                </ActionButton>
              )}
            </div>

            {previewLoading && <PatchState role="status">Analisando a mesa...</PatchState>}
            {previewError && <PatchState $error role="alert">{previewError}</PatchState>}

            {preview && (
              <>
                <MigrationSummaryGrid>
                  <div><span>Mesa</span><strong>{preview.nomeMesa}</strong></div>
                  <div><span>Migração</span><strong>{preview.numeroVersaoOrigem} → {preview.numeroVersaoDestino}</strong></div>
                  <div><span>Personagens</span><strong>{preview.resumoMesa.quantidadePersonagens}</strong></div>
                  <div><span>Itens</span><strong>{preview.resumoMesa.quantidadeItensInventario}</strong></div>
                  <div><span>Overrides</span><strong>{preview.resumoMesa.quantidadeOverrides}</strong></div>
                  <div><span>Avisos</span><strong>{preview.resumoMesa.quantidadeAvisos}</strong></div>
                </MigrationSummaryGrid>

                {preview.avisos.length > 0 && (
                  <div>
                    {preview.avisos.map((warning) => (
                      <MigrationNotice key={`${warning.codigo}-${warning.entidade ?? ''}-${warning.identidade ?? ''}`} $warning={warning.nivel !== 'Informacao'} $blocked={warning.nivel === 'Bloqueio'}>
                        <strong><WarningAmberOutlinedIcon /> {warning.categoria}</strong>
                        <span>{warning.mensagem}</span>
                        {warning.quantidade > 1 && <small>{warning.quantidade} ocorrências</small>}
                      </MigrationNotice>
                    ))}
                  </div>
                )}

                <PreservedValues>
                  <strong>Valores preservados</strong>
                  <ul>
                    {preview.valoresPreservados.map((value) => <li key={value}>{value}</li>)}
                  </ul>
                </PreservedValues>

                <div>
                  <MigrationNotice>
                    <strong>{preview.comparacao.titulo}</strong>
                    <span>{preview.comparacao.resumo}</span>
                  </MigrationNotice>
                  <PatchNoteDetails note={preview.comparacao} />
                </div>

                <MigrationConfirmation $blocked={hasBlockers}>
                  {hasBlockers ? (
                    <p>A prévia encontrou bloqueios. Resolva-os antes de migrar esta mesa.</p>
                  ) : (
                    <CheckBox
                      neon={neon}
                      label="Confirmo que os valores atuais serão preservados e somente a versão da mesa será alterada."
                      checked={confirmed}
                      onChange={setConfirmed}
                      disabled={migrating}
                    />
                  )}
                </MigrationConfirmation>
              </>
            )}
          </MigrationFlow>
        </Modal>
      )}
    </>
  );
};
