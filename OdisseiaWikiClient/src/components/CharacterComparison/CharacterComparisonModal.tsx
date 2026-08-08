import React from 'react';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import StorageIcon from '@mui/icons-material/Storage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Modal } from '../Generic/Modal/Modal';
import { Search } from '../Generic/Search/Search';
import { LoadingIndicator } from '../Generic/LoadingIndicator';
import { normalizeImagePath } from '../../routes/Wiki/utils/imagePathHelper';
import {
  HudBottomLine,
  HudCornerEl,
  HudLeftLine,
  HudRightLine,
  HudTopLine,
} from '../../routes/Personagem/PersonagemPage.style';
import { CharacterComparisonData, CharacterComparisonModalProps } from './CharacterComparison.types';
import { useCharacterComparison } from './useCharacterComparison';
import { CharacterRadarChart } from './CharacterRadarChart';
import {
  Avatar,
  CardEyebrow,
  CharacterCard,
  ComparisonGrid,
  ComparisonHeader,
  ComparisonRoot,
  DefenseRow,
  DeltaText,
  EmptyCandidate,
  ErrorState,
  Identity,
  IdentityText,
  ModalTitle,
  PreviewButton,
  RuntimeNotice,
  RuntimeWarning,
  SearchArea,
  SearchFeedback,
  SummaryGrid,
  SummaryItem,
  SystemLine,
} from './CharacterComparison.style';
import {
  formatComparisonDelta,
  formatNumber,
  getCharacterSystemLabel,
  hasDifferentRuntime,
} from './characterComparison.utils';

