import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { FallbackImage } from '../../components/Generic/FallbackImage/FallbackImage';
import { ScrollRevealBlock } from '../../components/Generic/ScrollRevealBlock/ScrollRevealBlock';
import {
  CardDescription,
  CardName,
  CharacterCard,
  HudPanel,
} from '../Cidade/CidadePage.style';

export {
  CharacterAvatar,
  CharacterName,
  CityModalTitle,
  GalleryButton,
  GalleryGrid,
  GalleryImage,
  GalleryModalButton,
  GalleryModalImage,
  GalleryModalTrack,
  GalleryModalViewport,
  HudCornerAccent,
  HudBorderLine,
  ModalCharacterCard,
  ModalDescription,
  PanelHeader,
  PanelTitle,
  RelatedPageLink,
  RelatedPages,
  RelatedPagesTitle,
  ViewAllButton,
} from '../Cidade/CidadePage.style';

export const RacePageRoot = styled.main`
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: calc(100vh - var(--main-header-height));
  overflow: hidden;
  color: var(--whitesmoke);
  background: rgba(0, 0, 16, 0.35);
`;

export const RacePageContent = styled.div`
  position: relative;
  z-index: 1;
  width: min(1680px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 72px;

  @media (max-width: 768px) {
    width: min(100% - 20px, 1680px);
    padding: 14px 0 44px;
  }
`;

export const RaceRevealBlock = styled(ScrollRevealBlock)`
  width: 100%;
`;

export const RacePanel = styled(HudPanel)`
  max-height: none;
  overflow: visible;
  transition: clip-path 180ms ease, border-color 260ms ease, box-shadow 320ms ease, background-color 260ms ease;
`;

export const HeroPanel = styled(RacePanel)`
  padding: clamp(18px, 2vw, 30px);
`;

export const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(300px, 1fr) minmax(400px, 0.9fr);
  align-items: stretch;
  gap: clamp(20px, 2vw, 34px);

  @media (max-width: 1240px) {
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  }

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const RaceImageButton = styled.button`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  align-self: center;
  overflow: hidden;
  border: 1px solid rgba(65, 203, 255, 0.64);
  border-radius: 4px;
  padding: 0;
  background: rgba(1, 10, 22, 0.94);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 16px rgba(0, 204, 255, 0.3);
    transform: translateY(-2px);
    outline: none;
  }

  @media (max-width: 720px) {
    width: min(100%, 330px);
    justify-self: center;
  }
`;

export const RaceImage = styled(FallbackImage)`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--clearneonBlue);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg { width: 64px; height: 64px; }
`;

export const RaceIdentity = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
`;

export const RaceTitleSlot = styled.div`
  width: 100%;
  min-width: 0;
  overflow: visible;

  svg {
    width: 100%;
    max-width: 680px;
    height: clamp(54px, 6vw, 82px);
  }
`;

export const RaceTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;

export const RaceTag = styled.span`
  border: 1px solid rgba(68, 205, 255, 0.52);
  border-radius: 2px;
  padding: 4px 9px;
  background: rgba(0, 19, 38, 0.62);
  color: var(--clearneonBlue);
  font-size: 9px;
  letter-spacing: 0.65px;
  text-transform: uppercase;
`;

export const DescriptionButton = styled.button<{ $clickable: boolean }>`
  position: relative;
  width: 100%;
  max-height: 218px;
  border: 0;
  padding: 0 4px 18px 0;
  overflow: hidden;
  background: transparent;
  color: inherit;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  text-align: left;

  ${({ $clickable }) => $clickable && css`
    &::after {
      content: 'Clique para continuar a leitura';
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      padding-top: 42px;
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
  `}
`;

export const EmptyDescription = styled.p`
  margin: 0;
  color: rgba(235, 245, 255, 0.62);
  font-size: 13px;
  line-height: 1.6;
`;

export const StatusArea = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  border-left: 1px solid rgba(63, 201, 255, 0.26);
  padding-left: clamp(18px, 2vw, 30px);

  @media (max-width: 1240px) {
    grid-column: 1 / -1;
    border-top: 1px solid rgba(63, 201, 255, 0.22);
    border-left: 0;
    padding-top: 20px;
    padding-left: 0;
  }
`;

export const StatusHeading = styled.h2`
  margin: 0;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 15px;
  font-weight: 100;
  letter-spacing: 1.3px;
  text-transform: uppercase;
`;

export const PrimaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SecondaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

type StatAccent = 'red' | 'green' | 'blue' | 'purple' | 'gold';

const statAccentColor = ($accent: StatAccent = 'blue') => {
  if ($accent === 'red') return 'var(--clearneonRed)';
  if ($accent === 'green') return 'var(--clearneonGreen)';
  if ($accent === 'purple') return 'var(--clearneonPurple)';
  if ($accent === 'gold') return '#ffe22e';
  return 'var(--clearneonBlue)';
};

