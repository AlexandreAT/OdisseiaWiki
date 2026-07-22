import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { FallbackImage } from '../../components/Generic/FallbackImage/FallbackImage';
import { ScrollRevealBlock } from '../../components/Generic/ScrollRevealBlock/ScrollRevealBlock';
import { HudBorderLine, HudCornerAccent, HudPanel, PanelTitle } from '../Cidade/CidadePage.style';

export {
  CityModalTitle,
  ModalDescription,
  PanelHeader,
  RelatedPageLink,
  RelatedPages,
  RelatedPagesTitle,
} from '../Cidade/CidadePage.style';

export const ItemPageRoot = styled.main`
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: calc(100vh - var(--main-header-height));
  overflow: hidden;
  color: var(--whitesmoke);
  background: rgba(0, 0, 16, 0.35);
`;

export const ItemPageContent = styled.div`
  position: relative;
  z-index: 1;
  width: min(1680px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 72px;

  @media (min-width: 1900px) {
    width: min(1880px, calc(100% - 64px));
  }

  @media (max-width: 768px) {
    width: min(100% - 20px, 1680px);
    padding: 14px 0 44px;
  }
`;

export const ItemRevealBlock = styled(ScrollRevealBlock)`
  width: 100%;
  min-width: 0;
`;

export const ItemPanel = styled(HudPanel)<{ $accent?: 'gold' }>`
  max-height: none;
  height: 100%;
  overflow: visible;
  transition: clip-path 180ms ease, border-color 260ms ease, box-shadow 320ms ease, background-color 260ms ease;

  ${({ $accent, $neon }) => $accent === 'gold' && css`
    border-color: ${$neon ? 'transparent' : 'rgba(255, 213, 45, 0.62)'};
    box-shadow:
      0 18px 42px rgba(0, 0, 0, 0.28),
      inset 0 0 ${$neon ? '16px rgba(255, 213, 45, 0.11)' : '34px rgba(255, 213, 45, 0.025)'},
      ${$neon ? '0 0 7px rgba(255, 213, 45, 0.22)' : '0 0 0 transparent'};

    > header {
      border-bottom-color: ${$neon ? 'rgba(255, 213, 45, 0.48)' : 'rgba(255, 213, 45, 0.2)'};
      box-shadow: ${$neon ? '0 7px 12px -12px rgba(255, 213, 45, 0.92)' : 'none'};
    }
  `}
`;

export const ItemHudCornerAccent = styled(HudCornerAccent)<{ $accent?: 'gold' }>`
  ${({ $accent, $neon }) => $accent === 'gold' && css`
    background-color: ${$neon ? '#ffd52d' : 'rgba(255, 213, 45, 0.78)'};
    filter: ${$neon
      ? 'drop-shadow(0 0 2px #ffd52d) drop-shadow(0 0 6px rgba(255, 213, 45, 0.72))'
      : 'drop-shadow(0 0 3px rgba(255, 213, 45, 0.32))'};
  `}
`;

export const ItemHudBorderLine = styled(HudBorderLine)<{ $accent?: 'gold' }>`
  ${({ $accent }) => $accent === 'gold' && css`
    background: #ffd52d;
    box-shadow: 0 0 5px rgba(255, 213, 45, 0.78);
  `}
`;

export const ItemPanelTitle = styled(PanelTitle)<{ $accent?: 'gold' }>`
  ${({ $accent, $neon }) => $accent === 'gold' && css`
    color: #ffd52d !important;
    text-shadow: ${$neon ? '0 0 8px rgba(255, 213, 45, 0.72)' : 'none'};

    svg,
    svg path {
      color: #ffd52d !important;
      fill: currentColor !important;
      stroke: currentColor !important;
    }

    svg {
      filter: ${$neon ? 'drop-shadow(0 0 5px rgba(255, 213, 45, 0.82))' : 'none'};
    }
  `}
`;

export const HeroPanel = styled(ItemPanel)`
  padding: clamp(18px, 2vw, 30px);
`;

