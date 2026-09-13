import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useNavigate } from 'react-router-dom';
import dnaIcon from '../../../../assets/svg/dna1.svg';
import scalesIcon from '../../../../assets/svg/scales.svg';
import villageIcon from '../../../../assets/svg/village.svg';
import { StatusBar } from '../../../../components/Generic/StatusBar/StatusBar';
import {
  PersonagemJogador,
  PersonagemStatus,
  StatusBase,
} from '../../../../models/PersonagemJogador';
import {
  HudBottomLine,
  HudCornerEl,
  HudLeftLine,
  HudRightLine,
  HudTopLine,
} from '../../../Personagem/PersonagemPage.style';
import { resolveCharacterProgression } from '../../../../utils/characterProgression';
import { useSistemaRuntimeContexto } from '../../../../hooks/useSistemaRuntimeContexto';
import { getRuntimeResourceLabel } from '../../../../utils/systemRuntimeCharacter';
import { SystemRuntimeIndicator } from '../../../../components/Generic/SystemRuntimeIndicator';
import { CharacterComparisonButton, CharacterComparisonModal } from '../../../../components/CharacterComparison';
import { createCharacterComparisonData } from '../../../../components/CharacterComparison/characterComparison.utils';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import {
  ActionButton,
  Actions,
  CharacterAvatar,
  CharacterHeader,
  CharacterName,
  DetailsGrid,
  DetailItem,
  DetailLabel,
  DetailLink,
  DetailValue,
  HudCard,
  InfoIcon,
  InfoItem,
  InfoLabel,
  InfoRow,
  InfoValue,
  LevelFlag,
  MesaContextMeta,
  MesaGameCharacterHeader,
  MesaGameStatusColumn,
  MesaGameStatusItem,
  PresenceDot,
  ProgressBody,
  ProgressFill,
  ProgressHeader,
  ProgressTrack,
  ProficiencyValue,
  QuickResourceButton,
  QuickResourceInput,
  QuickXpButton,
  QuickXpInput,
  SelectionMarker,
  StatusColumn,
  StatusItem,
  StatusLabel,
  VisibilityState,
  XpSection,
} from './CharacterSelectionCard.style';

interface CharacterSelectionCardProps {
  personagem: PersonagemJogador;
  status: StatusBase;
  level: number;
  xp: number;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onView: () => void;
  onSheet: () => void;
  onEdit: () => void;
  onUpdateSystem?: () => void;
  updatingSystem?: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: () => void;
  context?: 'owner' | 'mesa-own' | 'mesa-other' | 'mesa-master';
  ownerName?: string;
  online?: boolean;
  variant?: 'default' | 'mesa-game';
  onQuickStatusUpdate?: (changes: {
    vida?: number;
    mana?: number;
    estamina?: number;
    xp?: number;
  }) => void | Promise<void>;
}

const emptyComparisonStatus = (
  status: StatusBase,
  level: number,
  xp: number,
): PersonagemStatus => ({
  status,
  atributos: {
    principais: {
      resistencia: 0,
      agilidade: 0,
      sabedoria: 0,
      precisao: 0,
      forca: 0,
    },
    secundarios: {
      sanidade: 0,
      coragem: 0,
      inteligencia: 0,
      percepcao: 0,
      labia: 0,
      intimidacao: 0,
    },
  },
  defesas: {
    escudo: 0,
    protecao: 0,
    armadura: 0,
    outras: 0,
  },
  nivel: level,
  xp,
});

const comparisonStatusFrom = (
  raw: PersonagemJogador['statusJson'],
  fallbackStatus: StatusBase,
  level: number,
  xp: number,
): PersonagemStatus => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (parsed && typeof parsed === 'object' && 'status' in parsed) {
      return parsed as PersonagemStatus;
    }
  } catch {
    // The reduced card data remains comparable even for legacy invalid JSON.
  }

  return emptyComparisonStatus(fallbackStatus, level, xp);
};

const countSkills = (raw?: string) => {
  if (!raw) return 0;
  try {
    const skills = JSON.parse(raw);
    return Array.isArray(skills)
      ? skills.filter((entry) => (entry !== null && typeof entry === 'object') || Boolean(String(entry).trim())).length
      : 0;
  } catch {
    return 0;
  }
};

type QuickField = 'vida' | 'mana' | 'estamina' | 'xp';

interface EditableResourceProps {
  field: Exclude<QuickField, 'xp'>;
  value: number;
  maxValue?: number;
  type: 'vida' | 'mana' | 'estamina';
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate?: CharacterSelectionCardProps['onQuickStatusUpdate'];
  compact?: boolean;
}

