import { CompareArrows, Inventory2Outlined, Visibility } from '@mui/icons-material';
import {
  BiBoltCircle,
  BiBox,
  BiCategoryAlt,
  BiCrosshair,
  BiHide,
  BiInfoCircle,
  BiPulse,
  BiShield,
  BiStar,
  BiTargetLock,
  BiTimer,
} from 'react-icons/bi';
import type { ReactNode } from 'react';
import { Modal } from '../Generic/Modal/Modal';
import { Search } from '../Generic/Search/Search';
import { LoadingIndicator } from '../Generic/LoadingIndicator';
import { normalizeImagePath } from '../../routes/Wiki/utils/imagePathHelper';
import { openItemPreview } from '../../utils/itemPreview';
import type {
  ItemComparisonModalProps,
  ItemComparisonModel,
} from './ItemComparison.types';
import {
  buildItemComparisonModel,
  formatComparisonNumber,
  getNumericDelta,
  mergeComparisonKeys,
} from './itemComparison.utils';
import { useItemComparison } from './useItemComparison';
import {
  ColumnLabel,
  ComparisonColumn,
  ComparisonGrid,
  ComparisonHeader,
  ComparisonRoot,
  ComparisonSearchSlot,
  ComparisonTitle,
  Delta,
  DetailCard,
  DetailList,
  DetailText,
  EmptyCandidate,
  IdentityCopy,
  ItemIdentity,
  ItemImageFrame,
  ItemName,
  ItemTag,
  LongDetail,
  MetricCard,
  MetricFill,
  MetricList,
  MetricName,
  MetricTrack,
  MetricValue,
  PreviewButton,
  ReferenceMarker,
  RuntimeNotice,
  SearchPanel,
  TagList,
} from './ItemComparison.style';

const detailIcon = (key: string): ReactNode => {
  if (key.includes('tipo') || key.includes('parte') || key === 'slot') return <BiCategoryAlt />;
  if (key.includes('acerto')) return <BiTargetLock />;
  if (key.includes('estamina')) return <BiBoltCircle />;
  if (key.includes('duracao')) return <BiTimer />;
  if (key.includes('discricao')) return <BiHide />;
  if (key.includes('protecao') || key.includes('escudo') || key.includes('armadura')) return <BiShield />;
  return <BiBox />;
};

const formatDelta = (difference: number) => {
  if (difference === 0) return '=';
  return `${difference > 0 ? '▲ +' : '▼ −'}${formatComparisonNumber(Math.abs(difference))}`;
};

interface ComparisonCardProps {
  model: ItemComparisonModel;
  baseline: ItemComparisonModel;
  metricKeys: string[];
  detailKeys: string[];
  showDelta?: boolean;
  label: string;
  theme: 'dark' | 'light';
  neon: boolean;
}