export const HeroGrid = styled.div<{ $type: string; $hasTechnical: boolean }>`
  display: grid;
  grid-template-columns: ${({ $type, $hasTechnical }) => !$hasTechnical
    ? 'minmax(250px, 330px) minmax(320px, 1fr)'
    : $type === 'arma'
      ? 'minmax(250px, 330px) minmax(300px, 0.92fr) minmax(440px, 1.3fr)'
      : $type === 'implante'
        ? 'minmax(250px, 320px) minmax(300px, 0.9fr) minmax(410px, 1.18fr)'
        : 'minmax(250px, 330px) minmax(320px, 1fr) minmax(380px, 1fr)'};
  align-items: stretch;
  gap: clamp(20px, 2vw, 34px);

  @media (max-width: 1280px) {
    grid-template-columns: minmax(220px, 290px) minmax(0, 1fr);
  }

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ItemImageButton = styled.button`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  align-self: center;
  overflow: hidden;
  border: 1px solid rgba(65, 203, 255, 0.64);
  border-radius: 4px;
  padding: 0;
  background:
    radial-gradient(circle at center, rgba(0, 142, 210, 0.12), transparent 58%),
    rgba(1, 10, 22, 0.94);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;

  &::after {
    content: '';
    position: absolute;
    inset: 11px;
    pointer-events: none;
    border: 1px solid rgba(55, 203, 255, 0.16);
  }

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 16px rgba(0, 204, 255, 0.3);
    transform: translateY(-2px);
    outline: none;
  }

  @media (max-width: 720px) {
    width: min(100%, 340px);
    justify-self: center;
  }