const EditableResource = ({
  field,
  value,
  maxValue,
  type,
  theme,
  neon,
  onUpdate,
  compact = false,
}: EditableResourceProps) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value));
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const committed = React.useRef(false);

  React.useEffect(() => setDraft(String(value)), [value]);
  React.useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    setEditing(false);
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) return;
    const next = Math.max(0, Math.round(parsed));
    if (next !== value) void onUpdate?.({ [field]: next });
  };

  if (!onUpdate) {
    return <StatusBar theme={theme} neon={neon} type={type} value={value} maxValue={maxValue} height={compact ? "15px" : "18px"} />;
  }

  return editing ? (
    <QuickResourceInput
      ref={inputRef}
      type="number"
      min={0}
      value={draft}
      aria-label={`Editar ${field}`}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
        if (event.key === 'Escape') {
          committed.current = true;
          setDraft(String(value));
          setEditing(false);
        }
      }}
    />
  ) : (
    <QuickResourceButton
      type="button"
      aria-label={`Editar ${field}. Valor atual ${value}`}
      onClick={() => {
        committed.current = false;
        setDraft(String(value));
        setEditing(true);
      }}
    >
      <StatusBar theme={theme} neon={neon} type={type} value={value} maxValue={maxValue} height="15px" />
    </QuickResourceButton>
  );
};

const formatAlignment = (alignment?: string) => {
  if (!alignment?.trim()) return 'Não informado';

  return alignment
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' e ');
};

