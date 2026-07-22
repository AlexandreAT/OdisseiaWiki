import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { ReactNode } from 'react';
import {
  BiBarChartAlt2,
  BiBody,
  BiBoltCircle,
  BiBookOpen,
  BiChip,
  BiCrosshair,
  BiCube,
  BiDroplet,
  BiErrorAlt,
  BiHide,
  BiImage,
  BiInfoCircle,
  BiLayer,
  BiPackage,
  BiPlusMedical,
  BiPulse,
  BiShield,
  BiStar,
  BiTachometer,
  BiTargetLock,
  BiTimer,
  BiWrench,
} from 'react-icons/bi';
import { useSelector } from 'react-redux';
import backgroundVideo from '../../assets/backgroundLinesScifiAnimation.mp4';
import { OdisseiaAnimatedTitle } from '../../components/Generic/OdisseiaAnimatedTitle';
import { Modal } from '../../components/Generic/Modal/Modal';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import {
  ARMA_DAMAGE_FALLBACK_CONFIG,
  ARMA_DAMAGE_DISPLAY_CONFIG,
  ARMA_TIPO_DANO_OPTIONS,
  ARMA_TIPO_OPTIONS,
  ITEM_TIPO_OPTIONS,
  normalizeArmaTipo,
  normalizeDadoAcerto,
  normalizeTrajeTipo,
  TRAJE_TIPO_OPTIONS,
  type ArmaDamageField,
} from '../../constants';
import {
  AcessorioAtributos,
  ArmaAtributos,
  ConsumiveisAtributos,
  ImplanteAtributos,
  Item,
  OutrosAtributos,
  TrajeAtributos,
} from '../../models/Itens';
import {
  BackgroundOverlay,
  BackgroundVideo,
  BackgroundVideoContainer,
  HistoryModalClose,
  HistoryModalContent,
  HistoryModalHeader,
  HistoryModalOverlay,
  HistoryModalSheet,
  HistoryModalTitle,
} from '../Personagem/PersonagemPage.style';
import { WikiSearchLoading } from '../Wiki/components/WikiSearchLoading/WikiSearchLoading';
import { Lightbox } from '../Wiki/components/blocks/shared/Lightbox/Lightbox';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import {
  BackToWikiLink,
  CityModalTitle,
  ContentGrid,
  DescriptionButton,
  EnhancementCard,
  EnhancementGrid,
  EffectPreview,
  FactLabel,
  FactText,
  FactValue,
  HeroGrid,
  HeroPanel,
  ItemHudCornerAccent,
  ItemHudBorderLine,
  ItemCreationDate,
  ItemIdentity,
  ItemImage,
  ItemImageButton,
  ItemPageContent,
  ItemPageRoot,
  ItemPanel,
  ItemPanelTitle,
  ItemRevealBlock,
  ItemTag,
  ItemTagList,
  ItemTitleSlot,
  MetricFill,
  MetricGroup,
  MetricHeading,
  MetricLabel,
  MetricReferenceMarker,
  MetricReferenceTooltip,
  MetricRow,
  MetricTrack,
  MetricValue,
  ModalDescription,
  PageState,
  PanelHeader,
  QuickFact,
  QuickFacts,
  RelatedPageLink,
  RelatedPages,
  RelatedPagesTitle,
  SummaryContent,
  SummaryText,
  TechCard,
  TechGrid,
  TechIcon,
  TechLabel,
  TechnicalArea,
  TechnicalTitle,
  TechValue,
  TextList,
  TextListButton,
} from './ItemPage.style';
import { useItemPage } from './useItemPage';

