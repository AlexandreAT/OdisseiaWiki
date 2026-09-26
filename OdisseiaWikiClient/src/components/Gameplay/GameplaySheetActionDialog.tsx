import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Item } from '../../models/Itens';
import type {
  GameplayCharacterOption,
  GameplayCommandResponse,
  GameplayEffectApplyRequest,
  GameplayFavoriteRoll,
  GameplayFavoriteRollUpsert,
  GameplayRollMode,
  GameplayRollRequest,
  GameplayTestSpec,
  GameplayVisibility,
} from '../../models/Gameplay';
import { getApiErrorMessage } from '../../utils/apiError';
import { getGameplayRollSummary } from '../../utils/gameplayRollSummary';
import { CyberButton } from '../Generic/HighlightButton/HighlightButton';
import { InputText } from '../Generic/InputText/InputText';
import { Modal } from '../Generic/Modal/Modal';
import { Select } from '../Generic/Select/Select';
import { DiceRollOverlay } from './DiceRollOverlay/DiceRollOverlay';
import { FavoriteButton, SheetActionButton, SheetActionError, SheetActionFields, SheetActionForm, SheetActionResult } from './GameplaySheetActionDialog.style';

export type GameplaySheetActionSource = {
  type: 'ITEM' | 'PROTESE' | 'SKILL' | 'MAGIA';
  id: string;
  name: string;
  item?: Item;
  attributes?: Record<string, unknown>;
};

interface GameplaySheetActionDialogProps {
  open: boolean;
  source: GameplaySheetActionSource | null;
  character: GameplayCharacterOption | null;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  submitting?: boolean;
  onClose: () => void;
  onRoll: (payload: GameplayRollRequest) => Promise<GameplayCommandResponse>;
  onApplyEffect?: (payload: GameplayEffectApplyRequest) => Promise<GameplayCommandResponse>;
  onEffectApplied?: () => void | Promise<void>;
  onDiceVisualOpenChange?: (open: boolean) => void;
  onResultRevealed?: () => void;
  favorite?: GameplayFavoriteRoll | null;
  favoriteSaving?: boolean;
  onSaveFavorite?: (payload: GameplayFavoriteRollUpsert) => Promise<unknown>;
  onRemoveFavorite?: (idFavorito: string) => Promise<unknown>;
}

const modeOptions = [
  { value: 'Normal', label: 'Normal' },
  { value: 'Vantagem', label: 'Vantagem' },
  { value: 'Desvantagem', label: 'Desvantagem' },
];

const visibilityOptions = [
  { value: 'PublicaMesa', label: 'Pública na Mesa' },
  { value: 'MestreEAutor', label: 'Mestre e autor' },
  { value: 'SomenteMestre', label: 'Somente mestre' },
];

const normalizeCode = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/[- ]/g, '_');
const optionLabel = (value: string) => value.toLowerCase().replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase());

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : {}
);

const parseStatus = (value: unknown): UnknownRecord => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return asRecord(parsed);
  } catch {
    return {};
  }
};

const actionTest = (source: GameplaySheetActionSource | null): Partial<GameplayTestSpec> | null => {
  const attributes = source?.attributes ?? source?.item?.atributos ?? {};
  const record = asRecord(attributes);
  const candidate = record.teste ?? record.especificacaoTeste;
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as Partial<GameplayTestSpec>
    : null;
};

const isRangedWeapon = (item?: Item) => {
  if (item?.tipo !== 'arma') return false;
  const attributes = asRecord(item.atributos);
  const explicit = normalizeCode(attributes.modoModificadores);
  if (explicit === 'DISTANCIA') return true;
  if (explicit === 'CORPO_A_CORPO') return false;
  return new Set([
    'PISTOLA_REVOLVER', 'SMG', 'RIFLE_ASSALTO', 'SHOTGUN', 'RIFLE_ATIRADOR',
    'RIFLE_PRECISAO', 'ARMA_ENERGIZADA', 'ARMA_FOTONS', 'ARCO', 'CROSSBOW',
    'ARMA_PESADA', 'ARMA_PESADA_AREA', 'DANO_CONTINUO',
  ]).has(normalizeCode(attributes.tipoArma));
};

