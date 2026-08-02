import { FormEvent, useEffect, useState } from 'react';
import { CheckBox } from '../../../../../components/Generic/CheckBox/CheckBox';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../../../components/Generic/InputText/InputText';
import { Modal } from '../../../../../components/Generic/Modal/Modal';
import { Select } from '../../../../../components/Generic/Select/Select';
import { TextArea } from '../../../../../components/Generic/TextArea/TextArea';
import {
  CriarSistemaRpgPayload,
  CriarSistemaVersaoPayload,
  SistemaRpgResumo,
  SistemaVersaoResumo,
} from '../../../../../models/SistemaRpg';
import {
  ConfirmText,
  DangerNote,
  DialogFooter,
  DialogForm,
} from '../../ManagementSystem.style';
import { validateSistemaRpg, validateSistemaVersao } from '../../systemValidation';

interface ThemeDialogProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface SystemFormDialogProps extends ThemeDialogProps {
  open: boolean;
  system?: SistemaRpgResumo | null;
  onClose: () => void;
  onSubmit: (payload: CriarSistemaRpgPayload) => Promise<boolean>;
}

export const SystemFormDialog = ({
  open,
  system,
  theme,
  neon,
  onClose,
  onSubmit,
}: SystemFormDialogProps) => {
  const [payload, setPayload] = useState<CriarSistemaRpgPayload>({
    codigo: '',
    nome: '',
    descricao: '',
    ativo: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPayload({
      codigo: system?.codigo ?? '',
      nome: system?.nome ?? '',
      descricao: system?.descricao ?? '',
      ativo: system?.ativo ?? true,
    });
    setErrors({});
  }, [open, system]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateSistemaRpg(payload, Boolean(system));
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    const success = await onSubmit({
      ...payload,
      codigo: payload.codigo.trim().toUpperCase(),
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || undefined,
    });
    setSubmitting(false);
    if (success) onClose();
  };

  return (
    <Modal
      title={system ? 'Editar sistema' : 'Criar sistema de RPG'}
      theme={theme}
      neon={neon}
      onClose={submitting ? undefined : onClose}
      width="620px"
      mobileInset
      footer={(
        <DialogFooter>
          <CyberButton theme={theme} neon={neon} colorType="secondary" text="Cancelar" width="120px" onClick={onClose} disabled={submitting} />
          <CyberButton theme={theme} neon={neon} colorType="primary" text={system ? 'Salvar' : 'Criar sistema'} width="150px" onClick={() => document.getElementById('system-rpg-form-submit')?.click()} loading={submitting} />
        </DialogFooter>
      )}
    >
      <DialogForm onSubmit={handleSubmit}>
        <InputText
          theme={theme}
          neon={neon}
          label="Código estável"
          value={payload.codigo}
          onChange={(event) => setPayload((current) => ({ ...current, codigo: event.target.value.toUpperCase() }))}
          error={Boolean(errors.codigo)}
          errorMessage={errors.codigo}
          disabled={Boolean(system)}
          required
        />
        {system && <DangerNote>O código identifica o sistema internamente e não é alterado durante a edição.</DangerNote>}
        <InputText
          theme={theme}
          neon={neon}
          label="Nome"
          value={payload.nome}
          onChange={(event) => setPayload((current) => ({ ...current, nome: event.target.value }))}
          error={Boolean(errors.nome)}
          errorMessage={errors.nome}
          required
        />
        <TextArea
          theme={theme}
          neon={neon}
          label="Descrição"
          value={payload.descricao ?? ''}
          onChange={(event) => setPayload((current) => ({ ...current, descricao: event.target.value }))}
          error={Boolean(errors.descricao)}
          errorMessage={errors.descricao}
          fullWidth
        />
        <CheckBox
          neon={neon}
          label="Sistema ativo"
          checked={payload.ativo}
          onChange={(ativo) => setPayload((current) => ({ ...current, ativo }))}
        />
        <button id="system-rpg-form-submit" type="submit" hidden aria-hidden="true" />
      </DialogForm>
    </Modal>
  );
};

interface VersionFormDialogProps extends ThemeDialogProps {
  open: boolean;
  mode: 'create' | 'duplicate';
  sourceVersion?: SistemaVersaoResumo | null;
  versions: SistemaVersaoResumo[];
  onClose: () => void;
  onSubmit: (payload: CriarSistemaVersaoPayload) => Promise<boolean>;
}

