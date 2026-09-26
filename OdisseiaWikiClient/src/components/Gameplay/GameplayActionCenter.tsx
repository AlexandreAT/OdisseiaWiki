import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSistemaRuntimeContexto } from '../../hooks/useSistemaRuntimeContexto';
import type {
  GameplayActionCatalog,
  GameplayCommandResponse,
  GameplayDiceGroupRequest,
  GameplayEffectProposal,
  GameplayRollMode,
  GameplayVisibility,
} from '../../models/Gameplay';
import type { PersonagemStatus } from '../../models/PersonagemJogador';
import { getApiErrorMessage } from '../../utils/apiError';
import { getGameplayEventOutcome, getGameplayRollOutcome } from '../../utils/gameplayOutcome';
import { getGameplayModifierSummary, getGameplayRollSummary } from '../../utils/gameplayRollSummary';
import {
  getRuntimeAttributeFields,
  normalizeRuntimeAttributeValues,
  normalizeRuntimeCode,
  type RuntimeNumericField,
} from '../../utils/systemRuntimeCharacter';
import { InputText } from '../Generic/InputText/InputText';
import { LoadingIndicator } from '../Generic/LoadingIndicator';
import { Select } from '../Generic/Select/Select';
import { TextArea } from '../Generic/TextArea/TextArea';
import { DiceRollOverlay } from './DiceRollOverlay';
import { GameplayOutcomeValue } from './GameplayOutcomeValue.style';
import type { GameplayActionCenterProps } from './GameplayActionCenter.types';
import {
  ActionWorkspace,
  AttributeButton,
  AttributeGrid,
  Badge,
  CardBadges,
  CloseButton,
  ComposerCard,
  ComposerGrid,
  ContextRow,
  FieldHint,
  FormulaPreview,
  FavoriteRollButton,
  GameplayBackdrop,
  GameplayBody,
  GameplayHeader,
  GameplayPanel,
  GameplayPanelShell,
  GroupTitle,
  HistoryCard,
  HistoryHeader,
  HistoryList,
  HistoryPanel,
  InlineMessage,
  LoadMoreButton,
  LoadingBlock,
  ResultCard,
  RollDialogBackdrop,
  RollDialogBody,
  RollDialogHeader,
  RollDialogHeaderActions,
  RollDialogPanel,
  RollDialogResult,
  SessionState,
  SubmitButton,
  TabButton,
  Tabs,
  WorkArea,
  XpSourceButton,
  XpSourceList,
} from './GameplayActionCenter.style';

type GameplayTab = 'attributes' | 'xp' | 'manual' | 'history';
type ResultTarget = 'generic' | 'attribute' | 'xp' | 'manual';
type AttributeGroup = 'Principal' | 'Secundario';

interface SelectedAttribute extends RuntimeNumericField {
  group: AttributeGroup;
  value: number;
}

interface XpAction {
  code: string;
  actionCode: string;
  label: string;
  description: string;
  formula: string;
  groups: GameplayDiceGroupRequest[];
  mode: GameplayRollMode;
}

const VISIBILITY_OPTIONS = [
  { value: 'PublicaMesa', label: 'Pública na Mesa' },
  { value: 'MestreEAutor', label: 'Mestre e autor' },
  { value: 'SomenteMestre', label: 'Somente mestre' },
];

const MODE_OPTIONS = [
  { value: 'Normal', label: 'Normal' },
  { value: 'Vantagem', label: 'Vantagem' },
  { value: 'Desvantagem', label: 'Desvantagem' },
];

const DICE_OPTIONS = [4, 6, 8, 10, 12, 20].map((faces) => ({
  value: faces,
  label: `D${faces}`,
}));

const MANUAL_CATEGORY_OPTIONS = [
  { value: 'ITEM', label: 'Item' },
  { value: 'ARMA_FOGO', label: 'Arma de fogo' },
  { value: 'ARMA_CORPO_A_CORPO', label: 'Arma corpo a corpo' },
  { value: 'DEFESA', label: 'Defesa' },
  { value: 'OUTRO', label: 'Outro' },
];

const XP_ACTIONS: XpAction[] = [
  { code: 'COMBATE_NORMAL', actionCode: 'XP_COMBATE', label: 'Combate normal', formula: '+1 XP', description: 'Combate real elegível, contado por grupo.', groups: [], mode: 'Normal' },
  { code: 'MINI_BOSS', actionCode: 'XP_MINIBOSS', label: 'Mini boss', formula: '2D4 com vantagem', description: 'Ímpar concede 1 XP; par concede 2 XP.', groups: [{ quantidade: 1, faces: 4 }], mode: 'Vantagem' },
  { code: 'BOSS', actionCode: 'XP_BOSS', label: 'Boss', formula: '1D4', description: 'O valor natural define o XP.', groups: [{ quantidade: 1, faces: 4 }], mode: 'Normal' },
  { code: 'SESSAO_SEM_COMBATE', actionCode: 'XP_SESSAO', label: 'Sessão sem combate', formula: '1D4', description: 'O valor natural é concedido a cada jogador.', groups: [{ quantidade: 1, faces: 4 }], mode: 'Normal' },
  { code: 'MVP_SESSAO', actionCode: 'XP_MVP', label: 'MVP da sessão', formula: '1D4', description: 'Substitui a rolagem comum de fim da sessão.', groups: [{ quantidade: 1, faces: 4 }], mode: 'Normal' },
  { code: 'MISSAO_SECUNDARIA', actionCode: 'XP_MISSAO_SECUNDARIA', label: 'Missão secundária', formula: '1D4', description: 'Ímpar concede 1 XP; par concede 2 XP.', groups: [{ quantidade: 1, faces: 4 }], mode: 'Normal' },
  { code: 'MISSAO_CONTRATO', actionCode: 'XP_CONTRATO', label: 'Contrato', formula: '2D4 com vantagem', description: 'Ímpar concede 1 XP; par concede 2 XP.', groups: [{ quantidade: 1, faces: 4 }], mode: 'Vantagem' },
  { code: 'MISSAO_PRINCIPAL', actionCode: 'XP_MISSAO_PRINCIPAL', label: 'Missão principal', formula: '2D6 com vantagem', description: 'O dado mantido define o XP.', groups: [{ quantidade: 1, faces: 6 }], mode: 'Vantagem' },
];