export const GameplaySheetActionDialog = ({
  open,
  source,
  character,
  theme,
  neon,
  submitting = false,
  onClose,
  onRoll,
  onApplyEffect,
  onEffectApplied,
  onDiceVisualOpenChange,
  onResultRevealed,
  favorite,
  favoriteSaving = false,
  onSaveFavorite,
  onRemoveFavorite,
}: GameplaySheetActionDialogProps) => {
  const spec = useMemo(() => actionTest(source), [source]);
  const weapon = source?.item?.tipo === 'arma';
  const ranged = isRangedWeapon(source?.item);
  const [attribute, setAttribute] = useState('');
  const [mode, setMode] = useState<GameplayRollMode>('Normal');
  const [visibility, setVisibility] = useState<GameplayVisibility>('PublicaMesa');
  const [operation, setOperation] = useState('ATACAR');
  const [range, setRange] = useState('CURTA');
  const [fireMode, setFireMode] = useState('TIRO');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GameplayCommandResponse | null>(null);
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceError, setDiceError] = useState<string | null>(null);
  const [applyingEffect, setApplyingEffect] = useState<string | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<string[]>([]);
  const diceRequestStartedRef = useRef(false);
  const resultNotificationSentRef = useRef(false);
  const revisionRef = useRef(0);

  const attributes = useMemo(() => {
    const status = parseStatus(character?.personagem.statusJson);
    const groups = asRecord(status.atributos);
    const entries = [
      ...Object.entries(asRecord(groups.principais)),
      ...Object.entries(asRecord(groups.secundarios)),
    ].filter(([, value]) => Number.isFinite(Number(value)));
    return entries.map(([code]) => ({ value: String(code).toUpperCase(), label: String(code) }));
  }, [character?.personagem.statusJson]);
  const requiresSelectedAttribute = weapon && !spec?.codigoAtributo;
  const operations = useMemo(() => {
    const configured = Array.isArray(spec?.operacoes)
      ? spec!.operacoes.map((value) => normalizeCode(value)).filter(Boolean)
      : ['ATACAR'];
    return configured.map((value) => ({
      value,
      label: value === 'REVIDAR' ? 'Revidar' : value === 'DEFENDER' ? 'Defender' : 'Atacar',
    }));
  }, [ranged, spec]);
  const rangeOptions = useMemo(() => (
    (Array.isArray(spec?.alcances) && spec.alcances.length > 0 ? spec.alcances : ['CURTA', 'MEDIA', 'LONGA'])
      .map((value) => normalizeCode(value))
      .filter(Boolean)
      .map((value) => ({ value, label: optionLabel(value) }))
  ), [spec?.alcances]);
  const fireModeOptions = useMemo(() => (
    (Array.isArray(spec?.modosDisparo) && spec.modosDisparo.length > 0 ? spec.modosDisparo : ['TIRO', 'RAJADA'])
      .map((value) => normalizeCode(value))
      .filter(Boolean)
      .map((value) => ({ value, label: optionLabel(value) }))
  ), [spec?.modosDisparo]);

  useEffect(() => {
    if (!open) return;
    const saved = favorite?.configuracao;
    setAttribute(normalizeCode(saved?.codigoAtributo ?? spec?.codigoAtributo));
    setMode(saved?.modo ?? (spec?.modo as GameplayRollMode | undefined) ?? 'Normal');
    setVisibility(saved?.visibilidade ?? 'PublicaMesa');
    setOperation(saved?.parametrosAcao?.operacao ?? operations[0]?.value ?? 'ATACAR');
    setRange(saved?.parametrosAcao?.alcance ?? rangeOptions[0]?.value ?? 'CURTA');
    setFireMode(saved?.parametrosAcao?.modoDisparo ?? fireModeOptions[0]?.value ?? 'TIRO');
    setQuantity(saved?.parametrosAcao?.quantidade ?? 1);
    setError(null);
    setResponse(null);
    setDiceOpen(false);
    setDiceError(null);
    diceRequestStartedRef.current = false;
    resultNotificationSentRef.current = false;
    setApplyingEffect(null);
    setAppliedEffects([]);
    revisionRef.current = character?.personagem.revisaoRuntime ?? 0;
  }, [character?.personagem.revisaoRuntime, favorite, fireModeOptions, open, operations, rangeOptions, spec?.codigoAtributo, spec?.modo]);

  useEffect(() => {
    if (diceOpen || !response?.rolagem || resultNotificationSentRef.current) return;
    resultNotificationSentRef.current = true;
    onResultRevealed?.();
  }, [diceOpen, onResultRevealed, response]);

  useEffect(() => {
    onDiceVisualOpenChange?.(diceOpen);
    return () => onDiceVisualOpenChange?.(false);
  }, [diceOpen, onDiceVisualOpenChange]);

  if (!open || !source || !character) return null;

  const configuredAttribute = normalizeCode(spec?.codigoAtributo);
  const buildConfiguration = () => ({
    codigoAcao: 'ACAO_FICHA',
    codigoAtributo: configuredAttribute || attribute || undefined,
    grupos: [],
    modo: mode,
    visibilidade: visibility,
    referenciaAcao: { tipo: source.type, idInstancia: source.id },
    parametrosAcao: weapon ? {
      operacao: operation,
      alcance: ranged ? range : undefined,
      modoDisparo: ranged ? fireMode : undefined,
      quantidade: ranged ? quantity : 1,
    } : undefined,
  } satisfies GameplayFavoriteRoll['configuracao']);

  const handleFavorite = async () => {
    setError(null);
    try {
      if (favorite) {
        await onRemoveFavorite?.(favorite.idFavorito);
        return;
      }
      if (requiresSelectedAttribute && !attribute) {
        setError('Escolha o atributo antes de favoritar esta configuração.');
        return;
      }
      if (!onSaveFavorite) return;
      await onSaveFavorite({
        tipoOrigem: source.item?.tipo === 'implante' ? 'PROTESE' : source.type,
        idOrigem: source.id,
        nome: source.name,
        configuracao: buildConfiguration(),
      });
    } catch (favoriteError) {
      setError(getApiErrorMessage(favoriteError, 'Não foi possível atualizar o favorito.'));
    }
  };

  const handleRoll = () => {
    if (requiresSelectedAttribute && !attribute) {
      setError('Escolha o atributo que será aplicado ao teste.');
      return;
    }
    setError(null);
    setDiceError(null);
    setResponse(null);
    diceRequestStartedRef.current = false;
    resultNotificationSentRef.current = false;
    setDiceOpen(true);
  };

  const handleDiceThrow = async () => {
    if (diceRequestStartedRef.current) return;
    diceRequestStartedRef.current = true;
    try {
      const next = await onRoll({
        chaveIdempotencia: crypto.randomUUID(),
        idPersonagemJogador: character.personagem.idpersonagemJogador,
        ...buildConfiguration(),
      });
      setResponse(next);
      if (!next.rolagem) setDiceError('O resultado está oculto pela visibilidade escolhida.');
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível rolar esta ação.');
      setError(message);
      setDiceError(message);
    }
  };

  const handleApplyEffect = async (effectCode: string) => {
    const sourceEventId = response?.evento?.idEvento;
    if (!onApplyEffect || !sourceEventId) return;
    setApplyingEffect(effectCode);
    setError(null);
    try {
      const applied = await onApplyEffect({
        chaveIdempotencia: crypto.randomUUID(),
        idEventoOrigem: sourceEventId,
        codigoEfeito: effectCode,
        revisaoPersonagemEsperada: revisionRef.current,
      });
      if (applied.aplicacao) revisionRef.current = applied.aplicacao.revisaoPersonagem;
      setAppliedEffects((current) => [...new Set([...current, effectCode])]);
      await onEffectApplied?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível aplicar o efeito.'));
    } finally {
      setApplyingEffect(null);
    }
  };

  const requestedFaces = response?.rolagem?.grupos[0]?.faces ?? 20;
  const requestedDiceCount = response?.rolagem?.grupos.reduce((sum, group) => sum + group.valores.length, 0)
    ?? (mode === 'Normal' ? 1 : 2);
  return (
    <>
      <Modal
        title={`Ação · ${source.name}`}
        theme={theme}
        neon={neon}
        width="560px"
        mobileInset
        onClose={onClose}
        showFooter={false}
        headerActions={(onSaveFavorite || onRemoveFavorite) ? (
          <FavoriteButton
            type="button"
            $active={Boolean(favorite)}
            disabled={favoriteSaving}
            title={favorite ? 'Remover dos favoritos' : 'Favoritar esta configuração'}
            aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar esta configuração'}
            aria-pressed={Boolean(favorite)}
            onClick={() => void handleFavorite()}
          >
            {favorite ? <StarOutlinedIcon /> : <StarBorderOutlinedIcon />}
          </FavoriteButton>
        ) : undefined}
      >
        <SheetActionForm>
          <p>{weapon
            ? 'A engine resolve modificadores, acessórios e faixas pela ficha e pela versão publicada do Sistema.'
            : 'A rolagem usa somente a especificação de teste configurada para esta ação.'}</p>
          <SheetActionFields>
            {requiresSelectedAttribute && <Select label="Atributo" theme={theme} neon={neon} value={attribute} onChange={(event) => setAttribute(event.target.value)} options={attributes} width="100%" />}
            <Select label="Modo" theme={theme} neon={neon} value={mode} onChange={(event) => setMode(event.target.value as GameplayRollMode)} options={modeOptions} width="100%" disabled={Boolean(spec?.modo)} />
            <Select label="Visibilidade" theme={theme} neon={neon} value={visibility} onChange={(event) => setVisibility(event.target.value as GameplayVisibility)} options={visibilityOptions} width="100%" />
            {weapon && <Select label="Operação" theme={theme} neon={neon} value={operation} onChange={(event) => setOperation(event.target.value)} options={operations} width="100%" />}
            {ranged && <Select label="Alcance" theme={theme} neon={neon} value={range} onChange={(event) => setRange(event.target.value)} options={rangeOptions} width="100%" />}
            {ranged && <Select label="Disparo" theme={theme} neon={neon} value={fireMode} onChange={(event) => setFireMode(event.target.value)} options={fireModeOptions} width="100%" />}
            {ranged && <InputText label="Tiros" type="number" theme={theme} neon={neon} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} width="100%" />}
          </SheetActionFields>
          {error && <SheetActionError role="alert">{error}</SheetActionError>}
          {response?.rolagem && !diceOpen && (
            <SheetActionResult aria-live="polite">
              <header>
                <strong>{getGameplayRollSummary(response.rolagem)}</strong>
              </header>
              <small>{response.rolagem.expressao} · natural {response.rolagem.valorNatural ?? '—'}</small>
              {Boolean(response.rolagem.modificadores?.length) && (
                <ul aria-label="Modificadores aplicados">
                  {response.rolagem.modificadores!.map((modifier, index) => (
                    <li key={`${modifier.codigo ?? modifier.nome ?? 'mod'}-${index}`}>
                      <span>{modifier.nome || modifier.codigo || 'Modificador'}</span>
                      <span>{modifier.valor >= 0 ? '+' : ''}{modifier.valor}</span>
                    </li>
                  ))}
                </ul>
              )}
              {response.rolagem.rolagensIndividuais?.map((individual, index) => (
                <small key={`roll-${index + 1}`}>Ação {index + 1}: {getGameplayRollSummary(individual)}</small>
              ))}
              {response.rolagem.avisos?.map((notice) => <small key={notice.codigo}>{notice.mensagem}</small>)}
              {response.rolagem.efeitosPropostos?.map((effect) => (
                !effect.podeAplicar ? (
                  <small key={effect.codigo}>{effect.nome} · {effect.motivoIndisponivel || 'efeito indisponível'}</small>
                ) : effect.exigeAlvo ? (
                  <small key={effect.codigo}>{effect.nome} · escolha do alvo fica com o mestre.</small>
                ) : (
                  <CyberButton
                    key={effect.codigo}
                    theme={theme}
                    neon={neon}
                    colorType="primary"
                    width="fit-content"
                    text={appliedEffects.includes(effect.codigo) ? 'Aplicado' : effect.nome}
                    loading={applyingEffect === effect.codigo}
                    disabled={!onApplyEffect || Boolean(response.simulacao) || appliedEffects.includes(effect.codigo) || Boolean(applyingEffect)}
                    onClick={() => void handleApplyEffect(effect.codigo)}
                  />
                )
              ))}
            </SheetActionResult>
          )}
          <SheetActionButton>
            <CyberButton theme={theme} neon={neon} colorType="primary" width="210px" text={submitting ? 'Rolando…' : 'Rolar teste'} loading={submitting} onClick={() => void handleRoll()}>
              <CasinoOutlinedIcon /> Rolar teste
            </CyberButton>
          </SheetActionButton>
        </SheetActionForm>
      </Modal>
      <DiceRollOverlay
        open={diceOpen}
        result={response?.rolagem ?? null}
        error={diceError}
        title={source.name}
        hasDice
        requestedFaces={requestedFaces}
        requestedDiceCount={Math.min(2, requestedDiceCount)}
        neon={neon === 'on'}
        onClose={() => setDiceOpen(false)}
        onThrow={() => void handleDiceThrow()}
        onResultRevealed={() => {
          if (resultNotificationSentRef.current) return;
          resultNotificationSentRef.current = true;
          onResultRevealed?.();
        }}
      />
    </>
  );
};
