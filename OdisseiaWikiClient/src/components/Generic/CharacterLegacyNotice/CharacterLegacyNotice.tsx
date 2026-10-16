import { useId, useState } from 'react';
import { BiInfoCircle } from 'react-icons/bi';
import type { SistemaRuntimeContexto } from '../../../models/SistemaRpg';
import {
  RuntimeIndicator,
  RuntimeMessageList,
  RuntimeMessagePanel,
  RuntimeWarning,
} from '../SystemRuntimeIndicator/SystemRuntimeIndicator.style';
import {
  getRuntimeFallbackMessage,
  getRuntimeWarningMessage,
} from '../SystemRuntimeIndicator/SystemRuntimeIndicator.utils';

const LEGACY_WARNING_CODES = new Set([
  'MesaNaoEncontrada',
  'EntidadeNaoEncontrada',
  'VinculoInconsistente',
  'SistemaNaoEncontrado',
  'PublicacaoAtualIndisponivel',
  'VersaoRascunhoIgnorada',
  'ConfiguracaoRacialAusente',
  'OverrideMesaInvalido',
  'CatalogoItemAusente',
  'EscopoItemNaoEncontrado',
  'FallbackLegadoUtilizado',
]);

const getCharacterLegacyReasons = (
  contexto: SistemaRuntimeContexto | null | undefined,
  catalogReasons: string[],
) => Array.from(new Set([
  ...catalogReasons,
  ...(contexto?.warnings ?? [])
    .filter((warning) => LEGACY_WARNING_CODES.has(warning.codigo))
    .map(getRuntimeWarningMessage),
  ...(contexto?.fallbacks ?? []).map((fallback) => {
    const label = getRuntimeFallbackMessage(fallback);
    const detail = fallback.motivo?.trim();
    return detail ? `${label} ${detail}` : label;
  }),
].map((reason) => reason.trim()).filter(Boolean)));

export const CharacterLegacyNotice = ({
  contexto,
  catalogReasons = [],
}: {
  contexto?: SistemaRuntimeContexto | null;
  catalogReasons?: string[];
}) => {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const reasons = getCharacterLegacyReasons(contexto, catalogReasons);
  if (reasons.length === 0) return null;

  return (
    <RuntimeIndicator $hasWarnings aria-label="Aviso de ficha legada" style={{ display: 'block' }}>
      <RuntimeWarning
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((current) => !current)}
        style={{ width: '100%', justifyContent: 'flex-start' }}
      >
        <BiInfoCircle aria-hidden="true" />
        Ficha legada · {reasons.length} {reasons.length === 1 ? 'motivo' : 'motivos'}
      </RuntimeWarning>
      {open && (
        <RuntimeMessagePanel id={detailsId}>
          <RuntimeMessageList>
            {reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </RuntimeMessageList>
        </RuntimeMessagePanel>
      )}
    </RuntimeIndicator>
  );
};