const ComparisonCard = ({
  model,
  baseline,
  metricKeys,
  detailKeys,
  showDelta = false,
  label,
  theme,
  neon,
}: ComparisonCardProps) => {
  const renderMetric = (key: string) => {
    const metric = model.metrics.find((entry) => entry.key === key);
    const baselineMetric = baseline.metrics.find((entry) => entry.key === key);
    if (!metric) {
      return (
        <MetricCard key={key} $theme={theme} $neon={neon} aria-label="Atributo não aplicável">
          <MetricName>{baselineMetric?.label ?? key}</MetricName>
          <MetricValue>—</MetricValue>
        </MetricCard>
      );
    }

    const percentage = metric.maximum > 0 ? (Math.abs(metric.value ?? 0) / metric.maximum) * 100 : 0;
    const referencePercentage = metric.referenceMaximum === undefined || metric.maximum <= 0
      ? undefined
      : (metric.referenceMaximum / metric.maximum) * 100;
    const delta = showDelta
      ? getNumericDelta(baselineMetric?.value, metric.value, metric.higherIsBetter)
      : null;
    return (
      <MetricCard key={key} $theme={theme} $neon={neon}>
        <MetricName>{metric.label}</MetricName>
        <MetricValue>
          {metric.showPlus && (metric.value ?? 0) > 0 ? '+' : ''}{formatComparisonNumber(metric.value ?? 0)}
          {delta && <Delta $quality={delta.quality}> {formatDelta(delta.difference)}</Delta>}
        </MetricValue>
        <MetricTrack
          role="progressbar"
          aria-label={metric.label}
          aria-valuemin={0}
          aria-valuemax={metric.maximum}
          aria-valuenow={Math.min(Math.abs(metric.value ?? 0), metric.maximum)}
        >
          <MetricFill $percentage={percentage} $accent={metric.accent} />
          {referencePercentage !== undefined && (
            <ReferenceMarker
              $percentage={referencePercentage}
              tabIndex={0}
              aria-label={metric.referenceDescription}
            >
              <span>{metric.referenceDescription}</span>
            </ReferenceMarker>
          )}
        </MetricTrack>
      </MetricCard>
    );
  };

  const renderDetail = (key: string) => {
    const entry = model.details.find((detail) => detail.key === key);
    const baselineEntry = baseline.details.find((detail) => detail.key === key);
    const delta = showDelta && entry?.higherIsBetter !== undefined
      ? getNumericDelta(baselineEntry?.numericValue, entry.numericValue, entry.higherIsBetter)
      : null;
    return (
      <DetailCard key={key} $theme={theme} $neon={neon}>
        {detailIcon(key)}
        <DetailText>
          <small>{entry?.label ?? baselineEntry?.label ?? key}</small>
          <strong>{entry?.value ?? '—'}</strong>
        </DetailText>
        {delta && <Delta $quality={delta.quality}>{formatDelta(delta.difference)}</Delta>}
      </DetailCard>
    );
  };

  return (
    <ComparisonColumn $theme={theme} $neon={neon}>
      <ColumnLabel $theme={theme} $neon={neon}>{label}</ColumnLabel>
      <ItemIdentity>
        <ItemImageFrame $theme={theme} $neon={neon}>
          {model.item.imagem
            ? <img src={normalizeImagePath(model.item.imagem)} alt={model.item.nome} />
            : <Inventory2Outlined aria-label="Item sem imagem" />}
        </ItemImageFrame>
        <IdentityCopy>
          <ItemName $theme={theme} $neon={neon}>{model.item.nome || 'Item sem nome'}</ItemName>
          <TagList>
            <ItemTag>Item</ItemTag>
            <ItemTag $kind="type">{model.typeLabel}</ItemTag>
            {model.subtypeLabel && <ItemTag $kind="subtype">{model.subtypeLabel}</ItemTag>}
          </TagList>
        </IdentityCopy>
      </ItemIdentity>
      {metricKeys.length > 0 && <MetricList>{metricKeys.map(renderMetric)}</MetricList>}
      {detailKeys.length > 0 && <DetailList>{detailKeys.map(renderDetail)}</DetailList>}
      {(model.effect || baseline.effect) && (
        <LongDetail $theme={theme} $neon={neon}>
          <BiPulse />
          <DetailText><small>Efeito</small><strong>{model.effect ?? '—'}</strong></DetailText>
        </LongDetail>
      )}
      {(model.special || baseline.special) && (
        <LongDetail $theme={theme} $neon={neon} $gold>
          <BiStar />
          <DetailText><small>Especial</small><strong>{model.special ?? '—'}</strong></DetailText>
        </LongDetail>
      )}
    </ComparisonColumn>
  );
};