export const StatCard = styled.div<{ $accent?: StatAccent; $neon?: boolean; $iconGlow?: boolean }>`
  --race-stat-color: ${({ $accent }) => statAccentColor($accent)};
  display: flex;
  min-height: 100px;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid color-mix(in srgb, var(--race-stat-color) 58%, transparent);
  border-radius: 4px;
  padding: 12px 8px;
  background: rgba(2, 14, 29, 0.76);
  color: var(--race-stat-color);
  box-shadow: ${({ $neon }) => $neon
    ? `inset 0 0 18px color-mix(in srgb, var(--race-stat-color) 12%, transparent),
       0 0 8px color-mix(in srgb, var(--race-stat-color) 24%, transparent)`
    : 'inset 0 0 18px rgba(0, 165, 255, 0.035)'};
  text-align: center;
  transition: border-color 220ms ease, box-shadow 260ms ease, background-color 220ms ease;

  svg {
    width: 27px;
    height: 27px;
    color: var(--race-stat-color) !important;
    fill: currentColor !important;
    stroke: currentColor;
    filter: ${({ $neon, $iconGlow }) => $neon && $iconGlow !== false
      ? 'drop-shadow(0 0 5px var(--race-stat-color))'
      : 'none'};
  }

  svg path {
    color: var(--race-stat-color) !important;
    fill: currentColor;
    stroke: currentColor;
  }
`;

export const StatLabel = styled.span`
  color: var(--race-stat-color) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 9px;
  letter-spacing: 0.65px;
  text-shadow: 0 0 6px color-mix(in srgb, currentColor 40%, transparent);
  text-transform: uppercase;
`;

export const StatValue = styled.strong`
  max-width: 100%;
  overflow-wrap: anywhere;
  color: var(--whitesmoke);
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(17px, 1.7vw, 25px);
  font-weight: 500;
`;

export const StatHint = styled.span`
  color: rgba(235, 245, 255, 0.68);
  font-size: 10px;
`;

export const MiddleGrid = styled.div<{ $sectionCount: number }>`
  display: grid;
  grid-template-columns: ${({ $sectionCount }) => {
    if ($sectionCount <= 1) return 'minmax(0, 1fr)';
    if ($sectionCount === 2) return 'minmax(280px, 0.92fr) minmax(360px, 1.18fr)';
    return 'repeat(3, minmax(0, 1fr))';
  }};
  align-items: stretch;
  gap: 18px;
  margin-top: 20px;

  > * { min-width: 0; }

  @media (max-width: 1120px) {
    grid-template-columns: ${({ $sectionCount }) => $sectionCount <= 1
      ? 'minmax(0, 1fr)'
      : 'repeat(2, minmax(0, 1fr))'};

    ${({ $sectionCount }) => $sectionCount >= 3 && css`
      > :last-child { grid-column: 1 / -1; }
    `}
  }

  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);

    > :last-child { grid-column: auto; }
  }
`;

export const MiddlePanel = styled(RacePanel)`
  height: 370px;
  overflow: hidden;

  @media (max-width: 760px) {
    height: auto;
    min-height: 280px;
  }
`;

export const DetailList = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 9px;
`;

export const DetailCard = styled.button`
  display: flex;
  width: 100%;
  min-height: 78px;
  min-width: 0;
  align-items: stretch;
  gap: 10px;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 8px;
  background: rgba(7, 22, 39, 0.48);
  color: inherit;
  text-align: left;
  transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    background: rgba(0, 184, 255, 0.08);
    box-shadow: inset 0 0 14px rgba(0, 204, 255, 0.08);
    outline: none;
  }
`;

export const PassiveGlyph = styled.span`
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  place-items: center;
  align-self: center;
  border: 1px solid rgba(58, 198, 255, 0.55);
  border-radius: 4px;
  color: var(--clearneonBlue);
  background: rgba(1, 15, 31, 0.9);

  svg { width: 28px; height: 28px; }
`;

export const VariationThumb = styled(FallbackImage)`
  display: flex;
  width: 62px;
  height: 62px;
  flex: 0 0 62px;
  align-items: center;
  justify-content: center;
  align-self: center;
  overflow: hidden;
  border: 1px solid rgba(58, 198, 255, 0.52);
  border-radius: 3px;
  color: var(--clearneonBlue);
  background: rgba(1, 15, 31, 0.9);

  img { width: 100%; height: 100%; object-fit: cover; }
  svg { width: 30px; height: 30px; }
`;

export const DetailCardBody = styled.span`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
`;

export const DetailCardName = styled(CardName)`
  color: var(--clearneonBlue) !important;
  font-size: 11px;
`;

export const DetailCardDescription = styled(CardDescription)`
  margin-top: 6px;
  -webkit-line-clamp: 2;
`;

export const EmptyPanel = styled.div`
  display: grid;
  min-height: 220px;
  place-items: center;
  color: rgba(235, 245, 255, 0.56);
  font-size: 12px;
  text-align: center;
`;

export const RelatedSection = styled.div`
  margin-top: 20px;
`;

export const RelatedPanel = styled(RacePanel)`
  min-height: 210px;
`;

export const RaceCharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 1280px) { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  @media (max-width: 980px) { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  @media (max-width: 620px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

export const RaceCharacterCard = styled(CharacterCard)`
  width: 100%;
`;

export const SummaryLayout = styled.div<{ $hasImage?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $hasImage }) => $hasImage ? '180px minmax(0, 1fr)' : 'minmax(0, 1fr)'};
  align-items: start;
  gap: 18px;

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SummaryImage = styled(FallbackImage)`
  display: flex;
  width: 180px;
  max-width: 100%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--clearneonBlue);
  border-radius: 4px;
  color: var(--clearneonBlue);
  background: rgba(1, 12, 25, 0.88);

  img { width: 100%; height: 100%; object-fit: cover; }

  @media (max-width: 620px) {
    justify-self: center;
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
    line-height: 1.6;
  }
`;

export const ModalDetailCard = styled(DetailCard)`
  height: 112px;
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