export const CharacterSelectionCard = ({
  personagem,
  status,
  level,
  xp,
  theme,
  neon,
  onView,
  onSheet,
  onEdit,
  onUpdateSystem,
  updatingSystem = false,
  selectionMode = false,
  selected = false,
  onToggleSelection,
  context = 'owner',
  ownerName,
  online = false,
  variant = 'default',
  onQuickStatusUpdate,
}: CharacterSelectionCardProps) => {
  const navigate = useNavigate();
  const [comparisonOpen, setComparisonOpen] = React.useState(false);
  const [editingXp, setEditingXp] = React.useState(false);
  const [xpDraft, setXpDraft] = React.useState(String(xp));
  const xpInputRef = React.useRef<HTMLInputElement | null>(null);
  const xpCommitted = React.useRef(false);
  const isMesaGame = variant === 'mesa-game';
  const Header = isMesaGame ? MesaGameCharacterHeader : CharacterHeader;
  const Statuses = isMesaGame ? MesaGameStatusColumn : StatusColumn;
  const Resource = isMesaGame ? MesaGameStatusItem : StatusItem;
  const embeddedRuntimeContext = personagem.sistemaRuntime;
  const {
    contexto: fetchedRuntimeContext,
    loading: runtimeLoading,
    error: runtimeError,
  } = useSistemaRuntimeContexto({
    idPersonagemJogador: personagem.idpersonagemJogador,
    idRaca: personagem.idraca,
    enabled: Boolean(personagem.idpersonagemJogador) && !embeddedRuntimeContext,
  });
  const runtimeContext = embeddedRuntimeContext ?? fetchedRuntimeContext;
  const comparisonCurrentCharacter = React.useMemo(() => createCharacterComparisonData({
    id: personagem.idpersonagemJogador,
    origem: 'Jogador',
    nome: personagem.nome,
    imagem: personagem.imagem,
    idMesa: personagem.idmesa,
    mesaNome: personagem.mesaNome,
    status: comparisonStatusFrom(personagem.statusJson, status, level, xp),
    quantidadeSkills: countSkills(personagem.skills),
    sistemaRuntime: runtimeContext,
  }), [level, personagem, runtimeContext, status, xp]);
  const runtimeHasNotice = !runtimeLoading && (
    !runtimeContext
    || Boolean(runtimeError)
    || !runtimeContext.idSistemaVersao
    || (runtimeContext.warnings?.length ?? 0) > 0
    || (runtimeContext.fallbacks?.length ?? 0) > 0
  );
  const {
    level: normalizedLevel,
    xp: normalizedXp,
    maximumLevel,
    isMaximumLevel,
    requiredXp,
    progress,
    readyToLevel,
  } = resolveCharacterProgression(level, xp, runtimeContext?.progressao);
  const proficiencies = personagem.proficiencias
    ?.map((proficiency) => proficiency.nome)
    .filter(Boolean)
    .join(', ');
  React.useEffect(() => setXpDraft(String(xp)), [xp]);
  React.useEffect(() => {
    if (!editingXp) return;
    xpInputRef.current?.focus();
    xpInputRef.current?.select();
  }, [editingXp]);
  const commitXp = () => {
    if (xpCommitted.current) return;
    xpCommitted.current = true;
    setEditingXp(false);
    const parsed = Number(xpDraft);
    if (!Number.isFinite(parsed)) return;
    const next = Math.max(0, Math.round(parsed));
    if (next !== xp) void onQuickStatusUpdate?.({ xp: next });
  };
  const openDevelopmentPage = (path: string, title: string, description: string) => {
    navigate(path, {
      state: {
        errorTitle: title,
        errorDescription: description,
      },
    });
  };

  return (
    <HudCard
      $neon={neon}
      $themeMode={theme}
      $mesaGame={isMesaGame}
      role={selectionMode ? 'checkbox' : undefined}
      aria-checked={selectionMode ? selected : undefined}
      tabIndex={selectionMode ? 0 : undefined}
      onClickCapture={(event) => {
        if (!selectionMode) return;
        event.preventDefault();
        event.stopPropagation();
        onToggleSelection?.();
      }}
      onKeyDown={(event) => {
        if (!selectionMode || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onToggleSelection?.();
      }}
    >
      <HudCornerEl $position="top-left" $neon={neon === 'on'} />
      <HudCornerEl $position="top-right" $neon={neon === 'on'} />
      <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
      <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
      <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
      <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
      <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
      <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
      {selectionMode && (
        <SelectionMarker $selected={selected} aria-hidden="true">
          {selected ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
        </SelectionMarker>
      )}
      {!selectionMode && (
        <CharacterComparisonButton
          absolute
          theme={theme}
          neon={neon}
          onClick={() => setComparisonOpen(true)}
        />
      )}
      <Header>
        <CharacterAvatar
          src={normalizeImagePath(personagem.imagem)}
          alt={`Imagem de ${personagem.nome || 'personagem'}`}
          $neon={neon}
          $themeMode={theme}
        />

        <Statuses>
          <CharacterName>{personagem.nome || 'Personagem sem nome'}</CharacterName>
          {context !== 'owner' && (
            <MesaContextMeta>
              <PresenceDot $online={online} aria-hidden="true" />
              <span>{online ? 'Online' : 'Offline'}</span>
              {ownerName && <span>Jogador: <strong>{ownerName}</strong></span>}
            </MesaContextMeta>
          )}
          {personagem.visivel === false && (
            <VisibilityState title="Apenas você e administradores podem ver esta ficha">
              <VisibilityOffOutlinedIcon aria-hidden="true" />
              Oculto para outros usuários
            </VisibilityState>
          )}
          <Resource>
            <StatusLabel>{getRuntimeResourceLabel(runtimeContext, 'vida', 'Vida')}</StatusLabel>
            <EditableResource field="vida" value={status.vida} maxValue={status.vidaMaxima || undefined} type="vida" theme={theme} neon={neon} onUpdate={onQuickStatusUpdate} compact={isMesaGame} />
          </Resource>
          <Resource>
            <StatusLabel>{getRuntimeResourceLabel(runtimeContext, 'mana', 'Mana')}</StatusLabel>
            <EditableResource field="mana" value={status.mana} maxValue={status.manaMaxima || undefined} type="mana" theme={theme} neon={neon} onUpdate={onQuickStatusUpdate} compact={isMesaGame} />
          </Resource>
          <Resource>
            <StatusLabel>{getRuntimeResourceLabel(runtimeContext, 'estamina', 'Estamina')}</StatusLabel>
            <EditableResource field="estamina" value={status.estamina} maxValue={status.estaminaMaxima || undefined} type="estamina" theme={theme} neon={neon} onUpdate={onQuickStatusUpdate} compact={isMesaGame} />
          </Resource>
        </Statuses>
      </Header>

      <InfoRow>
        <InfoItem type="button" onClick={() => navigate(`/raca/${personagem.idraca}`)}>
          <InfoIcon $icon={dnaIcon} />
          <span><InfoLabel>Raça</InfoLabel><InfoValue>{personagem.racaNome || 'Não informada'}</InfoValue></span>
        </InfoItem>
        <InfoItem type="button" onClick={() => personagem.idcidade
          ? navigate(`/cidade/${personagem.idcidade}`)
          : openDevelopmentPage('/cidade/sem-origem', 'Cidade não informada', 'Este personagem não possui uma cidade de origem cadastrada.')}
        >
          <InfoIcon $icon={villageIcon} />
          <span><InfoLabel>Cidade</InfoLabel><InfoValue>{personagem.cidadeNome || 'Sem origem'}</InfoValue></span>
        </InfoItem>
        <InfoItem type="button" onClick={() => openDevelopmentPage(`/sistema/alinhamento/${personagem.alinhamento || 'nao-informado'}`, 'Página de alinhamento ainda não disponível', 'A página dinâmica deste alinhamento está em desenvolvimento.')}>
          <InfoIcon $icon={scalesIcon} />
          <span><InfoLabel>Alinhamento</InfoLabel><InfoValue>{formatAlignment(personagem.alinhamento)}</InfoValue></span>
        </InfoItem>
      </InfoRow>

      <XpSection $ready={readyToLevel}>
        <LevelFlag type="button" onClick={() => openDevelopmentPage(`/sistema/nivel/${normalizedLevel}`, 'Página de nível ainda não disponível', 'A página dinâmica deste nível está em desenvolvimento.')}>
          Nível {Math.min(normalizedLevel, maximumLevel)}
        </LevelFlag>
        <ProgressBody>
          <ProgressHeader>
            {editingXp ? (
              <QuickXpInput
                ref={xpInputRef}
                type="number"
                min={0}
                value={xpDraft}
                aria-label="Editar XP atual"
                onChange={(event) => setXpDraft(event.target.value)}
                onBlur={commitXp}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitXp();
                  }
                  if (event.key === 'Escape') {
                    xpCommitted.current = true;
                    setXpDraft(String(xp));
                    setEditingXp(false);
                  }
                }}
              />
            ) : onQuickStatusUpdate ? (
              <QuickXpButton
                type="button"
                aria-label={`Editar XP. Valor atual ${normalizedXp}`}
                onClick={() => {
                  xpCommitted.current = false;
                  setXpDraft(String(xp));
                  setEditingXp(true);
                }}
              >
                {isMaximumLevel ? `${normalizedXp} XP · nível máximo` : `${normalizedXp} / ${requiredXp} XP`}
              </QuickXpButton>
            ) : (
              <span>{isMaximumLevel ? `${normalizedXp} XP · nível máximo` : `${normalizedXp} / ${requiredXp} XP`}</span>
            )}
          </ProgressHeader>
          <ProgressTrack aria-label="Progresso de experiência" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} role="progressbar">
            <ProgressFill $progress={progress} $ready={readyToLevel} />
          </ProgressTrack>
        </ProgressBody>
      </XpSection>

      <DetailsGrid>
        <DetailItem>
          <DetailLink type="button" onClick={() => navigate(`/mesa/${personagem.idmesa}`)}>
            <DetailLabel>Mesa</DetailLabel>
            <DetailValue>{personagem.mesaNome || 'Mesa não informada'}</DetailValue>
          </DetailLink>
        </DetailItem>
        <DetailItem>
          <DetailLink type="button" onClick={() => openDevelopmentPage('/sistema/proficiencias', 'Página de proficiências ainda não disponível', 'A página dinâmica de proficiências está em desenvolvimento.')}>
            <DetailLabel>Proficiências</DetailLabel>
            <ProficiencyValue>{proficiencies || 'Nenhuma proficiência registrada'}</ProficiencyValue>
          </DetailLink>
        </DetailItem>
      </DetailsGrid>

      {(runtimeHasNotice || runtimeContext?.atualizacaoDisponivel) && (
        <SystemRuntimeIndicator
          contexto={runtimeContext}
          error={runtimeError}
          onUpdate={onUpdateSystem}
          updating={updatingSystem}
        />
      )}

      <Actions>
        <ActionButton type="button" onClick={onView}><VisibilityIcon />Visualizar</ActionButton>
        {context !== 'mesa-other' && <ActionButton type="button" onClick={onSheet}><MenuBookIcon />Ficha</ActionButton>}
        {(context === 'owner' || context === 'mesa-own') && <ActionButton type="button" onClick={onEdit}><EditIcon />Editar</ActionButton>}
      </Actions>
      <CharacterComparisonModal
        open={comparisonOpen}
        current={comparisonCurrentCharacter}
        source="Jogador"
        sourceId={personagem.idpersonagemJogador}
        tableId={personagem.idmesa}
        onClose={() => setComparisonOpen(false)}
        theme={theme}
        neon={neon}
      />
    </HudCard>
  );
};