export const VersionFormDialog = ({
  open,
  mode,
  sourceVersion,
  versions,
  theme,
  neon,
  onClose,
  onSubmit,
}: VersionFormDialogProps) => {
  const [payload, setPayload] = useState<CriarSistemaVersaoPayload>({
    numeroVersao: '',
    idVersaoBase: null,
    changelog: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPayload({
      numeroVersao: '',
      idVersaoBase: sourceVersion?.idSistemaVersao ?? null,
      changelog: mode === 'duplicate' && sourceVersion
        ? `Baseada na versão ${sourceVersion.numeroVersao}.`
        : '',
    });
    setErrors({});
  }, [mode, open, sourceVersion]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateSistemaVersao(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    const success = await onSubmit({
      numeroVersao: payload.numeroVersao.trim(),
      idVersaoBase: payload.idVersaoBase || null,
      changelog: payload.changelog?.trim() || undefined,
    });
    setSubmitting(false);
    if (success) onClose();
  };

  return (
    <Modal
      title={mode === 'duplicate' ? 'Duplicar versão' : 'Criar versão'}
      theme={theme}
      neon={neon}
      onClose={submitting ? undefined : onClose}
      width="650px"
      mobileInset
      footer={(
        <DialogFooter>
          <CyberButton theme={theme} neon={neon} colorType="secondary" text="Cancelar" width="120px" onClick={onClose} disabled={submitting} />
          <CyberButton theme={theme} neon={neon} colorType="primary" text="Criar rascunho" width="160px" onClick={() => document.getElementById('system-version-form-submit')?.click()} loading={submitting} />
        </DialogFooter>
      )}
    >
      <DialogForm onSubmit={handleSubmit}>
        <InputText
          theme={theme}
          neon={neon}
          label="Número da nova versão"
          value={payload.numeroVersao}
          onChange={(event) => setPayload((current) => ({ ...current, numeroVersao: event.target.value }))}
          error={Boolean(errors.numeroVersao)}
          errorMessage={errors.numeroVersao}
          required
        />
        {mode === 'create' && (
          <Select
            theme={theme}
            neon={neon}
            label="Versão base (opcional)"
            value={payload.idVersaoBase ?? ''}
            onChange={(event) => setPayload((current) => ({
              ...current,
              idVersaoBase: event.target.value ? Number(event.target.value) : null,
            }))}
            options={versions.map((version) => ({
              label: `${version.numeroVersao} — ${version.status}`,
              value: version.idSistemaVersao,
            }))}
            portal
          />
        )}
        {mode === 'duplicate' && sourceVersion && (
          <DangerNote>
            Todo o conteúdo da versão {sourceVersion.numeroVersao} será copiado para um novo rascunho independente.
          </DangerNote>
        )}
        <TextArea
          theme={theme}
          neon={neon}
          label="Changelog"
          value={payload.changelog ?? ''}
          onChange={(event) => setPayload((current) => ({ ...current, changelog: event.target.value }))}
          error={Boolean(errors.changelog)}
          errorMessage={errors.changelog}
          fullWidth
        />
        <button id="system-version-form-submit" type="submit" hidden aria-hidden="true" />
      </DialogForm>
    </Modal>
  );
};

interface ConfirmActionDialogProps extends ThemeDialogProps {
  open: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmText: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const ConfirmActionDialog = ({
  open,
  title,
  message,
  detail,
  confirmText,
  danger = false,
  theme,
  neon,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;

  const confirm = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <Modal
      title={title}
      theme={theme}
      neon={neon}
      onClose={submitting ? undefined : onClose}
      width="560px"
      mobileInset
      footer={(
        <DialogFooter>
          <CyberButton theme={theme} neon={neon} colorType="secondary" text="Cancelar" width="120px" onClick={onClose} disabled={submitting} />
          <CyberButton
            theme={theme}
            neon={neon}
            colorType={danger ? 'secondary' : 'primary'}
            borderColor={danger ? 'var(--clearneonRed)' : undefined}
            textColor={danger ? 'var(--clearneonRed)' : undefined}
            text={confirmText}
            width="150px"
            onClick={confirm}
            loading={submitting}
          />
        </DialogFooter>
      )}
    >
      <ConfirmText>
        <p>{message}</p>
        {detail && <DangerNote>{detail}</DangerNote>}
      </ConfirmText>
    </Modal>
  );
};