`;

export const ItemImage = styled(FallbackImage)`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--clearneonBlue);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 10px;
    box-sizing: border-box;
  }

  svg {
    width: 64px;
    height: 64px;
    color: currentColor !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  svg path {
    color: currentColor !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }
`;

export const ItemIdentity = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
`;

export const ItemTitleSlot = styled.div`
  width: 100%;
  min-width: 0;
  overflow: visible;

  svg {
    width: 100%;
    max-width: 690px;
    height: clamp(54px, 6vw, 82px);
  }
`;

export const ItemCreationDate = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -6px;
  color: rgba(235, 245, 255, 0.5) !important;
  font-size: 12px;
  line-height: 1.4;
  opacity: 0.7;

  svg,
  svg path {
    width: 13px;
    height: 13px;
    color: currentColor !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }
`;

export const ItemTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

const tagCometTop = keyframes`
  0% { left: -72%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
`;

const tagCometBottom = keyframes`
  0% { right: -72%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { right: 100%; opacity: 0; }
`;

type ItemTagRarity = 'unique' | 'legendary';

export const ItemTag = styled.span<{
  $primary?: boolean;
  $rarity?: ItemTagRarity;
  $neon?: boolean;
}>`
  --tag-accent: ${({ $rarity, $primary }) => $rarity === 'unique'
    ? 'var(--clearneonGreen)'
    : $rarity === 'legendary'
      ? '#ffd52d'
      : $primary
        ? 'var(--clearneonPurple)'
        : 'var(--clearneonBlue)'};
  --tag-tail: ${({ $rarity }) => $rarity === 'unique'
    ? 'rgba(42, 255, 163, 0.16)'
    : 'rgba(255, 213, 45, 0.16)'};

  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid ${({ $rarity, $primary }) => $rarity === 'unique'
    ? 'rgba(42, 255, 163, 0.72)'
    : $rarity === 'legendary'
      ? 'rgba(255, 213, 45, 0.76)'
      : $primary
        ? 'rgba(204, 74, 255, 0.64)'
        : 'rgba(68, 205, 255, 0.52)'};
  border-radius: 2px;
  padding: 4px 9px;
  background: ${({ $rarity, $primary }) => $rarity === 'unique'
    ? 'rgba(3, 45, 32, 0.62)'
    : $rarity === 'legendary'
      ? 'rgba(55, 39, 3, 0.62)'
      : $primary
        ? 'rgba(48, 8, 62, 0.62)'
        : 'rgba(0, 19, 38, 0.62)'};
  color: var(--tag-accent) !important;
  font-size: 9px;
  letter-spacing: 0.65px;
  text-transform: uppercase;

  ${({ $rarity, $neon }) => $rarity && $neon && css`
    box-shadow: 0 0 8px color-mix(in srgb, var(--tag-accent) 28%, transparent);
    text-shadow: 0 0 6px color-mix(in srgb, var(--tag-accent) 58%, transparent);

    &::before,
    &::after {
      content: '';
      position: absolute;
      z-index: 2;
      width: 72%;
      height: 1px;
      pointer-events: none;
      filter: drop-shadow(0 0 3px var(--tag-accent));
    }

    &::before {
      top: -1px;
      left: -72%;
      background: linear-gradient(90deg, transparent, var(--tag-tail) 24%, var(--tag-accent) 100%);
      animation: ${tagCometTop} 1.75s linear infinite;
    }

    &::after {
      right: -72%;
      bottom: -1px;
      background: linear-gradient(270deg, transparent, var(--tag-tail) 24%, var(--tag-accent) 100%);
      animation: ${tagCometBottom} 1.75s linear infinite;
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none;
      opacity: 0;
    }
  }
`;

export const QuickFacts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 9px;

  @media (max-width: 360px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    > :nth-child(3) {
      grid-column: 1 / -1;
    }
  }
`;

export const QuickFact = styled.div<{ $fullWidth?: boolean; $interactive?: boolean }>`
  display: flex;
  min-width: 0;
  min-height: 66px;
  align-items: center;
  gap: 10px;
  grid-column: ${({ $fullWidth }) => $fullWidth ? '1 / -1' : 'auto'};
  border: 1px solid rgba(49, 190, 247, 0.34);
  border-radius: 4px;
  padding: 10px;
  background: rgba(2, 14, 29, 0.72);
  color: inherit;
  font: inherit;
  text-align: left;
  box-sizing: border-box;
  cursor: ${({ $interactive }) => $interactive ? 'pointer' : 'default'};
  transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;

  > svg {
    width: 22px;
    height: 22px;
    flex: 0 0 auto;
    color: var(--clearneonBlue) !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  > svg path {
    color: var(--clearneonBlue) !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  ${({ $interactive }) => $interactive && css`
    &:hover,
    &:focus-visible {
      border-color: var(--clearneonBlue);
      background: rgba(0, 184, 255, 0.09);
      box-shadow: inset 0 0 15px rgba(0, 204, 255, 0.08), 0 0 8px rgba(0, 204, 255, 0.16);
      outline: none;
    }
  `}

  @media (max-width: 420px) {
    min-height: 60px;
    gap: 8px;
    padding: 8px;

    > svg {
      width: 21px;
      height: 21px;
    }
  }
`;

export const FactText = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
`;

export const FactLabel = styled.span`
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 8px;
  line-height: 1.25;
  letter-spacing: 0.65px;
  text-transform: uppercase;
  overflow-wrap: anywhere;
`;

export const FactValue = styled.strong`
  overflow-wrap: anywhere;
  color: var(--whitesmoke);
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.35;
`;

export const EffectPreview = styled(FactValue)`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const TechnicalArea = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  border-left: 1px solid rgba(63, 201, 255, 0.26);
  padding-left: clamp(18px, 2vw, 30px);

  @media (max-width: 1280px) {
    grid-column: 1 / -1;
    border-top: 1px solid rgba(63, 201, 255, 0.22);
    border-left: 0;
    padding-top: 20px;
    padding-left: 0;
  }

  @media (max-width: 720px) {
    grid-column: auto;
  }
`;

export const TechnicalTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 15px;
  font-weight: 100;
  letter-spacing: 1.3px;
  text-transform: uppercase;

  svg {
    width: 21px;
    height: 21px;
    color: currentColor !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  svg path {
    color: currentColor !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }
`;

export const MetricGroup = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgba(48, 193, 255, 0.34);
  border-radius: 4px;
  padding: 14px;
  background: rgba(2, 14, 29, 0.72);
`;

export const MetricHeading = styled.h3`
  margin: 0 0 2px;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 10px;
  font-weight: 100;
  letter-spacing: 0.75px;
  text-transform: uppercase;
`;

export const MetricRow = styled.div`
  display: grid;
  grid-template-columns: minmax(74px, auto) minmax(80px, 1fr) minmax(34px, auto);
  align-items: center;
  gap: 10px;
  min-width: 0;

  @media (max-width: 420px) {
    grid-template-columns: minmax(66px, auto) minmax(50px, 1fr) minmax(30px, auto);
    gap: 7px;
  }
`;

export const MetricLabel = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  color: rgba(235, 245, 255, 0.82) !important;
  font-size: 11px;

  > span {
    overflow: hidden;
    color: inherit !important;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: rgba(164, 198, 224, 0.58);
    font-family: 'Orbitron', sans-serif;
    font-size: 7px;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }
`;

export const MetricTrack = styled.span`
  position: relative;
  height: 5px;
  border-radius: 10px;
  background:
    linear-gradient(90deg, rgba(52, 129, 178, 0.17), rgba(173, 62, 219, 0.13)),
    rgba(106, 132, 169, 0.12);
`;

export const MetricReferenceMarker = styled.span<{
  $percentage: number;
  $alignment: 'left' | 'center' | 'right';
}>`
  position: absolute;
  z-index: 3;
  top: -4px;
  left: ${({ $percentage }) => Math.max(0, Math.min(100, $percentage))}%;
  width: 2px;
  height: 13px;
  border-radius: 2px;
  background: #ffd52d;
  box-shadow: 0 0 6px rgba(255, 213, 45, 0.82);
  cursor: help;
  transform: translateX(-1px);

  &:focus-visible { outline: 1px solid #ffd52d; outline-offset: 3px; }
`;

export const MetricReferenceTooltip = styled.span`
  position: absolute;
  z-index: 8;
  bottom: calc(100% + 8px);
  left: 50%;
  width: max-content;
  max-width: min(210px, 58vw);
  border: 1px solid rgba(255, 213, 45, 0.58);
  border-radius: 3px;
  padding: 6px 8px;
  background: rgba(2, 10, 22, 0.97);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.38), 0 0 9px rgba(255, 213, 45, 0.12);
  color: rgba(244, 248, 255, 0.9) !important;
  font-family: 'Orbitron', sans-serif;
  font-size: 8px;
  font-weight: 400;
  line-height: 1.45;
  opacity: 0;
  pointer-events: none;
  text-align: left;
  transform: translate(-50%, 3px);
  transition: opacity 140ms ease, transform 140ms ease;

  ${MetricReferenceMarker}[data-alignment='left'] & {
    left: -3px;
    transform: translate(0, 3px);
  }

  ${MetricReferenceMarker}[data-alignment='right'] & {
    right: -3px;
    left: auto;
    transform: translate(0, 3px);
  }

  ${MetricReferenceMarker}:hover &,
  ${MetricReferenceMarker}:focus-visible & {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  ${MetricReferenceMarker}[data-alignment='left']:hover &,
  ${MetricReferenceMarker}[data-alignment='left']:focus-visible &,
  ${MetricReferenceMarker}[data-alignment='right']:hover &,
  ${MetricReferenceMarker}[data-alignment='right']:focus-visible & {
    transform: translate(0, 0);
  }
`;

export const MetricFill = styled.span<{
  $percentage: number;
  $accent?: 'pink' | 'purple' | 'green';
  $state: 'normal' | 'exceptional' | 'overflow';
}>`
  display: block;
  width: ${({ $percentage }) => $percentage <= 0
    ? '0%'
    : `${Math.max(1.5, Math.min(100, $percentage))}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $accent, $state }) => $state === 'overflow'
    ? 'linear-gradient(90deg, #ffb323, var(--clearneonRed))'
    : $state === 'exceptional'
      ? 'linear-gradient(90deg, #ffd52d, var(--clearneonPink))'
      : $accent === 'pink'
        ? 'var(--clearneonPink)'
        : $accent === 'green'
          ? 'var(--clearneonGreen)'
          : $accent === 'purple'
            ? 'var(--clearneonPurple)'
            : 'var(--clearneonBlue)'};
  box-shadow: ${({ $state }) => $state === 'overflow'
    ? '0 0 9px rgba(255, 64, 88, 0.92)'
    : $state === 'exceptional'
      ? '0 0 8px rgba(255, 213, 45, 0.78)'
      : '0 0 7px rgba(71, 208, 255, 0.52)'};
`;

export const MetricValue = styled.strong<{ $state: 'normal' | 'exceptional' | 'overflow' }>`
  display: flex;
  min-width: 44px;
  flex-direction: column;
  align-items: flex-end;
  color: ${({ $state }) => $state === 'overflow'
    ? 'var(--clearneonRed)'
    : $state === 'exceptional'
      ? '#ffd52d'
      : 'var(--whitesmoke)'};
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  font-weight: 400;
  text-align: right;

  > span { color: inherit !important; }

  small {
    color: rgba(164, 198, 224, 0.52);
    font-size: 7px;
    font-weight: 400;
    white-space: nowrap;
  }
`;

export const TechGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 3 }) => $columns}, minmax(0, 1fr));
  gap: 9px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(${({ $columns = 3 }) => Math.min($columns, 3)}, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: repeat(${({ $columns = 3 }) => Math.min($columns, 2)}, minmax(0, 1fr));
  }

  @media (max-width: 370px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const TechCard = styled.div`
  --item-card-accent: var(--clearneonBlue);

  display: flex;
  min-width: 0;
  min-height: 66px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid rgba(48, 193, 255, 0.34);
  border-radius: 4px;
  padding: 8px 6px;
  background: rgba(2, 14, 29, 0.72);
  text-align: center;

`;

export const TechIcon = styled.span`
  display: grid;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  place-items: center;
  color: var(--item-card-accent) !important;

  svg {
    width: 18px;
    height: 18px;
    color: inherit !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  svg path {
    color: inherit !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }
`;

export const TechLabel = styled.span`
  color: var(--item-card-accent) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 7px;
  letter-spacing: 0.45px;
  text-transform: uppercase;
`;

export const TechValue = styled.strong`
  max-width: 100%;
  overflow-wrap: anywhere;
  color: var(--whitesmoke);
  font-family: 'Orbitron', sans-serif;
  font-size: 10.5px;
  font-weight: 400;
  line-height: 1.28;
`;

export const ContentGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, minmax(0, 1fr));
  align-items: stretch;
  gap: 18px;
  margin-top: 20px;

  > * { min-width: 0; }

  @media (max-width: 1050px) {
    grid-template-columns: ${({ $columns = 2 }) => $columns <= 1
      ? 'minmax(0, 1fr)'
      : 'repeat(2, minmax(0, 1fr))'};
  }

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const DescriptionButton = styled.button`
  position: relative;
  display: block;
  width: 100%;
  max-height: 285px;
  border: 0;
  padding: 0 4px 18px 0;
  overflow: hidden;
  background: transparent;
  color: inherit;
  text-align: left;

  &::after {
    content: 'Clique para continuar a leitura';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    padding-top: 44px;
    background: linear-gradient(transparent, rgba(2, 9, 21, 0.98) 72%);
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 9px;
    letter-spacing: 0.65px;
    text-align: right;
    text-transform: uppercase;
  }

  &:focus-visible {
    outline: 1px solid var(--clearneonBlue);
    outline-offset: 5px;
  }
`;

export const EmptyPanel = styled.div`
  display: grid;
  min-height: 128px;
  place-items: center;
  color: rgba(235, 245, 255, 0.56);
  font-size: 12px;
  text-align: center;
`;

export const TextList = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
`;

export const TextListButton = styled.button<{ $accent?: 'gold' | 'red' | 'purple' }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 9px 10px;
  background: rgba(4, 18, 34, 0.55);
  color: var(--whitesmoke);
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;

  > span {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  svg {
    width: 17px;
    height: 17px;
    margin-top: 1px;
    color: ${({ $accent }) => $accent === 'gold'
      ? '#ffd52d'
      : $accent === 'red'
        ? 'var(--clearneonRed)'
        : $accent === 'purple'
          ? 'var(--clearneonPurple)'
          : 'var(--clearneonBlue)'} !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  svg path {
    color: inherit !important;
    fill: currentColor !important;
    stroke: currentColor !important;
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ $accent }) => $accent === 'gold'
      ? 'rgba(255, 213, 45, 0.62)'
      : $accent === 'red'
        ? 'rgba(255, 73, 104, 0.62)'
        : $accent === 'purple'
          ? 'rgba(197, 77, 255, 0.62)'
          : 'rgba(60, 203, 255, 0.62)'};
    background: rgba(0, 184, 255, 0.07);
    box-shadow: inset 0 0 14px rgba(0, 204, 255, 0.06);
    outline: none;
  }
`;

export const HighlightText = styled.p<{ $accent?: 'gold' | 'green' }>`
  margin: 0;
  border-left: 2px solid ${({ $accent }) => $accent === 'gold' ? '#ffd52d' : 'var(--clearneonGreen)'};
  padding: 12px 14px;
  background: rgba(1, 12, 24, 0.48);
  color: var(--whitesmoke) !important;
  font-size: 13px;
  line-height: 1.65;
`;

export const BonusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
`;

export const BonusCard = styled.div`
  display: flex;
  min-height: 104px;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid rgba(151, 81, 255, 0.38);
  border-radius: 4px;
  padding: 11px 7px;
  background: linear-gradient(180deg, rgba(20, 9, 42, 0.72), rgba(3, 15, 29, 0.74));
  text-align: center;

  svg {
    width: 26px;
    height: 26px;
    color: var(--clearneonPurple) !important;
    fill: currentColor !important;
  }

  svg path { fill: currentColor !important; }
`;

export const BonusLabel = styled.span`
  color: rgba(235, 245, 255, 0.76) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 8px;
  letter-spacing: 0.55px;
  text-transform: uppercase;
`;

export const BonusValue = styled.strong`
  color: var(--clearneonPurple);
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: 500;
`;

export const EnhancementGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
`;

export const EnhancementCard = styled.button`
  display: flex;
  min-height: 112px;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  border: 1px solid rgba(154, 73, 255, 0.38);
  border-radius: 4px;
  padding: 12px;
  background: linear-gradient(145deg, rgba(27, 11, 47, 0.72), rgba(4, 17, 32, 0.82));
  color: inherit;
  text-align: left;

  strong {
    color: var(--clearneonPurple);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 10px;
    font-weight: 100;
    letter-spacing: 0.55px;
    text-transform: uppercase;
  }

  span {
    display: -webkit-box;
    overflow: hidden;
    color: rgba(235, 245, 255, 0.72) !important;
    font-size: 11px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonPurple);
    box-shadow: inset 0 0 18px rgba(190, 76, 255, 0.1);
    outline: none;
  }
`;

export const SummaryContent = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
`;

export const SummaryText = styled.div`
  border-left: 2px solid var(--neonBlue);
  padding: 11px 12px;
  background: rgba(0, 0, 10, 0.32);

  strong {
    display: block;
    margin-bottom: 5px;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 10px;
    font-weight: 100;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    color: var(--whitesmoke);
    font-size: 13px;
    line-height: 1.65;
    white-space: pre-wrap;
  }
`;

export const PageState = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  width: min(760px, calc(100% - 32px));
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 42px auto;
  border: 1px solid rgba(62, 205, 255, 0.5);
  padding: 34px;
  background: rgba(2, 10, 22, 0.92);
  text-align: center;
  box-sizing: border-box;

  h1 {
    margin: 0;
    color: var(--clearneonBlue) !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 22px;
    font-weight: 100;
  }

  p { max-width: 540px; margin: 0; line-height: 1.6; }
`;

export const BackToWikiLink = styled(Link)`
  border: 1px solid var(--clearneonBlue);
  padding: 9px 15px;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 12px;
  letter-spacing: 0.7px;
  text-decoration: none;
  text-transform: uppercase;
`;

export const FullWidthReveal = styled(ItemRevealBlock)<{ $enabled?: boolean }>`
  ${({ $enabled }) => $enabled && css`
    grid-column: 1 / -1;
  `}
`;