interface CardProps {
  character: CharacterComparisonData;
  current: CharacterComparisonData;
  candidate?: CharacterComparisonData | null;
  focus: 'current' | 'candidate';
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const Delta = ({ value, other }: { value: number; other?: number }) => {
  const delta = formatComparisonDelta(value, other);
  return delta ? <DeltaText $kind={delta.kind}>{delta.label}</DeltaText> : null;
};

const CharacterHudFrame = ({ candidate, neon }: { candidate: boolean; neon: boolean }) => {
  const color = candidate ? 'var(--neonPink)' : 'var(--neonBlue)';
  const clearColor = candidate ? 'var(--clearneonPink)' : 'var(--clearneonBlue)';
  const shared = { $color: color, $clearColor: clearColor, $neon: neon };

  return (
    <>
      <HudCornerEl $position="top-left" {...shared} />
      <HudCornerEl $position="top-right" {...shared} />
      <HudCornerEl $position="bottom-left" {...shared} />
      <HudCornerEl $position="bottom-right" {...shared} />
      <HudTopLine $isActive={neon} {...shared} />
      <HudBottomLine $isActive={neon} {...shared} />
      <HudLeftLine $isActive={neon} {...shared} />
      <HudRightLine $isActive={neon} {...shared} />
    </>
  );
};

const CharacterCardContent = ({ character, current, candidate, focus, theme, neon }: CardProps) => {
  const other = focus === 'current' ? candidate : current;
  const isCandidate = focus === 'candidate';
  const runtimeUnavailable = !character.sistemaRuntime?.idSistemaVersao
    || character.sistemaRuntime.usaFallbackLegado;
  const runtimeDifferent = Boolean(candidate && hasDifferentRuntime(current, candidate));

  return (
    <CharacterCard $candidate={isCandidate} $theme={theme} $neon={neon === 'on'}>
      <CharacterHudFrame candidate={isCandidate} neon={neon === 'on'} />
      <CardEyebrow $candidate={isCandidate}>{isCandidate ? 'Personagem comparado' : 'Personagem atual'}</CardEyebrow>
      <Identity>
        <Avatar
          $candidate={isCandidate}
          $neon={neon === 'on'}
          src={normalizeImagePath(character.imagem)}
          alt={`Imagem de ${character.nome}`}
        />
        <IdentityText $theme={theme} $candidate={isCandidate}>
          <h3>{character.nome}</h3>
          <SystemLine>
            <StorageIcon aria-hidden="true" />
            <span><b>Sistema:</b> {getCharacterSystemLabel(character)}</span>
            <i>•</i>
            <span>v{character.sistemaRuntime?.numeroVersao || '—'}</span>
            <i>•</i>
            <span>{character.mesaNome || (character.origem === 'Npc' ? 'Wiki / NPC' : 'Mesa não informada')}</span>
          </SystemLine>
          {(runtimeUnavailable || runtimeDifferent) && (
            <RuntimeWarning $different={!runtimeUnavailable && runtimeDifferent}>
              <WarningAmberIcon aria-hidden="true" />
              {runtimeUnavailable ? 'Sistema/versão indisponível' : 'Sistema/versão diferente'}
            </RuntimeWarning>
          )}
        </IdentityText>
      </Identity>

      <CharacterRadarChart
        current={current}
        candidate={candidate}
        focus={focus}
        theme={theme}
        neon={neon}
      />

      <SummaryGrid>
        <SummaryItem>
          <small>Nível</small>
          <strong>{formatNumber(character.status.nivel)}</strong>
          <Delta value={character.status.nivel} other={other?.status.nivel} />
        </SummaryItem>
        <SummaryItem>
          <small>Skills</small>
          <strong>{formatNumber(character.quantidadeSkills)}</strong>
          <Delta value={character.quantidadeSkills} other={other?.quantidadeSkills} />
        </SummaryItem>
        <SummaryItem>
          <small>Defesas</small>
          <DefenseRow>
            {(['escudo', 'protecao', 'armadura', 'outras'] as const).map((key) => (
              <span key={key}>
                {key === 'protecao' ? 'Proteção' : key.charAt(0).toUpperCase() + key.slice(1)}
                <b>{formatNumber(character.status[key])}</b>
                <Delta value={character.status[key]} other={other?.status[key]} />
              </span>
            ))}
          </DefenseRow>
        </SummaryItem>
      </SummaryGrid>
    </CharacterCard>
  );
};

export const CharacterComparisonModal = ({
  open,
  current,
  source,
  sourceId,
  tableId,
  onClose,
  theme,
  neon,
}: CharacterComparisonModalProps) => {
  const {
    currentCharacter,
    candidate,
    query,
    results,
    loadingCurrent,
    searching,
    error,
    setQuery,
    selectCandidate,
  } = useCharacterComparison({ open, current, source, sourceId, tableId });

  const suggestions = React.useMemo(() => results.map((result) => {
    const context = result.origem === 'Npc' ? 'NPC visível' : result.mesaNome || 'Personagem de jogador';
    return `${result.origem}:${result.id}|${result.nome} · ${context}`;
  }), [results]);

  const handleSuggestion = React.useCallback((suggestion: string) => {
    const key = suggestion.slice(0, suggestion.indexOf('|'));
    const [resultSource, resultId] = key.split(':');
    const selected = results.find((result) => (
      result.origem === resultSource && String(result.id) === resultId
    ));
    if (selected) selectCandidate(selected);
  }, [results, selectCandidate]);

  if (!open) return null;

  const openCharacter = () => {
    if (!currentCharacter?.id) return;
    const playerQuery = currentCharacter.origem === 'Jogador' ? '?tipo=jogador' : '';
    window.open(`/personagem/${currentCharacter.id}${playerQuery}`, '_blank', 'noopener,noreferrer');
  };

  const hasNoSearchResult = query.trim().length >= 2
    && !searching
    && results.length === 0
    && (!candidate || candidate.nome.toLocaleLowerCase('pt-BR') !== query.trim().toLocaleLowerCase('pt-BR'));

  return (
    <Modal
      title={(
        <ComparisonHeader>
          <ModalTitle $theme={theme} $neon={neon === 'on'}>
            <CompareArrowsIcon aria-hidden="true" />
            Comparar personagem
            {currentCharacter && (
              <span className="comparison-character-name"> — {currentCharacter.nome}</span>
            )}
          </ModalTitle>
          {currentCharacter?.id && (
            <PreviewButton
              type="button"
              $theme={theme}
              $neon={neon === 'on'}
              onClick={openCharacter}
              title="Abrir ficha em nova guia"
              aria-label="Abrir ficha em nova guia"
            >
              <VisibilityIcon />
            </PreviewButton>
          )}
        </ComparisonHeader>
      )}
      theme={theme}
      neon={neon}
      width="1400px"
      mobileInset
      showFooter={false}
      onClose={onClose}
    >
      <ComparisonRoot $theme={theme} $neon={neon === 'on'}>
        <SearchArea>
          <Search
            theme={theme}
            neon={neon}
            label="Buscar personagem para comparar..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            icon={<SearchIcon />}
            width="100%"
            suggestions={suggestions}
            onSelectSuggestion={handleSuggestion}
            loading={searching}
            portal
          />
          {hasNoSearchResult && <SearchFeedback>Nenhum personagem válido encontrado.</SearchFeedback>}
        </SearchArea>

        {error && <ErrorState>{error}</ErrorState>}
        {loadingCurrent && <SearchFeedback><LoadingIndicator label="Carregando personagem" /></SearchFeedback>}

        {!loadingCurrent && currentCharacter && (
          <ComparisonGrid>
            <CharacterCardContent
              character={currentCharacter}
              current={currentCharacter}
              candidate={candidate}
              focus="current"
              theme={theme}
              neon={neon}
            />
            {candidate ? (
              <CharacterCardContent
                character={candidate}
                current={currentCharacter}
                candidate={candidate}
                focus="candidate"
                theme={theme}
                neon={neon}
              />
            ) : (
              <CharacterCard $candidate $theme={theme} $neon={neon === 'on'}>
                <CharacterHudFrame candidate neon={neon === 'on'} />
                <CardEyebrow $candidate>Personagem comparado</CardEyebrow>
                <EmptyCandidate>
                  <CompareArrowsIcon aria-hidden="true" />
                  <strong>Selecione outro personagem</strong>
                  <span>Os atributos serão sobrepostos no mesmo gráfico para evidenciar as diferenças.</span>
                </EmptyCandidate>
              </CharacterCard>
            )}
          </ComparisonGrid>
        )}

        {currentCharacter && (
          <RuntimeNotice>
            <InfoOutlinedIcon aria-hidden="true" />
            <span>Valores exibidos com base na ficha e na versão do Sistema registrada em cada personagem.</span>
          </RuntimeNotice>
        )}
      </ComparisonRoot>
    </Modal>
  );
};