interface ThemeReducerState {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface RootThemeState {
  themesReducer: ThemeReducerState;
}

interface MetricData {
  label: string;
  value: number;
  maximum: number;
  referenceMaximum?: number;
  referenceDescription?: string;
  showPlus?: boolean;
  accent?: 'pink' | 'purple' | 'green';
}

const DAMAGE_LABELS: Record<ArmaDamageField, string> = {
  base: 'Base',
  curta: 'Curto',
  media: 'Médio',
  longa: 'Longo',
  emArea: 'Em área',
  preciso: 'Preciso',
};

type ImplantBonusKey = keyof NonNullable<ImplanteAtributos['bonus']>;

const IMPLANT_BONUS_SCALE: Record<ImplantBonusKey, number> = {
  vida: 1000,
  estamina: 100,
  mana: 100,
  resistencia: 6,
  forca: 6,
  agilidade: 6,
  precisao: 6,
  sabedoria: 6,
};

const IMPLANT_BONUS_COMMON_BY_BODY_PART: Record<
  NonNullable<ImplanteAtributos['parteCorpo']>,
  Partial<Record<ImplantBonusKey, number>>
> = {
  mao: { vida: 100, estamina: 10, mana: 10 },
  braco: { vida: 200, estamina: 20, mana: 20, forca: 1, agilidade: 1 },
  pe: { vida: 100, estamina: 10, mana: 10 },
  perna: { vida: 150, estamina: 30, mana: 20, agilidade: 1 },
  corpo: { vida: 200, estamina: 30, mana: 30, resistencia: 1 },
  ocular: { agilidade: 1, precisao: 1 },
  outro: {},
};

const IMPLANT_BONUS_COMMON_FALLBACK: Record<ImplantBonusKey, number> = {
  vida: 200,
  estamina: 30,
  mana: 30,
  resistencia: 1,
  forca: 1,
  agilidade: 1,
  precisao: 1,
  sabedoria: 1,
};

interface FramedPanelProps {
  title: string;
  icon: ReactNode;
  neon: boolean;
  children: ReactNode;
  accent?: 'gold';
}

const OUTFIT_DEFENSE_REFERENCES = {
  colete: { protecao: 800, escudo: 0, armadura: 0 },
  traje: { protecao: 800, escudo: 0, armadura: 200 },
  armor_core: { protecao: 1200, escudo: 0, armadura: 300 },
} as const;

const formatCyberpunkTitle = (value: string) => (
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
);

const formatValue = (value: number) => (
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)
);

const formatSignedValue = (value: number) => (
  `${value > 0 ? '+' : ''}${formatValue(value)}`
);

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('pt-BR').format(date);
};

const hasText = (value: unknown): value is string => (
  typeof value === 'string' && value.trim().length > 0
);

const hasNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value !== 0
);

const textList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(String).map((entry) => entry.trim()).filter(Boolean);
  }
  return hasText(value) ? [value.trim()] : [];
};

const optionLabel = <T extends string>(
  value: T | undefined,
  options: Array<{ value: T; label: string }>
) => options.find((option) => option.value === value)?.label;

const compactWeaponLabel = (label?: string) => label
  ?.replace(/^Arma de fogo\s+—\s+/i, '')
  .replace(/^Arma branca\s+—\s+/i, 'Arma ')
  .replace(/^Corpo a corpo\s+—\s+/i, '')
  .replace(/^Arma pesada\s+—\s+/i, 'Pesada: ');