export const ItemComparisonModal = ({
  open,
  item,
  onClose,
  theme,
  neon,
  runtimeContext,
  availableItems,
}: ItemComparisonModalProps) => {
  const {
    search,
    changeSearch,
    selectedItem,
    suggestions,
    selectSuggestion,
    comparisonGroup,
    currentRuntime,
    candidateRuntime,
    loading,
  } = useItemComparison({ open, item, runtimeContext, availableItems });

  if (!open || !item) return null;
  const neonActive = neon === 'on';
  const currentModel = buildItemComparisonModel(item, currentRuntime.context ?? runtimeContext);
  const candidateModel = selectedItem
    ? buildItemComparisonModel(selectedItem, candidateRuntime.context ?? runtimeContext)
    : null;
  const metricKeys = mergeComparisonKeys(currentModel.metrics, candidateModel?.metrics ?? []);
  const detailKeys = mergeComparisonKeys(currentModel.details, candidateModel?.details ?? []);
  const runtimeError = currentRuntime.error ?? candidateRuntime.error;
  const usesFallback = Boolean(
    currentRuntime.context?.usaFallbackLegado || candidateRuntime.context?.usaFallbackLegado,
  );

  return (
    <Modal
      title={(
        <ComparisonHeader>
          <ComparisonTitle $theme={theme} $neon={neonActive}>
            <CompareArrows aria-hidden="true" /> Comparar item — {item.nome}
          </ComparisonTitle>
          <PreviewButton
            type="button"
            $theme={theme}
            $neon={neonActive}
            onClick={() => openItemPreview(item, runtimeContext)}
            title="Abrir página do item"
            aria-label="Abrir página do item em uma nova guia"
          >
            <Visibility />
          </PreviewButton>
        </ComparisonHeader>
      )}
      theme={theme}
      neon={neon}
      onClose={onClose}
      showFooter={false}
      width="1320px"
      mobileInset
    >
      <ComparisonRoot $theme={theme} $neon={neonActive}>
        {loading && <LoadingIndicator compact label="Buscando itens" />}
        <ComparisonGrid>
          <ComparisonSearchSlot>
            <SearchPanel $theme={theme} $neon={neonActive}>
              <Search
                theme={theme}
                neon={neon}
                label={`Pesquisar ${comparisonGroup.label.toLocaleLowerCase('pt-BR')}...`}
                value={search}
                onChange={(event) => changeSearch(event.target.value)}
                icon={<BiCrosshair />}
                suggestions={suggestions}
                onSelectSuggestion={selectSuggestion}
                loading={loading}
                portal
              />
              <p>Mesmo tipo: {comparisonGroup.label}</p>
            </SearchPanel>
          </ComparisonSearchSlot>
          <ComparisonCard
            model={currentModel}
            baseline={candidateModel ?? currentModel}
            metricKeys={metricKeys}
            detailKeys={detailKeys}
            showDelta={Boolean(candidateModel)}
            label="Seu item atual"
            theme={theme}
            neon={neonActive}
          />
          {candidateModel ? (
            <ComparisonCard
              model={candidateModel}
              baseline={currentModel}
              metricKeys={metricKeys}
              detailKeys={detailKeys}
              showDelta
              label="Item pesquisado"
              theme={theme}
              neon={neonActive}
            />
          ) : (
            <ComparisonColumn $theme={theme} $neon={neonActive}>
              <ColumnLabel $theme={theme} $neon={neonActive}>Item para comparação</ColumnLabel>
              <EmptyCandidate>
                Pesquise e selecione um item visível do mesmo tipo para comparar os atributos de gameplay.
              </EmptyCandidate>
            </ComparisonColumn>
          )}
        </ComparisonGrid>
        {(runtimeError || usesFallback) && (
          <RuntimeNotice $warning>
            <BiInfoCircle />
            <span>{runtimeError ?? 'Parte das referências foi obtida pelos dados de compatibilidade do Sistema desta ficha.'}</span>
          </RuntimeNotice>
        )}
        <RuntimeNotice>
          <BiInfoCircle />
          <span>Verde indica vantagem; vermelho indica desvantagem. Custos de estamina e espaço ocupado são melhores quando menores.</span>
        </RuntimeNotice>
      </ComparisonRoot>
    </Modal>
  );
};