const parseStatus = (raw: unknown): PersonagemStatus | null => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as PersonagemStatus;
  } catch {
    return null;
  }
};

const visibilityLabel = (visibility: GameplayVisibility) => (
  VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label ?? visibility
);

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const createRequestKey = () => crypto.randomUUID();

const rollValues = (response: GameplayCommandResponse | null) => (
  response?.rolagem?.grupos.flatMap((group) => group.valores) ?? []
);

const diceGroupsFromExpression = (expression?: string | null): GameplayDiceGroupRequest[] => {
  const match = String(expression ?? '').match(/(\d*)\s*[dD]\s*(\d+)/);
  if (!match) return [];
  return [{ quantidade: Number(match[1] || 1), faces: Number(match[2]) }];
};

export const GameplayActionCenter = ({
  open,
  onClose,
  onDiceVisualOpenChange,
  onCharacterChange,
  initialCharacterId,
  initialAction,
  directInitialAction = false,
  characters,
  effectTargets = [],
  mesaAoVivo,
  session,
  events,
  loading,
  loadingMore,
  submitting,
  error,
  hasMore,
  theme,
  neon,
  onRoll,
  onApplyEffect,
  onGetActionCatalog,
  onRecordManual,
  onLoadMore,
  onRefresh,
  favorites = [],
  favoriteSaving = false,
  onSaveFavorite,
  onRemoveFavorite,
}: GameplayActionCenterProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rollDialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const commandKeysRef = useRef(new Map<string, string>());
  const initializedOpenRef = useRef(false);
  const requestedCharacterRef = useRef<number | null>(null);
  const requestedInitialActionRef = useRef<string | null>(null);
  const [tab, setTab] = useState<GameplayTab>('attributes');
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | ''>('');
  const [selectedAttribute, setSelectedAttribute] = useState<SelectedAttribute | null>(null);
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [selectedXpCode, setSelectedXpCode] = useState('');
  const [mode, setMode] = useState<GameplayRollMode>('Normal');
  const [diceFaces, setDiceFaces] = useState(6);
  const [visibility, setVisibility] = useState<GameplayVisibility>('PublicaMesa');
  const [manualCategory, setManualCategory] = useState('OUTRO');
  const [manualLabel, setManualLabel] = useState('');
  const [manualRawValue, setManualRawValue] = useState('');
  const [manualFinalValue, setManualFinalValue] = useState('');
  const [manualSemantic, setManualSemantic] = useState('');
  const [manualAssociatedValue, setManualAssociatedValue] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorTarget, setSubmitErrorTarget] = useState<ResultTarget | null>(null);
  const [lastResult, setLastResult] = useState<GameplayCommandResponse | null>(null);
  const [lastResultTarget, setLastResultTarget] = useState<ResultTarget | null>(null);
  const [actionCatalog, setActionCatalog] = useState<GameplayActionCatalog | null>(null);
  const [applyingEffect, setApplyingEffect] = useState<string | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<string[]>([]);
  const [effectTargetIds, setEffectTargetIds] = useState<Record<string, number | ''>>({});
  const effectRevisionRef = useRef(0);
  const effectTargetRevisionsRef = useRef(new Map<number, number>());
  const [diceVisual, setDiceVisual] = useState<{
    open: boolean;
    result: GameplayCommandResponse['rolagem'];
    error: string | null;
    title: string;
    hasDice: boolean;
    requestedFaces: number;
    requestedDiceCount: number;
    response: GameplayCommandResponse | null;
    target: ResultTarget | null;
  }>({
    open: false, result: null, error: null, title: '', hasDice: true,
    requestedFaces: 6, requestedDiceCount: 1, response: null, target: null,
  });
  const attributeDialogOpenRef = useRef(false);
  const diceVisualOpenRef = useRef(false);
  const diceThrowResolverRef = useRef<((launched: boolean) => void) | null>(null);
  attributeDialogOpenRef.current = attributeDialogOpen;
  diceVisualOpenRef.current = diceVisual.open;

  useEffect(() => {
    onDiceVisualOpenChange?.(open && diceVisual.open);
  }, [diceVisual.open, onDiceVisualOpenChange, open]);

  const selectedCharacter = useMemo(
    () => characters.find((entry) => entry.personagem.idpersonagemJogador === Number(selectedCharacterId)) ?? null,
    [characters, selectedCharacterId],
  );

  useEffect(() => {
    const characterId = selectedCharacter?.personagem.idpersonagemJogador;
    if (!open || !characterId || !onGetActionCatalog) {
      setActionCatalog(null);
      return;
    }
    let disposed = false;
    void onGetActionCatalog(characterId)
      .then((catalog) => {
        if (disposed) return;
        setActionCatalog(catalog);
        const faces = diceGroupsFromExpression(catalog.dadoTesteGeral)[0]?.faces;
        if (faces && DICE_OPTIONS.some((option) => option.value === faces)) setDiceFaces(faces);
      })
      .catch(() => { if (!disposed) setActionCatalog(null); });
    return () => { disposed = true; };
  }, [onGetActionCatalog, open, selectedCharacter?.personagem.idpersonagemJogador]);

  useEffect(() => {
    if (selectedCharacterId !== '') onCharacterChange?.(Number(selectedCharacterId));
  }, [onCharacterChange, selectedCharacterId]);
  useEffect(() => {
    effectRevisionRef.current = selectedCharacter?.personagem.revisaoRuntime ?? 0;
    setAppliedEffects([]);
    setApplyingEffect(null);
    setEffectTargetIds({});
  }, [selectedCharacter?.personagem.idpersonagemJogador, selectedCharacter?.personagem.revisaoRuntime]);
  useEffect(() => {
    effectTargetRevisionsRef.current = new Map(effectTargets.map((target) => [
      target.personagem.idpersonagemJogador,
      target.personagem.revisaoRuntime ?? 0,
    ]));
  }, [effectTargets]);
  const embeddedRuntime = selectedCharacter?.personagem.sistemaRuntime;
  const runtime = useSistemaRuntimeContexto({
    idMesa: selectedCharacter?.personagem.idmesa,
    idPersonagemJogador: selectedCharacter?.personagem.idpersonagemJogador,
    idRaca: selectedCharacter?.personagem.idraca,
    enabled: Boolean(selectedCharacter) && !embeddedRuntime,
  });
  const runtimeContext = embeddedRuntime ?? runtime.contexto;
  const characterStatus = useMemo(
    () => parseStatus(selectedCharacter?.personagem.statusJson),
    [selectedCharacter?.personagem.statusJson],
  );
  const primaryValues = useMemo(
    () => normalizeRuntimeAttributeValues(characterStatus?.atributos?.principais ?? {}),
    [characterStatus?.atributos?.principais],
  );
  const secondaryValues = useMemo(
    () => normalizeRuntimeAttributeValues(characterStatus?.atributos?.secundarios ?? {}),
    [characterStatus?.atributos?.secundarios],
  );
  const primaryFields = useMemo(
    () => getRuntimeAttributeFields(runtimeContext, 'Principal', primaryValues),
    [primaryValues, runtimeContext],
  );
  const secondaryFields = useMemo(
    () => getRuntimeAttributeFields(runtimeContext, 'Secundario', secondaryValues),
    [runtimeContext, secondaryValues],
  );
  const xpActions = useMemo(() => {
    const catalogSources = actionCatalog?.acoes.filter((action) => action.tipo === 'XP' && action.executavel) ?? [];
    if (catalogSources.length > 0) {
      return catalogSources.map((source) => ({
        code: source.codigo,
        actionCode: source.codigo,
        label: source.nome,
        description: 'Regra publicada pelo Sistema da Mesa.',
        formula: source.expressao || 'Valor fixo',
        groups: diceGroupsFromExpression(source.expressao),
        mode: source.modoPadrao,
      }));
    }
    const configured = runtimeContext?.progressao?.fontesExperiencia ?? [];
    if (configured.length > 0) {
      return configured.flatMap((source) => {
        const action = XP_ACTIONS.find((candidate) => candidate.code === normalizeRuntimeCode(source.codigo));
        return action ? [{
          ...action,
          label: source.nome || action.label,
        }] : [];
      });
    }

    return normalizeRuntimeCode(runtimeContext?.codigoSistema ?? '') === 'ODISSEIA'
      || runtimeContext?.usaFallbackLegado
      ? XP_ACTIONS
      : [];
  }, [actionCatalog, runtimeContext]);
  const selectedXp = xpActions.find((action) => action.code === selectedXpCode) ?? null;
  const attributeFavoriteId = selectedAttribute
    ? `${selectedAttribute.group.toUpperCase()}:${normalizeRuntimeCode(selectedAttribute.code || selectedAttribute.key)}`
    : '';
  const selectedAttributeFavorite = favorites.find((item) => item.tipoOrigem === 'ATRIBUTO'
    && item.idOrigem === attributeFavoriteId) ?? null;
  const selectedAttributeAction = selectedAttribute ? actionCatalog?.acoes.find((action) => (
    action.tipo === 'ATRIBUTO'
      && normalizeRuntimeCode(action.codigoAtributo ?? '') === normalizeRuntimeCode(selectedAttribute.code || selectedAttribute.key)
      && normalizeRuntimeCode(action.grupoAtributo ?? '') === normalizeRuntimeCode(selectedAttribute.group)
  )) ?? null : null;
  const selectedAttributeGroups = diceGroupsFromExpression(selectedAttributeAction?.expressao).length > 0
    ? diceGroupsFromExpression(selectedAttributeAction?.expressao)
    : [{ quantidade: 1, faces: 6 }];

  useEffect(() => {
    if (!attributeDialogOpen || !selectedAttribute) return;
    setMode(selectedAttributeFavorite?.configuracao.modo ?? 'Normal');
    setVisibility(selectedAttributeFavorite?.configuracao.visibilidade ?? 'PublicaMesa');
  }, [attributeDialogOpen, selectedAttribute, selectedAttributeFavorite]);

  useEffect(() => {
    if (!open) {
      diceThrowResolverRef.current?.(false);
      diceThrowResolverRef.current = null;
      initializedOpenRef.current = false;
      requestedCharacterRef.current = null;
      requestedInitialActionRef.current = null;
      return;
    }
    const validInitial = characters.some((entry) => entry.personagem.idpersonagemJogador === initialCharacterId);
    const fallbackId = validInitial ? Number(initialCharacterId) : characters[0]?.personagem.idpersonagemJogador ?? '';
    if (!initializedOpenRef.current || requestedCharacterRef.current !== (initialCharacterId ?? null)) {
      initializedOpenRef.current = true;
      requestedCharacterRef.current = initialCharacterId ?? null;
      setSelectedCharacterId(fallbackId);
      setSelectedAttribute(null);
      setAttributeDialogOpen(false);
      setSelectedXpCode('');
      setSubmitError(null);
      setSubmitErrorTarget(null);
      setLastResult(null);
      setLastResultTarget(null);
      return;
    }
    setSelectedCharacterId((current) => characters.some((entry) => entry.personagem.idpersonagemJogador === current)
      ? current
      : fallbackId);
  }, [characters, initialCharacterId, open]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => panelRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (diceVisualOpenRef.current) return;
        event.preventDefault();
        if (attributeDialogOpenRef.current) {
          setAttributeDialogOpen(false);
          if (directInitialAction) onClose();
        }
        else onClose();
        return;
      }
      if (diceVisualOpenRef.current || event.key !== 'Tab') return;
      const activePanel = attributeDialogOpenRef.current ? rollDialogRef.current : panelRef.current;
      if (!activePanel) return;
      const focusable = [...activePanel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [directInitialAction, onClose, open]);

  useEffect(() => {
    if (attributeDialogOpen) window.requestAnimationFrame(() => rollDialogRef.current?.focus());
    else if (open) window.requestAnimationFrame(() => panelRef.current?.focus());
  }, [attributeDialogOpen, open]);

  useEffect(() => {
    setSelectedAttribute(null);
    setAttributeDialogOpen(false);
    setSelectedXpCode('');
    setLastResult(null);
    setLastResultTarget(null);
    setSubmitError(null);
    setSubmitErrorTarget(null);
  }, [selectedCharacterId]);

  useEffect(() => {
    if (!open) requestedInitialActionRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!open || !initialAction || !selectedCharacter) return;
    const actionKey = initialAction.type === 'attribute'
      ? `attribute:${initialAction.group}:${normalizeRuntimeCode(initialAction.attributeCode)}`
      : 'xp';
    if (requestedInitialActionRef.current === actionKey) return;

    if (initialAction.type === 'xp') {
      requestedInitialActionRef.current = actionKey;
      setTab('xp');
      return;
    }

    const fields = initialAction.group === 'Principal' ? primaryFields : secondaryFields;
    const values = initialAction.group === 'Principal' ? primaryValues : secondaryValues;
    const code = normalizeRuntimeCode(initialAction.attributeCode);
    const field = fields.find((entry) => normalizeRuntimeCode(entry.code) === code
      || normalizeRuntimeCode(entry.key) === code);
    if (!field) return;

    requestedInitialActionRef.current = actionKey;
    setTab('attributes');
    setSelectedAttribute({
      ...field,
      group: initialAction.group,
      value: Number(values[field.key]) || 0,
    });
    setAttributeDialogOpen(true);
    setSubmitError(null);
    setSubmitErrorTarget(null);
    setLastResult(null);
    setLastResultTarget(null);
  }, [
    initialAction,
    open,
    primaryFields,
    primaryValues,
    secondaryFields,
    secondaryValues,
    selectedCharacter,
  ]);

  if (!open) return null;

  const closeAttributeDialog = () => {
    setAttributeDialogOpen(false);
    if (directInitialAction) onClose();
  };

  const handleAttributeFavorite = async () => {
    if (!selectedAttribute || !selectedCharacter) return;
    setSubmitError(null);
    try {
      if (selectedAttributeFavorite) {
        await onRemoveFavorite?.(selectedAttributeFavorite.idFavorito);
        return;
      }
      await onSaveFavorite?.({
        tipoOrigem: 'ATRIBUTO',
        idOrigem: attributeFavoriteId,
        nome: selectedAttribute.label,
        configuracao: {
          codigoAcao: selectedAttribute.group === 'Principal' ? 'ATRIBUTO_PRINCIPAL' : 'ATRIBUTO_SECUNDARIO',
          codigoAtributo: selectedAttribute.key,
          grupos: selectedAttributeGroups,
          modo: mode,
          visibilidade: visibility,
        },
      });
    } catch (favoriteError) {
      setSubmitError(getApiErrorMessage(favoriteError, 'Não foi possível atualizar o favorito.'));
      setSubmitErrorTarget('attribute');
    }
  };

  const requestKeyFor = (fingerprint: string) => {
    const existing = commandKeysRef.current.get(fingerprint);
    if (existing) return existing;
    const created = createRequestKey();
    commandKeysRef.current.set(fingerprint, created);
    return created;
  };

  const presentRollResult = (response: GameplayCommandResponse, target: ResultTarget) => {
    setLastResult(response);
    setLastResultTarget(target);
    setAppliedEffects([]);
    setApplyingEffect(null);
    setEffectTargetIds({});
    setSubmitError(null);
    setSubmitErrorTarget(null);
  };

  const finishRequest = (fingerprint: string, response: GameplayCommandResponse, target: ResultTarget) => {
    commandKeysRef.current.delete(fingerprint);
    presentRollResult(response, target);
  };

  const closeDiceVisual = () => {
    diceVisualOpenRef.current = false;
    diceThrowResolverRef.current?.(false);
    diceThrowResolverRef.current = null;
    if (diceVisual.response && diceVisual.target) {
      presentRollResult(diceVisual.response, diceVisual.target);
    }
    setDiceVisual((current) => ({
      ...current,
      open: false,
      response: null,
      target: null,
    }));
  };

  const launchDiceVisual = () => {
    diceThrowResolverRef.current?.(true);
    diceThrowResolverRef.current = null;
  };

  const submitRoll = async (
    codigoAcao: string,
    groups: GameplayDiceGroupRequest[],
    rollMode: GameplayRollMode,
    target: ResultTarget,
    title: string,
    codigoAtributo?: string,
  ) => {
    if (!selectedCharacter) {
      setSubmitError('Selecione um personagem.');
      setSubmitErrorTarget(target);
      return;
    }
    const basePayload = {
      codigoAcao,
      idPersonagemJogador: selectedCharacter.personagem.idpersonagemJogador,
      codigoAtributo,
      grupos: groups,
      modo: rollMode,
      visibilidade: visibility,
      revisaoSessaoEsperada: session?.revisaoEstado,
    };
    const fingerprint = JSON.stringify(basePayload);
    const requestedFaces = groups[0]?.faces ?? 6;
    const waitsForPhysicalThrow = groups.length > 0 && [4, 6, 8, 10, 12, 20].includes(requestedFaces);
    const launchPromise = waitsForPhysicalThrow
      ? new Promise<boolean>((resolve) => { diceThrowResolverRef.current = resolve; })
      : Promise.resolve(true);
    setSubmitError(null);
    setSubmitErrorTarget(null);
    diceVisualOpenRef.current = true;
    setDiceVisual({ open: true, result: null, error: null, title,
      hasDice: groups.length > 0,
      requestedFaces,
      requestedDiceCount: Math.min(2, groups.reduce((total, group) => total + group.quantidade, 0) * (rollMode === 'Normal' ? 1 : 2)),
      response: null,
      target: null,
    });
    const launched = await launchPromise;
    if (!launched) return;
    try {
      const response = await onRoll({
        ...basePayload,
        chaveIdempotencia: requestKeyFor(fingerprint),
      });
      commandKeysRef.current.delete(fingerprint);
      setSubmitError(null);
      setSubmitErrorTarget(null);
      if (!diceVisualOpenRef.current) {
        presentRollResult(response, target);
      } else {
        setDiceVisual((current) => ({
          ...current,
          result: response.rolagem,
          response,
          target,
          error: response.rolagem ? null : 'O resultado está oculto pela visibilidade escolhida.',
        }));
      }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Não foi possível concluir a rolagem.');
      setSubmitError(message);
      setSubmitErrorTarget(target);
      setDiceVisual((current) => ({ ...current, error: message }));
    }
  };

  const submitManual = async () => {
    if (!manualLabel.trim()) {
      setSubmitError('Informe um nome curto para o registro.');
      setSubmitErrorTarget('manual');
      return;
    }
    const numericInputs = [manualRawValue, manualFinalValue, manualAssociatedValue]
      .map((value) => value.trim())
      .filter(Boolean);
    if (numericInputs.length === 0) {
      setSubmitError('Informe ao menos um valor numérico.');
      setSubmitErrorTarget('manual');
      return;
    }
    if (numericInputs.some((value) => !Number.isInteger(Number(value)) || Math.abs(Number(value)) > 1_000_000)) {
      setSubmitError('Use números inteiros entre -1.000.000 e 1.000.000.');
      setSubmitErrorTarget('manual');
      return;
    }
    const numeric = (value: string) => value.trim() === '' ? undefined : Number(value);
    const basePayload = {
      idPersonagemJogador: selectedCharacter?.personagem.idpersonagemJogador,
      categoria: manualCategory,
      rotulo: manualLabel.trim(),
      valorBruto: numeric(manualRawValue),
      resultadoFinal: numeric(manualFinalValue),
      resultadoSemantico: manualSemantic.trim() || undefined,
      valorAssociado: numeric(manualAssociatedValue),
      observacao: manualNote.trim() || undefined,
      visibilidade: visibility,
      revisaoSessaoEsperada: session?.revisaoEstado,
      revisaoPersonagemEsperada: selectedCharacter?.personagem.revisaoRuntime,
    };
    const fingerprint = JSON.stringify(basePayload);
    try {
      const response = await onRecordManual({
        ...basePayload,
        chaveIdempotencia: requestKeyFor(fingerprint),
      });
      finishRequest(fingerprint, response, 'manual');
      setManualLabel('');
      setManualRawValue('');
      setManualFinalValue('');
      setManualSemantic('');
      setManualAssociatedValue('');
      setManualNote('');
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError, 'Não foi possível salvar o registro.'));
      setSubmitErrorTarget('manual');
    }
  };

  const applyEffect = async (effect: GameplayEffectProposal) => {
    const sourceEventId = lastResult?.evento?.idEvento;
    if (!onApplyEffect || !sourceEventId) return;
    const targetId = effect.exigeAlvo ? effectTargetIds[effect.codigo] : undefined;
    if (effect.exigeAlvo && !targetId) {
      setSubmitError('Selecione o personagem que receberá o efeito.');
      setSubmitErrorTarget(lastResultTarget);
      return;
    }
    const expectedRevision = targetId
      ? effectTargetRevisionsRef.current.get(Number(targetId)) ?? 0
      : effectRevisionRef.current;
    setApplyingEffect(effect.codigo);
    setSubmitError(null);
    try {
      const applied = await onApplyEffect({
        chaveIdempotencia: createRequestKey(),
        idEventoOrigem: sourceEventId,
        codigoEfeito: effect.codigo,
        idPersonagemAlvo: targetId ? Number(targetId) : undefined,
        revisaoPersonagemEsperada: expectedRevision,
      });
      if (applied.aplicacao) {
        if (targetId) effectTargetRevisionsRef.current.set(Number(targetId), applied.aplicacao.revisaoPersonagem);
        else effectRevisionRef.current = applied.aplicacao.revisaoPersonagem;
      }
      setAppliedEffects((current) => [...new Set([...current, effect.codigo])]);
      await onRefresh();
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError, 'Não foi possível aplicar o efeito.'));
      setSubmitErrorTarget(lastResultTarget);
    } finally {
      setApplyingEffect(null);
    }
  };

  const renderResult = (target: ResultTarget) => {
    if (!lastResult || lastResultTarget !== target) return null;
    const roll = lastResult.rolagem;
    const values = rollValues(lastResult);
    const modifierSummary = roll ? getGameplayModifierSummary(roll) : '';
    const outcome = getGameplayRollOutcome(lastResult.rolagem, lastResult.evento?.codigoAcao);
    const ResultContainer = target === 'attribute' ? RollDialogResult : ResultCard;
    return (
      <ResultContainer $outcome={outcome} aria-live="polite">
        <header>
          <h3>{lastResult.evento?.titulo || 'Resultado do teste'}</h3>
          <Badge $tone={lastResult.simulacao ? 'yellow' : lastResult.evento?.manual ? 'pink' : 'blue'}>
            {lastResult.simulacao ? 'Simulação' : lastResult.evento?.manual ? 'Manual' : 'Registrado'}
          </Badge>
        </header>
        {roll && <strong>{getGameplayRollSummary(roll)}</strong>}
        {roll?.expressao && <p>{roll.expressao}</p>}
        {values.length > 0 && <p>Dados: {values.join(', ')}</p>}
        {modifierSummary && <p>Modificadores: {modifierSummary}</p>}
        {roll?.rolagensIndividuais?.map((individual, index) => (
          <p key={`roll-${index + 1}`}>Ação {index + 1}: {getGameplayRollSummary(individual)}</p>
        ))}
        {roll?.valorAssociado != null && <p>Valor associado: {roll.valorAssociado}</p>}
        {lastResult.evento?.valorAssociado != null && !roll && <p>Valor associado: {lastResult.evento.valorAssociado}</p>}
        {lastResult.evento?.observacao && <p>{lastResult.evento.observacao}</p>}
        {lastResult.simulacao && <p>{lastResult.aviso || 'Este resultado não foi salvo.'}</p>}
        {lastResult.replay && <p>Resposta recuperada sem repetir a rolagem.</p>}
        {roll?.efeitosPropostos?.map((effect) => (
          <div key={effect.codigo}>
            {!effect.podeAplicar && <p>{effect.nome} · {effect.motivoIndisponivel || 'efeito indisponível'}</p>}
            {effect.podeAplicar && effect.exigeAlvo && effectTargets.length > 0 && (
              <Select
                theme={theme}
                neon={neon}
                portal
                label="Personagem alvo"
                value={effectTargetIds[effect.codigo] ?? ''}
                options={effectTargets.map((target) => ({
                  value: target.personagem.idpersonagemJogador,
                  label: target.personagem.nome,
                }))}
                onChange={(event) => setEffectTargetIds((current) => ({
                  ...current,
                  [effect.codigo]: Number(event.target.value) || '',
                }))}
              />
            )}
            {effect.podeAplicar && effect.exigeAlvo && effectTargets.length === 0 ? (
              <p>{effect.nome} · o mestre escolhe o alvo na tela da Mesa.</p>
            ) : effect.podeAplicar ? (
            <SubmitButton
              type="button"
              disabled={!onApplyEffect || Boolean(lastResult.simulacao) || appliedEffects.includes(effect.codigo) || Boolean(applyingEffect)}
              onClick={() => void applyEffect(effect)}
            >
              {applyingEffect === effect.codigo
                ? 'Aplicando…'
                : appliedEffects.includes(effect.codigo) ? 'Aplicado' : effect.nome}
            </SubmitButton>
            ) : null}
          </div>
        ))}
      </ResultContainer>
    );
  };

  const renderAttributes = () => (
    <ActionWorkspace>
      {!selectedCharacter ? (
        <InlineMessage $kind="warning">Selecione um personagem para usar os atributos.</InlineMessage>
      ) : (
        <>
          <ComposerCard>
            <h3>Rolagem de dado</h3>
            <p>Faça um teste livre com o personagem selecionado.</p>
            <ComposerGrid>
              <Select
                theme={theme}
                neon={neon}
                portal
                label="Dado"
                value={diceFaces}
                options={DICE_OPTIONS}
                allowEmptyOption={false}
                onChange={(event) => setDiceFaces(Number(event.target.value))}
              />
              <Select
                theme={theme}
                neon={neon}
                portal
                label="Modo"
                value={mode}
                options={MODE_OPTIONS}
                allowEmptyOption={false}
                onChange={(event) => setMode(event.target.value as GameplayRollMode)}
              />
            </ComposerGrid>
            <Select
              theme={theme}
              neon={neon}
              portal
              label="Visibilidade"
              value={visibility}
              options={VISIBILITY_OPTIONS}
              allowEmptyOption={false}
              onChange={(event) => setVisibility(event.target.value as GameplayVisibility)}
            />
            <SubmitButton
              type="button"
              disabled={submitting}
              onClick={() => void submitRoll('TESTE_GENERICO', [{ quantidade: 1, faces: diceFaces }], mode, 'generic', `Rolagem D${diceFaces}`)}
            >
              <CasinoOutlinedIcon /> {submitting ? 'Rolando…' : `Rolar D${diceFaces}`}
            </SubmitButton>
            {submitErrorTarget === 'generic' && submitError && <InlineMessage $kind="error">{submitError}</InlineMessage>}
            {renderResult('generic')}
          </ComposerCard>

          {([
            ['Principal', 'Principais', primaryFields, primaryValues],
            ['Secundario', 'Secundários', secondaryFields, secondaryValues],
          ] as const).map(([group, label, fields, values]) => (
            <div key={group}>
              <GroupTitle><h3>{label}</h3><small>Regra do Sistema</small></GroupTitle>
              <AttributeGrid>
                {fields.map((field) => {
                  const value = Number(values[field.key]) || 0;
                  const selected = selectedAttribute?.group === group && selectedAttribute.code === field.code;
                  return (
                    <AttributeButton
                      key={`${group}-${field.code}`}
                      type="button"
                      $selected={selected}
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedAttribute({ ...field, group, value });
                        setAttributeDialogOpen(true);
                        setSubmitError(null);
                        setSubmitErrorTarget(null);
                        setLastResult(null);
                        setLastResultTarget(null);
                      }}
                    >
                      <span>{field.label}</span><strong>{value}</strong>
                    </AttributeButton>
                  );
                })}
              </AttributeGrid>
            </div>
          ))}

        </>
      )}
    </ActionWorkspace>
  );

  const renderXp = () => (
    <ActionWorkspace>
      {!selectedCharacter ? (
        <InlineMessage $kind="warning">Selecione um personagem para registrar XP.</InlineMessage>
      ) : (
        <>
          <GroupTitle><h3>Fonte de experiência</h3><small>Rolagem sem concessão automática</small></GroupTitle>
          {xpActions.length === 0 ? (
            <InlineMessage $kind="warning">Este Sistema não possui fontes de XP executáveis.</InlineMessage>
          ) : <XpSourceList>
            {xpActions.map((source) => (
              <XpSourceButton
                key={source.code}
                type="button"
                $selected={selectedXpCode === source.code}
                aria-pressed={selectedXpCode === source.code}
                onClick={() => {
                  setSelectedXpCode(source.code);
                  setSubmitError(null);
                  setLastResult(null);
                }}
              >
                <span>{source.label}<small>{source.formula} · {source.description}</small></span>
              </XpSourceButton>
            ))}
          </XpSourceList>}
          {selectedXp && (
            <ComposerCard>
              <h3>{selectedXp.label}</h3>
              <p>{selectedXp.description}</p>
              <FormulaPreview><span>Regra</span><strong>{selectedXp.formula}</strong></FormulaPreview>
              <Select
                theme={theme}
                neon={neon}
                portal
                label="Visibilidade"
                value={visibility}
                options={VISIBILITY_OPTIONS}
                allowEmptyOption={false}
                onChange={(event) => setVisibility(event.target.value as GameplayVisibility)}
              />
              <SubmitButton
                type="button"
                $accent="yellow"
                disabled={submitting}
                onClick={() => void submitRoll(
                  selectedXp.actionCode,
                  selectedXp.groups,
                  selectedXp.mode,
                  'xp',
                  selectedXp.label,
                )}
              >
                <MilitaryTechOutlinedIcon /> {submitting ? 'Registrando…' : 'Rolar XP'}
              </SubmitButton>
              <FieldHint>Esta etapa registra a origem e o resultado. A concessão de XP continua separada.</FieldHint>
              {submitErrorTarget === 'xp' && submitError && <InlineMessage $kind="error">{submitError}</InlineMessage>}
              {renderResult('xp')}
            </ComposerCard>
          )}
        </>
      )}
    </ActionWorkspace>
  );

  const renderManual = () => (
    <ActionWorkspace>
      <ComposerCard>
        <h3>Registro manual</h3>
        <p>Registre um resultado externo sem apresentá-lo como uma rolagem automática.</p>
        <ComposerGrid>
          <Select
            theme={theme}
            neon={neon}
            portal
            label="Categoria"
            value={manualCategory}
            options={MANUAL_CATEGORY_OPTIONS}
            allowEmptyOption={false}
            onChange={(event) => setManualCategory(event.target.value)}
          />
          <Select
            theme={theme}
            neon={neon}
            portal
            label="Visibilidade"
            value={visibility}
            options={VISIBILITY_OPTIONS}
            allowEmptyOption={false}
            onChange={(event) => setVisibility(event.target.value as GameplayVisibility)}
          />
          <div className="full">
            <InputText
              theme={theme}
              neon={neon}
              label="Nome do registro"
              value={manualLabel}
              required
              onChange={(event) => setManualLabel(event.target.value)}
            />
          </div>
          <InputText theme={theme} neon={neon} label="Valor bruto" type="number" value={manualRawValue} onChange={(event) => setManualRawValue(event.target.value)} />
          <InputText theme={theme} neon={neon} label="Resultado final" type="number" value={manualFinalValue} onChange={(event) => setManualFinalValue(event.target.value)} />
          <InputText theme={theme} neon={neon} label="Resultado semântico" value={manualSemantic} onChange={(event) => setManualSemantic(event.target.value)} />
          <InputText theme={theme} neon={neon} label="Dano, defesa, cura ou XP" type="number" value={manualAssociatedValue} onChange={(event) => setManualAssociatedValue(event.target.value)} />
          <div className="full">
            <TextArea theme={theme} neon={neon} label="Observação" value={manualNote} rows={3} fullWidth onChange={(event) => setManualNote(event.target.value)} />
          </div>
        </ComposerGrid>
        <SubmitButton type="button" $accent="pink" disabled={submitting} onClick={() => void submitManual()}>
          <NoteAddOutlinedIcon /> {submitting ? 'Processando…' : session ? 'Salvar registro manual' : 'Ver resultado sem salvar'}
        </SubmitButton>
        {submitErrorTarget === 'manual' && submitError && <InlineMessage $kind="error">{submitError}</InlineMessage>}
        {renderResult('manual')}
      </ComposerCard>
    </ActionWorkspace>
  );

  return <>
    {!directInitialAction && createPortal(
    <GameplayBackdrop $concealed={attributeDialogOpen} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <GameplayPanelShell
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gameplay-actions-title"
        aria-hidden={attributeDialogOpen || diceVisual.open}
      >
      <GameplayPanel neon={neon === 'on'}>
        <GameplayHeader>
          <div>
            <h2 id="gameplay-actions-title">Central de ações</h2>
            <p>Testes do personagem e registros da sessão.</p>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label="Fechar Central de ações"><CloseIcon /></CloseButton>
        </GameplayHeader>
        <GameplayBody>
          <ContextRow>
            <Select
              theme={theme}
              neon={neon}
              portal
              label="Personagem"
              value={selectedCharacterId}
              options={characters.map((entry) => ({
                value: entry.personagem.idpersonagemJogador,
                label: entry.personagem.nome || 'Personagem sem nome',
              }))}
              allowEmptyOption
              onChange={(event) => setSelectedCharacterId(event.target.value ? Number(event.target.value) : '')}
            />
            <SessionState $active={Boolean(session)}>{session ? 'Sessão ativa' : mesaAoVivo ? error ? 'Erro de sessão' : 'Sem sessão' : 'Mesa offline'}</SessionState>
          </ContextRow>

          {!session && !loading && (
            <InlineMessage $kind="warning">
              {mesaAoVivo
                ? 'O histórico não carregou. Ao rolar, tentaremos reconectar; sem sessão, o teste não será salvo.'
                : 'Modo de teste: você pode rolar dados, mas os resultados não serão salvos.'}
            </InlineMessage>
          )}
          {error && <InlineMessage $kind="error">{error}</InlineMessage>}

          <Tabs role="tablist" aria-label="Tipos de ação">
            <TabButton type="button" role="tab" aria-selected={tab === 'attributes'} $active={tab === 'attributes'} onClick={() => setTab('attributes')}><CasinoOutlinedIcon /> Atributos</TabButton>
            <TabButton type="button" role="tab" aria-selected={tab === 'xp'} $active={tab === 'xp'} onClick={() => setTab('xp')}><MilitaryTechOutlinedIcon /> XP</TabButton>
            <TabButton type="button" role="tab" aria-selected={tab === 'manual'} $active={tab === 'manual'} onClick={() => setTab('manual')}><NoteAddOutlinedIcon /> Manual</TabButton>
            <TabButton type="button" role="tab" aria-selected={tab === 'history'} $active={tab === 'history'} onClick={() => setTab('history')}><HistoryOutlinedIcon /> Histórico</TabButton>
          </Tabs>

          {loading ? (
            <LoadingBlock><LoadingIndicator label="Carregando ações" /></LoadingBlock>
          ) : (
            <WorkArea>
              {tab !== 'history' && <div role="tabpanel">
                {tab === 'attributes' && renderAttributes()}
                {tab === 'xp' && renderXp()}
                {tab === 'manual' && renderManual()}
              </div>}

              {tab === 'history' && (
              <HistoryPanel aria-label="Histórico da sessão">
                <HistoryHeader>
                  <h3><HistoryOutlinedIcon aria-hidden="true" /> Histórico</h3>
                  <button type="button" onClick={() => void onRefresh()} aria-label="Atualizar histórico"><RefreshOutlinedIcon /></button>
                </HistoryHeader>
                <HistoryList role="log" aria-live="polite" aria-relevant="additions text">
                  {events.length === 0 ? (
                    <InlineMessage>{error
                      ? 'O histórico não carregou. Tente atualizar.'
                      : session ? 'Nenhuma ação registrada nesta sessão.' : 'Sem histórico nesta Mesa.'}</InlineMessage>
                  ) : events.map((event) => {
                    const eventValues = event.rolagem?.grupos.flatMap((group) => group.valores) ?? [];
                    const eventModifiers = event.rolagem ? getGameplayModifierSummary(event.rolagem) : '';
                    return (
                      <HistoryCard key={event.idEvento} $manual={event.manual}>
                        <header><h4>{event.titulo || event.codigoAcao}</h4><time dateTime={event.criadoEmUtc}>{formatDate(event.criadoEmUtc)}</time></header>
                        <CardBadges>
                          {event.manual && <Badge $tone="yellow">Manual</Badge>}
                          <Badge $tone="grey">{visibilityLabel(event.visibilidade)}</Badge>
                        </CardBadges>
                        {event.idPersonagemJogador && <p><strong>{characters.find((entry) => entry.personagem.idpersonagemJogador === event.idPersonagemJogador)?.personagem.nome || 'Personagem'}</strong></p>}
                        {event.rolagem && <p><GameplayOutcomeValue $tone={getGameplayEventOutcome(event)}>{getGameplayRollSummary(event.rolagem)}</GameplayOutcomeValue>{` · ${event.rolagem.expressao}`}{eventValues.length > 1 ? ` · dados: ${eventValues.join(', ')}` : ''}</p>}
                        {eventModifiers && <p>Modificadores: {eventModifiers}</p>}
                        {!event.rolagem && event.resultadoSemantico && <p>{event.resultadoSemantico}</p>}
                        {event.observacao && <p>{event.observacao}</p>}
                      </HistoryCard>
                    );
                  })}
                </HistoryList>
                {hasMore && <LoadMoreButton type="button" disabled={loadingMore} onClick={() => void onLoadMore()}>{loadingMore ? 'Carregando…' : 'Carregar mais'}</LoadMoreButton>}
              </HistoryPanel>
              )}
            </WorkArea>
          )}
        </GameplayBody>
      </GameplayPanel>
      </GameplayPanelShell>
    </GameplayBackdrop>, document.body)}
    {attributeDialogOpen && selectedAttribute && createPortal(
      <RollDialogBackdrop
        $concealed={diceVisual.open}
        ref={rollDialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="attribute-roll-title"
        aria-hidden={diceVisual.open}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeAttributeDialog();
        }}
      >
        <RollDialogPanel neon={neon === 'on'}>
          <RollDialogHeader>
            <div>
              <h2 id="attribute-roll-title">Teste de {selectedAttribute.label}</h2>
              <p>{selectedCharacter?.personagem.nome}</p>
            </div>
            <RollDialogHeaderActions>
              {(onSaveFavorite || onRemoveFavorite) && (
                <FavoriteRollButton
                  type="button"
                  $active={Boolean(selectedAttributeFavorite)}
                  disabled={favoriteSaving}
                  title={selectedAttributeFavorite ? 'Remover dos favoritos' : 'Favoritar esta configuração'}
                  aria-label={selectedAttributeFavorite ? 'Remover dos favoritos' : 'Favoritar esta configuração'}
                  aria-pressed={Boolean(selectedAttributeFavorite)}
                  onClick={() => void handleAttributeFavorite()}
                >
                  {selectedAttributeFavorite ? <StarOutlinedIcon /> : <StarBorderOutlinedIcon />}
                </FavoriteRollButton>
              )}
              <CloseButton type="button" aria-label="Fechar teste" onClick={closeAttributeDialog}><CloseIcon /></CloseButton>
            </RollDialogHeaderActions>
          </RollDialogHeader>
          <RollDialogBody>
            <p>{selectedAttribute.description || 'Escolha o modo e faça o teste.'}</p>
            <FormulaPreview>
              <span>Fórmula</span>
              <strong>{selectedAttributeAction?.expressao || `Atributo + ${selectedAttribute.value}`}</strong>
            </FormulaPreview>
            <ComposerGrid>
              <Select theme={theme} neon={neon} portal label="Modo" value={mode} options={MODE_OPTIONS}
                allowEmptyOption={false} onChange={(event) => setMode(event.target.value as GameplayRollMode)} />
              <Select theme={theme} neon={neon} portal label="Visibilidade" value={visibility} options={VISIBILITY_OPTIONS}
                allowEmptyOption={false} onChange={(event) => setVisibility(event.target.value as GameplayVisibility)} />
            </ComposerGrid>
            <SubmitButton
              type="button"
              disabled={submitting}
              onClick={() => void submitRoll(
                selectedAttribute.group === 'Principal' ? 'ATRIBUTO_PRINCIPAL' : 'ATRIBUTO_SECUNDARIO',
                selectedAttributeGroups,
                mode,
                'attribute',
                `Teste de ${selectedAttribute.label}`,
                selectedAttribute.key,
              )}
            >
              <CasinoOutlinedIcon /> {submitting ? 'Rolando…' : 'Rolar teste'}
            </SubmitButton>
            {submitErrorTarget === 'attribute' && submitError && <InlineMessage $kind="error">{submitError}</InlineMessage>}
            {renderResult('attribute')}
          </RollDialogBody>
        </RollDialogPanel>
      </RollDialogBackdrop>, document.body)}
    <DiceRollOverlay
      open={diceVisual.open}
      result={diceVisual.result ?? null}
      error={diceVisual.error}
      title={diceVisual.title}
      hasDice={diceVisual.hasDice}
      requestedFaces={diceVisual.requestedFaces}
      requestedDiceCount={diceVisual.requestedDiceCount}
      neon={neon === 'on'}
      onClose={closeDiceVisual}
      onThrow={launchDiceVisual}
    />
  </>;
};