const humanize = (value: unknown) => {
  if (!hasText(value)) return undefined;
  const normalized = value.replace(/[-_]/g, ' ');
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const uniqueTags = (item: Item, typeLabel: string, extraTags: string[] = []) => (
  ['Item', typeLabel, ...extraTags, ...(item.tags ?? [])].filter((tag, index, tags) => (
    tags.findIndex((candidate) => candidate.localeCompare(tag, 'pt-BR', { sensitivity: 'base' }) === 0) === index
  ))
);

const getTagRarity = (tag: string): 'unique' | 'legendary' | undefined => {
  const normalizedTag = formatCyberpunkTitle(tag).toLocaleLowerCase('pt-BR').trim();

  if (/\blendari[oa]s?\b/.test(normalizedTag)) return 'legendary';
  if (/\bunic[oa]s?\b/.test(normalizedTag)) return 'unique';

  return undefined;
};

const HudCorners = ({ neon, accent }: { neon: boolean; accent?: 'gold' }) => (
  <>
    <ItemHudCornerAccent $position="top-right" $neon={neon} $accent={accent} aria-hidden="true" />
    <ItemHudCornerAccent $position="bottom-left" $neon={neon} $accent={accent} aria-hidden="true" />
    {neon && <>
      <ItemHudCornerAccent $position="top-left" $neon $accent={accent} aria-hidden="true" />
      <ItemHudCornerAccent $position="bottom-right" $neon $accent={accent} aria-hidden="true" />
    </>}
    <ItemHudBorderLine $position="top" $isActive={neon} $accent={accent} aria-hidden="true" />
    <ItemHudBorderLine $position="right" $isActive={neon} $accent={accent} aria-hidden="true" />
    <ItemHudBorderLine $position="bottom" $isActive={neon} $accent={accent} aria-hidden="true" />
    <ItemHudBorderLine $position="left" $isActive={neon} $accent={accent} aria-hidden="true" />
  </>
);

const FramedPanel = ({ title, icon, neon, children, accent }: FramedPanelProps) => (
  <ItemPanel $neon={neon} $accent={accent}>
    <HudCorners neon={neon} accent={accent} />
    <PanelHeader>
      <ItemPanelTitle $neon={neon} $accent={accent}>{icon}{title}</ItemPanelTitle>
    </PanelHeader>
    {children}
  </ItemPanel>
);

const Metrics = ({ title, values }: { title: string; values: MetricData[] }) => {
  return (
    <MetricGroup>
      <MetricHeading>{title}</MetricHeading>
      {values.map((metric) => {
        const absoluteValue = Math.abs(metric.value);
        const percentage = (absoluteValue / metric.maximum) * 100;
        const referenceMarker = metric.referenceMaximum !== undefined
          ? (metric.referenceMaximum / metric.maximum) * 100
          : undefined;
        const state = absoluteValue > metric.maximum
          ? 'overflow'
          : metric.referenceMaximum !== undefined && absoluteValue > metric.referenceMaximum
            ? 'exceptional'
            : 'normal';
        const referenceDescription = metric.referenceMaximum !== undefined
          ? metric.referenceDescription
            ?? `Maior valor comum desta categoria: ${formatValue(metric.referenceMaximum)}.`
          : undefined;

        return (
          <MetricRow key={metric.label}>
            <MetricLabel>
              <span>{metric.label}</span>
              <small>escala {formatValue(metric.maximum)}</small>
            </MetricLabel>
            <MetricTrack
              role="progressbar"
              aria-label={metric.label}
              aria-valuemin={0}
              aria-valuemax={metric.maximum}
              aria-valuenow={Math.min(absoluteValue, metric.maximum)}
              aria-valuetext={`${formatValue(metric.value)} de ${formatValue(metric.maximum)}`}
            >
              <MetricFill
                $percentage={percentage}
                $accent={metric.accent}
                $state={state}
              />
              {referenceMarker !== undefined && referenceDescription && (
                <MetricReferenceMarker
                  $percentage={referenceMarker}
                  $alignment={referenceMarker >= 80 ? 'right' : referenceMarker <= 20 ? 'left' : 'center'}
                  data-alignment={referenceMarker >= 80 ? 'right' : referenceMarker <= 20 ? 'left' : 'center'}
                  tabIndex={0}
                  aria-label={referenceDescription}
                >
                  <MetricReferenceTooltip role="tooltip">
                    {referenceDescription}
                  </MetricReferenceTooltip>
                </MetricReferenceMarker>
              )}
            </MetricTrack>
            <MetricValue $state={state}>
              <span>{metric.showPlus && metric.value > 0 ? '+' : ''}{formatValue(metric.value)}</span>
              <small>/ {formatValue(metric.maximum)}</small>
            </MetricValue>
          </MetricRow>
        );
      })}
    </MetricGroup>
  );
};

const TechnicalCard = ({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) => (
  <TechCard>
    {icon && <TechIcon aria-hidden="true">{icon}</TechIcon>}
    <TechLabel>{label}</TechLabel>
    <TechValue>{value}</TechValue>
  </TechCard>
);

const ItemPage = () => {
  const { theme, neon } = useSelector<RootThemeState, ThemeReducerState>(
    (state) => state.themesReducer
  );
  const {
    item,
    relatedPages,
    loading,
    error,
    activeModal,
    selectedDetail,
    imageOpen,
    hasDescription,
    setActiveModal,
    closeModal,
    setSelectedDetail,
    closeDetail,
    setImageOpen,
  } = useItemPage();

  const isNeonActive = neon === 'on';
  const renderBackground = () => (
    <BackgroundVideoContainer>
      <BackgroundVideo src={backgroundVideo} autoPlay loop muted playsInline />
      <BackgroundOverlay />
    </BackgroundVideoContainer>
  );

  if (loading) {
    return (
      <ItemPageRoot>
        {renderBackground()}
        <PageState><WikiSearchLoading label="Carregando item" /></PageState>
      </ItemPageRoot>
    );
  }

  if (error || !item) {
    return (
      <ItemPageRoot>
        {renderBackground()}
        <PageState>
          <h1>Item não encontrado</h1>
          <p>{error ?? 'Não foi possível encontrar os dados deste item.'}</p>
          <BackToWikiLink to="/wiki/search?type=items">Voltar para itens</BackToWikiLink>
        </PageState>
      </ItemPageRoot>
    );
  }

  const typeLabel = ITEM_TIPO_OPTIONS.find((option) => option.value === item.tipo)?.label ?? 'Item';
  const attributes = item.atributos ?? {};
  const outfitType = item.tipo === 'traje'
    ? normalizeTrajeTipo((attributes as TrajeAtributos).tipoTraje)
    : undefined;
  const outfitTypeLabel = optionLabel(outfitType, TRAJE_TIPO_OPTIONS);
  const tags = uniqueTags(item, typeLabel, outfitTypeLabel ? [outfitTypeLabel] : []);
  const effect = hasText(attributes.efeito) ? attributes.efeito : item.efeito;

  const openDetail = (title: string, description: string, label?: string) => {
    setSelectedDetail({ title, description, label });
  };

  const renderQuickFacts = () => (
    <QuickFacts>
      <QuickFact>
        <BiPackage aria-hidden="true" />
        <FactText><FactLabel>Espaço ocupado</FactLabel><FactValue>{formatValue(item.peso ?? 0)}</FactValue></FactText>
      </QuickFact>
      <QuickFact>
        <BiHide aria-hidden="true" />
        <FactText><FactLabel>Discrição</FactLabel><FactValue>{formatSignedValue(item.discricao ?? 0)}</FactValue></FactText>
      </QuickFact>
      <QuickFact>
        <BiCube aria-hidden="true" />
        <FactText><FactLabel>Quantidade</FactLabel><FactValue>{item.quantidade}</FactValue></FactText>
      </QuickFact>
      {hasText(effect) && (
        <QuickFact
          as="button"
          type="button"
          $fullWidth
          $interactive
          onClick={() => openDetail('Efeito', effect, 'Efeito')}
          aria-label={`Abrir efeito completo de ${item.nome}`}
        >
          <BiPulse aria-hidden="true" />
          <FactText><FactLabel>Efeito</FactLabel><EffectPreview>{effect}</EffectPreview></FactText>
        </QuickFact>
      )}
    </QuickFacts>
  );

  const renderWeaponTechnical = () => {
    const weapon = attributes as ArmaAtributos;
    const normalizedWeaponType = normalizeArmaTipo(
      weapon.tipoArma ?? (weapon as ArmaAtributos & { TipoArma?: unknown }).TipoArma
    );
    const damageByField: Record<ArmaDamageField, number | undefined> = {
      base: weapon.danoBase,
      curta: weapon.danoPorAlcance?.curta,
      media: weapon.danoPorAlcance?.media,
      longa: weapon.danoPorAlcance?.longa,
      emArea: weapon.danoPorAlcance?.emArea,
      preciso: weapon.danoPorAlcance?.preciso,
    };
    const damageConfig = normalizedWeaponType
      ? ARMA_DAMAGE_DISPLAY_CONFIG[normalizedWeaponType]
      : ARMA_DAMAGE_FALLBACK_CONFIG;
    const damageValues: MetricData[] = damageConfig.fields.flatMap((field, index) => {
      const value = damageByField[field];
      if (!hasNumber(value)) return [];

      const referenceMaximum = damageConfig.commonMaximumByField?.[field]
        ?? damageConfig.commonMaximum;

      return [{
        label: DAMAGE_LABELS[field],
        value,
        maximum: damageConfig.scaleMaximumByField?.[field] ?? damageConfig.scaleMaximum,
        referenceMaximum,
        referenceDescription: referenceMaximum !== undefined
          ? `Maior dano comum desta categoria em alcance ${DAMAGE_LABELS[field].toLocaleLowerCase('pt-BR')}: ${formatValue(referenceMaximum)}.`
          : undefined,
        accent: index % 2 === 0 ? 'pink' as const : 'purple' as const,
      }];
    });
    const cadence = weapon.cadencia ?? weapon.ataquesPorTurno;
    const ammunition = weapon.capacidadeMunicao ?? weapon.municao?.capacidade;
    const weaponTypeLabel = optionLabel(normalizedWeaponType, ARMA_TIPO_OPTIONS);
    const compactWeaponTypeLabel = compactWeaponLabel(weaponTypeLabel) ?? weaponTypeLabel;
    const classificationCards = [
      compactWeaponTypeLabel && {
        label: 'Tipo de arma', value: compactWeaponTypeLabel, icon: <BiTargetLock />,
      },
      optionLabel(weapon.tipoDano, ARMA_TIPO_DANO_OPTIONS) && {
        label: 'Tipo de dano', value: optionLabel(weapon.tipoDano, ARMA_TIPO_DANO_OPTIONS), icon: <BiCrosshair />,
      },
    ].filter(Boolean) as Array<{ label: string; value: ReactNode; icon: ReactNode }>;
    const operationalCards = [
      hasText(weapon.acerto) && {
        label: 'Dado de acerto',
        value: normalizeDadoAcerto(weapon.acerto) || weapon.acerto,
        icon: <BiTargetLock />,
      },
      hasNumber(cadence) && { label: 'Cadência', value: `${cadence}/turno`, icon: <BiTachometer /> },
      hasNumber(weapon.capacidadeUso) && { label: 'Usos até pausa', value: weapon.capacidadeUso, icon: <BiTimer /> },
      hasNumber(ammunition) && { label: 'Munição', value: ammunition, icon: <BiPackage /> },
      hasNumber(weapon.gastoEstaminaPorAtaque) && {
        label: 'Estamina por ação', value: weapon.gastoEstaminaPorAtaque, icon: <BiBoltCircle />,
      },
      hasText(weapon.duracaoEfeito) && { label: 'Duração', value: weapon.duracaoEfeito, icon: <BiTimer /> },
    ].filter(Boolean) as Array<{ label: string; value: ReactNode; icon: ReactNode }>;
    const hasTechnicalCards = classificationCards.length > 0 || operationalCards.length > 0;

    return (damageValues.length > 0 || hasTechnicalCards) ? (
      <TechnicalArea>
        <TechnicalTitle><BiBarChartAlt2 aria-hidden="true" />Atributos técnicos</TechnicalTitle>
        {damageValues.length > 0 && <Metrics title="Dano" values={damageValues} />}
        {classificationCards.length > 0 && (
          <TechGrid $columns={classificationCards.length}>
            {classificationCards.map((card) => <TechnicalCard key={card.label} {...card} />)}
          </TechGrid>
        )}
        {operationalCards.length > 0 && (
          <TechGrid $columns={Math.min(4, operationalCards.length)}>
            {operationalCards.map((card) => <TechnicalCard key={card.label} {...card} />)}
          </TechGrid>
        )}
      </TechnicalArea>
    ) : null;
  };

  const renderOutfitTechnical = () => {
    const outfit = attributes as TrajeAtributos;
    const normalizedOutfitType = normalizeTrajeTipo(outfit.tipoTraje);
    const references = normalizedOutfitType
      ? OUTFIT_DEFENSE_REFERENCES[normalizedOutfitType]
      : undefined;
    const referenceLabel = optionLabel(normalizedOutfitType, TRAJE_TIPO_OPTIONS)?.toLocaleLowerCase('pt-BR');
    const defenseValues: MetricData[] = [
      {
        label: 'Proteção',
        value: hasNumber(outfit.protecaoBase) ? outfit.protecaoBase : 0,
        maximum: 1200,
        referenceMaximum: references?.protecao,
        referenceDescription: references
          ? `Maior proteção conhecida para ${referenceLabel}: ${formatValue(references.protecao)}.`
          : undefined,
        accent: 'pink',
      },
      {
        label: 'Escudo',
        value: hasNumber(outfit.escudoBase) ? outfit.escudoBase : 0,
        maximum: 3000,
        referenceMaximum: references?.escudo,
        referenceDescription: references
          ? `Maior escudo conhecido para ${referenceLabel}: ${formatValue(references.escudo)}.`
          : undefined,
      },
      {
        label: 'Armadura',
        value: hasNumber(outfit.armaduraBase) ? outfit.armaduraBase : 0,
        maximum: 500,
        referenceMaximum: references?.armadura,
        referenceDescription: references
          ? `Maior armadura conhecida para ${referenceLabel}: ${formatValue(references.armadura)}.`
          : undefined,
        accent: 'purple',
      },
    ];

    return (
      <TechnicalArea>
        <TechnicalTitle><BiShield aria-hidden="true" />Defesa</TechnicalTitle>
        {outfitTypeLabel && (
          <TechGrid $columns={1}>
            <TechnicalCard label="Subcategoria" value={outfitTypeLabel} icon={<BiShield />} />
          </TechGrid>
        )}
        <Metrics title="Valores defensivos" values={defenseValues} />
      </TechnicalArea>
    );
  };

  const renderConsumableTechnical = () => {
    const consumable = attributes as ConsumiveisAtributos;
    const restoreValues: MetricData[] = [
      ['Vida', consumable.restaura?.vida, 1500, 1500, 'pink'],
      ['Estamina', consumable.restaura?.estamina, 100, 40, 'green'],
      ['Mana', consumable.restaura?.mana, 100, 35, undefined],
    ].filter((entry): entry is [string, number, number, number, MetricData['accent']] => hasNumber(entry[1]))
      .map(([label, value, maximum, referenceMaximum, accent]) => ({
        label,
        value,
        maximum,
        referenceMaximum,
        referenceDescription: `Maior restauração comum de ${label.toLocaleLowerCase('pt-BR')}: ${formatValue(referenceMaximum)}.`,
        accent,
        showPlus: true,
      }));

    if (restoreValues.length === 0 && !hasText(consumable.duracao)) return null;
    return (
      <TechnicalArea>
        <TechnicalTitle><BiPlusMedical aria-hidden="true" />Aplicação</TechnicalTitle>
        {restoreValues.length > 0 && <Metrics title="Restauração" values={restoreValues} />}
        {hasText(consumable.duracao) && (
          <TechGrid $columns={1}>
            <TechnicalCard label="Duração" value={consumable.duracao} icon={<BiTimer />} />
          </TechGrid>
        )}
      </TechnicalArea>
    );
  };

  const renderAccessoryTechnical = () => {
    const accessory = attributes as AcessorioAtributos;
    if (!hasText(accessory.slot) && !hasText(accessory.duracao)) return null;
    return (
      <TechnicalArea>
        <TechnicalTitle><BiChip aria-hidden="true" />Configuração</TechnicalTitle>
        <TechGrid $columns={2}>
          {hasText(accessory.slot) && <TechnicalCard label="Slot" value={accessory.slot} icon={<BiTargetLock />} />}
          {hasText(accessory.duracao) && <TechnicalCard label="Duração" value={accessory.duracao} icon={<BiTimer />} />}
        </TechGrid>
      </TechnicalArea>
    );
  };

  const renderImplantTechnical = () => {
    const implant = attributes as ImplanteAtributos;
    const technicalCards = [
      humanize(implant.parteCorpo) && { label: 'Parte do corpo', value: humanize(implant.parteCorpo), icon: <BiBody /> },
      humanize(implant.lado) && { label: 'Lado', value: humanize(implant.lado), icon: <BiTargetLock /> },
      humanize(implant.material) && { label: 'Material', value: humanize(implant.material), icon: <BiLayer /> },
      hasText(implant.modelo) && { label: 'Modelo', value: implant.modelo, icon: <BiChip /> },
      hasNumber(implant.slotsModificacao) && { label: 'Modificações', value: implant.slotsModificacao, icon: <BiWrench /> },
      hasNumber(implant.slotsLacrima) && { label: 'Lácrimas', value: implant.slotsLacrima, icon: <BiDroplet /> },
      implant.necessitaAmputacao && { label: 'Amputação', value: 'Necessária', icon: <BiErrorAlt /> },
    ].filter(Boolean) as Array<{ label: string; value: ReactNode; icon: ReactNode }>;

    return technicalCards.length > 0 ? (
      <TechnicalArea>
        <TechnicalTitle><BiChip aria-hidden="true" />Visão técnica</TechnicalTitle>
        <TechGrid $columns={2}>
          {technicalCards.map((card) => <TechnicalCard key={card.label} {...card} />)}
        </TechGrid>
      </TechnicalArea>
    ) : null;
  };

  const renderOtherTechnical = () => {
    const other = attributes as OutrosAtributos;
    return hasText(other.duracao) ? (
      <TechnicalArea>
        <TechnicalTitle><BiInfoCircle aria-hidden="true" />Resumo técnico</TechnicalTitle>
        <TechGrid $columns={1}>
          <TechnicalCard label="Duração" value={other.duracao} icon={<BiTimer />} />
        </TechGrid>
      </TechnicalArea>
    ) : null;
  };

  const technicalArea = item.tipo === 'arma'
    ? renderWeaponTechnical()
    : item.tipo === 'traje'
      ? renderOutfitTechnical()
      : item.tipo === 'consumiveis'
        ? renderConsumableTechnical()
        : item.tipo === 'acessorio'
          ? renderAccessoryTechnical()
          : item.tipo === 'implante'
            ? renderImplantTechnical()
            : renderOtherTechnical();

  const descriptionPanel = hasDescription ? (
    <ItemRevealBlock variant="infoBlock" threshold={0.18}>
      <FramedPanel title="Descrição" icon={<BiBookOpen aria-hidden="true" />} neon={isNeonActive}>
        <DescriptionButton type="button" onClick={() => setActiveModal('description')}>
          <RichTextDisplay content={item.descricao} />
        </DescriptionButton>
      </FramedPanel>
    </ItemRevealBlock>
  ) : null;

  const renderTextPanel = (
    title: string,
    icon: ReactNode,
    values: string[],
    accent?: 'gold' | 'red' | 'purple'
  ) => values.length > 0 ? (
    <ItemRevealBlock variant="infoBlock" threshold={0.18}>
      <FramedPanel title={title} icon={icon} neon={isNeonActive} accent={accent === 'gold' ? 'gold' : undefined}>
        <TextList>
          {values.map((value, index) => (
            <TextListButton
              key={`${title}-${index}-${value}`}
              type="button"
              $accent={accent}
              onClick={() => openDetail(`${title} ${values.length > 1 ? index + 1 : ''}`.trim(), value, title)}
            >
              <BiStar aria-hidden="true" />
              <span>{value}</span>
            </TextListButton>
          ))}
        </TextList>
      </FramedPanel>
    </ItemRevealBlock>
  ) : null;

  const renderGenericSections = () => {
    if (item.tipo === 'arma') {
      const weapon = attributes as ArmaAtributos;
      const sections = [
        descriptionPanel,
        renderTextPanel('Especial', <BiStar aria-hidden="true" />, textList(weapon.especial), 'gold'),
        renderTextPanel('Bônus', <BiBoltCircle aria-hidden="true" />, textList(weapon.bonus), 'purple'),
      ].filter(Boolean);
      return sections.length > 0 ? <ContentGrid $columns={Math.min(3, sections.length)}>{sections}</ContentGrid> : null;
    }

    if (item.tipo === 'traje') {
      const outfit = attributes as TrajeAtributos;
      const sections = [
        descriptionPanel,
        renderTextPanel('Resistências', <BiShield aria-hidden="true" />, textList(outfit.resistencias)),
        renderTextPanel('Penalidades', <BiErrorAlt aria-hidden="true" />, textList(outfit.penalidades), 'red'),
        renderTextPanel('Especial', <BiStar aria-hidden="true" />, textList(outfit.especial), 'gold'),
      ].filter(Boolean);
      return sections.length > 0 ? <ContentGrid $columns={sections.length === 1 ? 1 : 2}>{sections}</ContentGrid> : null;
    }

    if (item.tipo === 'consumiveis') {
      const consumable = attributes as ConsumiveisAtributos;
      const sections = [
        descriptionPanel,
        renderTextPanel('Especial', <BiStar aria-hidden="true" />, textList(consumable.especial), 'gold'),
      ].filter(Boolean);
      return sections.length > 0 ? <ContentGrid $columns={sections.length}>{sections}</ContentGrid> : null;
    }

    if (item.tipo === 'acessorio') {
      const accessory = attributes as AcessorioAtributos;
      const sections = [
        descriptionPanel,
        renderTextPanel('Bônus', <BiBoltCircle aria-hidden="true" />, textList(accessory.bonus), 'purple'),
      ].filter(Boolean);
      return sections.length > 0 ? <ContentGrid $columns={sections.length}>{sections}</ContentGrid> : null;
    }

    const other = attributes as OutrosAtributos;
    const sections = [
      descriptionPanel,
      renderTextPanel('Especial', <BiStar aria-hidden="true" />, textList(other.especial), 'gold'),
    ].filter(Boolean);
    return sections.length > 0 ? <ContentGrid $columns={sections.length}>{sections}</ContentGrid> : null;
  };

  const renderImplantSections = () => {
    const implant = attributes as ImplanteAtributos;
    const bonusEntries = Object.entries(implant.bonus ?? {})
      .flatMap(([label, value]) => hasNumber(value)
        ? [[label as ImplantBonusKey, value] as const]
        : []);
    const specialValues = textList(implant.especiais);
    const modifications = (implant.modificacoes ?? []).filter((entry) => hasText(entry.nome) || hasText(entry.descricao));
    const tears = (implant.lacrimas ?? []).filter((entry) => hasText(entry.nome) || hasText(entry.descricao));

    const bonusPanel = bonusEntries.length > 0 ? (
      <ItemRevealBlock variant="infoBlock" threshold={0.18}>
        <FramedPanel title="Bônus" icon={<BiPulse aria-hidden="true" />} neon={isNeonActive}>
          <Metrics
            title="Impacto no personagem"
            values={bonusEntries.map(([label, value], index) => {
              const referenceMaximum = implant.parteCorpo
                ? IMPLANT_BONUS_COMMON_BY_BODY_PART[implant.parteCorpo]?.[label]
                  ?? IMPLANT_BONUS_COMMON_FALLBACK[label]
                : IMPLANT_BONUS_COMMON_FALLBACK[label];

              return {
                label: humanize(label) ?? label,
                value,
                maximum: IMPLANT_BONUS_SCALE[label],
                referenceMaximum,
                referenceDescription: `Maior bônus comum previsto para esta região corporal: ${formatValue(referenceMaximum)}.`,
                showPlus: true,
                accent: index % 3 === 0 ? 'pink' : index % 3 === 1 ? 'green' : 'purple',
              };
            })}
          />
        </FramedPanel>
      </ItemRevealBlock>
    ) : null;

    const specialsPanel = renderTextPanel('Efeitos especiais', <BiStar aria-hidden="true" />, specialValues, 'gold');
    const middleSections = [bonusPanel, specialsPanel].filter(Boolean);

    const enhancementPanel = (
      title: string,
      icon: ReactNode,
      entries: Array<{ nome: string; descricao: string }>
    ) => entries.length > 0 ? (
      <ItemRevealBlock variant="infoBlock" threshold={0.18}>
        <FramedPanel title={title} icon={icon} neon={isNeonActive}>
          <EnhancementGrid>
            {entries.map((entry, index) => (
              <EnhancementCard
                key={`${title}-${entry.nome}-${index}`}
                type="button"
                onClick={() => openDetail(entry.nome || `${title} ${index + 1}`, entry.descricao || 'Sem descrição registrada.', title)}
              >
                <strong>{entry.nome || `${title} ${index + 1}`}</strong>
                <span>{entry.descricao || 'Clique para visualizar os detalhes.'}</span>
              </EnhancementCard>
            ))}
          </EnhancementGrid>
        </FramedPanel>
      </ItemRevealBlock>
    ) : null;

    const lowerSections = [
      descriptionPanel,
      enhancementPanel('Modificações', <BiWrench aria-hidden="true" />, modifications),
      enhancementPanel('Lácrimas', <BiDroplet aria-hidden="true" />, tears),
    ].filter(Boolean);

    return (
      <>
        {middleSections.length > 0 && <ContentGrid $columns={middleSections.length}>{middleSections}</ContentGrid>}
        {lowerSections.length > 0 && <ContentGrid $columns={Math.min(3, lowerSections.length)}>{lowerSections}</ContentGrid>}
      </>
    );
  };

  const image = normalizeImagePath(item.imagem);

  return (
    <ItemPageRoot>
      {renderBackground()}
      <ItemPageContent>
        <ItemRevealBlock variant="infoBlock" threshold={0.14}>
          <HeroPanel $neon={isNeonActive}>
            <HudCorners neon={isNeonActive} />
            <HeroGrid $type={item.tipo} $hasTechnical={Boolean(technicalArea)}>
              <ItemImageButton
                type="button"
                onClick={() => item.imagem && setImageOpen(true)}
                aria-label={`Ampliar imagem de ${item.nome}`}
              >
                <ItemImage
                  src={image}
                  alt={`Imagem do item ${item.nome}`}
                  fallbackIcon={<BiImage aria-hidden="true" />}
                />
              </ItemImageButton>

              <ItemIdentity>
                <ItemTitleSlot>
                  <OdisseiaAnimatedTitle key={item.nome} theme={theme} neon={neon} text={item.nome} />
                </ItemTitleSlot>
                {hasText(item.dataCriacao) && (
                  <ItemCreationDate>
                    <BiTimer aria-hidden="true" />
                    Criado em {formatDate(item.dataCriacao)}
                  </ItemCreationDate>
                )}
                <ItemTagList aria-label="Categorias do item">
                  {tags.map((tag, index) => (
                    <ItemTag
                      key={tag}
                      $primary={index === 1}
                      $rarity={getTagRarity(tag)}
                      $neon={isNeonActive}
                    >
                      {tag}
                    </ItemTag>
                  ))}
                </ItemTagList>
                {renderQuickFacts()}
              </ItemIdentity>

              {technicalArea}
            </HeroGrid>
          </HeroPanel>
        </ItemRevealBlock>

        {item.tipo === 'implante' ? renderImplantSections() : renderGenericSections()}
      </ItemPageContent>

      {activeModal === 'description' && (
        <Modal
          title={<CityModalTitle $theme={theme}>{formatCyberpunkTitle(`Descrição — ${item.nome}`)}</CityModalTitle>}
          theme={theme}
          neon={neon}
          showFooter={false}
          onClose={closeModal}
          width="1080px"
          mobileInset
        >
          <ModalDescription>
            <RichTextDisplay content={item.descricao} />
            {relatedPages.length > 0 && (
              <RelatedPages>
                <RelatedPagesTitle>Páginas que fazem referência a este item</RelatedPagesTitle>
                {relatedPages.map((page) => (
                  <RelatedPageLink key={page.idPage ?? page.slug} to={`/wiki/${encodeURIComponent(page.slug)}`}>
                    <span>{page.titulo}</span>
                  </RelatedPageLink>
                ))}
              </RelatedPages>
            )}
          </ModalDescription>
        </Modal>
      )}

      <Lightbox
        isOpen={imageOpen}
        images={item.imagem ? [{ url: image, caption: item.nome }] : []}
        onClose={() => setImageOpen(false)}
      />

      {selectedDetail && createPortal(
        <HistoryModalOverlay onClick={(event) => { if (event.target === event.currentTarget) closeDetail(); }}>
          <HistoryModalSheet theme={theme} neon={neon}>
            <HistoryModalHeader theme={theme} neon={neon}>
              <HistoryModalTitle theme={theme} neon={neon}>{selectedDetail.title}</HistoryModalTitle>
              <HistoryModalClose
                theme={theme}
                neon={neon}
                onClick={closeDetail}
                title="Fechar"
                aria-label="Fechar resumo"
                autoFocus
              >
                <CloseIcon />
              </HistoryModalClose>
            </HistoryModalHeader>
            <HistoryModalContent theme={theme} neon={neon}>
              <SummaryContent>
                <SummaryText>
                  <strong>{selectedDetail.label || 'Detalhes'}</strong>
                  <p>{selectedDetail.description}</p>
                </SummaryText>
              </SummaryContent>
            </HistoryModalContent>
          </HistoryModalSheet>
        </HistoryModalOverlay>,
        document.getElementById('modal-root') || document.body
      )}
    </ItemPageRoot>
  );
};

export default ItemPage;
