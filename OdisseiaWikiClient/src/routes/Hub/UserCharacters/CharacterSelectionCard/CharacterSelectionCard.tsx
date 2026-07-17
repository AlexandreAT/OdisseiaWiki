import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useNavigate } from 'react-router-dom';
import dnaIcon from '../../../../assets/svg/dna1.svg';
import scalesIcon from '../../../../assets/svg/scales.svg';
import villageIcon from '../../../../assets/svg/village.svg';
import { StatusBar } from '../../../../components/Generic/StatusBar/StatusBar';
import { PersonagemJogador, StatusBase } from '../../../../models/PersonagemJogador';
import {
  HudBottomLine,
  HudCornerEl,
  HudLeftLine,
  HudRightLine,
  HudTopLine,
} from '../../../Personagem/PersonagemPage.style';
import {
  DEFAULT_MAX_CHARACTER_LEVEL,
  getDefaultXpRequiredForLevel,
} from '../../../../utils/characterProgression';
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
  ProgressBody,
  ProgressFill,
  ProgressHeader,
  ProgressTrack,
  ProficiencyValue,
  SelectionMarker,
  StatusColumn,
  StatusItem,
  StatusLabel,
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
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: () => void;
}

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
  selectionMode = false,
  selected = false,
  onToggleSelection,
}: CharacterSelectionCardProps) => {
  const navigate = useNavigate();
  const normalizedLevel = Math.max(1, Math.trunc(Number(level) || 1));
  const normalizedXp = Math.max(0, Number(xp) || 0);
  const isMaximumLevel = normalizedLevel >= DEFAULT_MAX_CHARACTER_LEVEL;
  const requiredXp = getDefaultXpRequiredForLevel(normalizedLevel);
  const progress = isMaximumLevel
    ? 100
    : Math.min(100, Math.max(0, (normalizedXp / Math.max(requiredXp, 1)) * 100));
  const readyToLevel = !isMaximumLevel && normalizedXp >= requiredXp;
  const proficiencies = personagem.proficiencias
    ?.map((proficiency) => proficiency.nome)
    .filter(Boolean)
    .join(', ');
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
      <CharacterHeader>
        <CharacterAvatar
          src={personagem.imagem}
          alt={`Imagem de ${personagem.nome || 'personagem'}`}
          $neon={neon}
          $themeMode={theme}
        />

        <StatusColumn>
          <CharacterName>{personagem.nome || 'Personagem sem nome'}</CharacterName>
          <StatusItem>
            <StatusLabel>Vida</StatusLabel>
            <StatusBar theme={theme} neon={neon} type="vida" value={status.vida} maxValue={status.vidaMaxima || undefined} height="18px" />
          </StatusItem>
          <StatusItem>
            <StatusLabel>Mana</StatusLabel>
            <StatusBar theme={theme} neon={neon} type="mana" value={status.mana} maxValue={status.manaMaxima || undefined} height="18px" />
          </StatusItem>
          <StatusItem>
            <StatusLabel>Estamina</StatusLabel>
            <StatusBar theme={theme} neon={neon} type="estamina" value={status.estamina} maxValue={status.estaminaMaxima || undefined} height="18px" />
          </StatusItem>
        </StatusColumn>
      </CharacterHeader>

      <InfoRow>
        <InfoItem type="button" onClick={() => openDevelopmentPage(`/raca/${personagem.idraca}`, 'Página de raça ainda não disponível', 'A página dinâmica desta raça está em desenvolvimento.')}>
          <InfoIcon $icon={dnaIcon} />
          <span><InfoLabel>Raça</InfoLabel><InfoValue>{personagem.racaNome || 'Não informada'}</InfoValue></span>
        </InfoItem>
        <InfoItem type="button" onClick={() => openDevelopmentPage(`/cidade/${personagem.idcidade ?? 'sem-origem'}`, 'Página de cidade ainda não disponível', 'A página dinâmica desta cidade está em desenvolvimento.')}>
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
          Nível {Math.min(normalizedLevel, DEFAULT_MAX_CHARACTER_LEVEL)}
        </LevelFlag>
        <ProgressBody>
          <ProgressHeader>
          <span>{isMaximumLevel ? `${normalizedXp} XP · nível máximo` : `${normalizedXp} / ${requiredXp} XP`}</span>
          </ProgressHeader>
          <ProgressTrack aria-label="Progresso de experiência" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} role="progressbar">
            <ProgressFill $progress={progress} $ready={readyToLevel} />
          </ProgressTrack>
        </ProgressBody>
      </XpSection>

      <DetailsGrid>
        <DetailItem>
          <DetailLink type="button" onClick={() => openDevelopmentPage(`/mesa/${personagem.idmesa}`, 'Página de mesa ainda não disponível', 'A página dinâmica desta mesa está em desenvolvimento.')}>
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

      <Actions>
        <ActionButton type="button" onClick={onView}><VisibilityIcon />Visualizar</ActionButton>
        <ActionButton type="button" onClick={onSheet}><MenuBookIcon />Ficha</ActionButton>
        <ActionButton type="button" onClick={onEdit}><EditIcon />Editar</ActionButton>
      </Actions>
    </HudCard>
  );
};
