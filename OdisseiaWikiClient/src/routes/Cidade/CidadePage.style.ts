import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import { FallbackImage } from '../../components/Generic/FallbackImage/FallbackImage';
import HudCorner from '../../assets/svg/HudCorner.svg';
import { ImageDisplayShape } from '../../utils/imageDisplayShape';

const bannerArrival = keyframes`
  from { opacity: 0; transform: scale(1.035); }
  to { opacity: 1; transform: scale(1); }
`;

const panelArrival = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const panelFrame = css<{ $neon?: boolean }>`
  position: relative;
  border: 1px solid ${({ $neon }) => $neon
    ? 'var(--clearneonBlue)'
    : 'color-mix(in srgb, var(--neonBlue) 54%, transparent)'};
  background:
    linear-gradient(145deg, rgba(4, 18, 34, 0.94), rgba(2, 7, 18, 0.9));
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.28),
    inset 0 0 ${({ $neon }) => $neon ? '16px rgba(0, 178, 255, 0.16)' : '34px rgba(0, 179, 255, 0.035)'},
    ${({ $neon }) => $neon ? '0 0 7px rgba(0, 204, 255, 0.24)' : '0 0 0 transparent'};
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
    background: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--neonBlue)'};
    box-shadow: ${({ $neon }) => $neon ? '0 0 5px rgba(0, 204, 255, 0.62)' : 'none'};
  }

  &::before {
    width: 54px;
    height: 2px;
    top: -1px;
    left: 16px;
  }

  &::after {
    width: 2px;
    height: 42px;
    right: -1px;
    bottom: 16px;
  }
`;

export const HudCornerAccent = styled.span<{
  $position: 'top-right' | 'bottom-left';
  $neon: boolean;
}>`
  position: absolute;
  z-index: 4;
  width: 50px;
  height: 50px;
  pointer-events: none;
  background-color: ${({ $neon }) => $neon ? 'var(--clearneonBlue)' : 'var(--neonBlue)'};
  filter: ${({ $neon }) => $neon
    ? 'drop-shadow(0 0 2px var(--clearneonBlue)) drop-shadow(0 0 6px var(--clearneonBlue)) drop-shadow(0 0 12px var(--neonBlue))'
    : 'drop-shadow(0 0 3px var(--neonBlue))'};
  -webkit-mask-image: url("${HudCorner}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url("${HudCorner}");
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;

  ${({ $position }) => $position === 'top-right' ? css`
    top: 0;
    right: 0;
    transform: scale(-1);
  ` : css`
    bottom: 0;
    left: 0;
  `}
`;

export const CityPageContainer = styled.main<{
  $theme: 'dark' | 'light';
  $backgroundImage?: string;
}>`
  position: relative;
  isolation: isolate;
  width: 100%;
  min-height: calc(100vh - var(--main-header-height));
  --city-panel-max-height: 500px;
  color: ${({ $theme }) => ($theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)')};
  overflow: hidden;

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image: ${({ $backgroundImage }) => $backgroundImage
      ? `url("${$backgroundImage}")`
      : 'none'};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(12px);
    transform: scale(1.08);
    opacity: 0.35;
  }
`;

export const CityPageContent = styled.div`
  width: min(1680px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 72px;

  @media (max-width: 768px) {
    width: min(100% - 20px, 1680px);
    padding: 14px 0 44px;
  }
`;

export const CityBanner = styled.section<{ $neon: boolean }>`
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(310px, 46vh, 520px);
  overflow: hidden;
  border: 1px solid rgba(57, 211, 255, 0.64);
  background-color: rgba(0, 9, 21, 0.94);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
  animation: ${bannerArrival} 0.8s ease-out both;
  box-shadow: ${({ $neon }) => $neon
    ? 'inset 0 0 18px rgba(0, 178, 255, 0.18), 0 0 8px rgba(0, 204, 255, 0.22)'
    : 'none'};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(90deg, rgba(0, 7, 18, 0.82), rgba(0, 7, 18, 0.18) 48%, rgba(0, 7, 18, 0.68)),
      linear-gradient(0deg, rgba(0, 6, 17, 0.72), transparent 55%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 14px;
    z-index: 2;
    border: 1px solid rgba(60, 216, 255, 0.22);
    clip-path: polygon(0 0, 14% 0, 14% 2px, 2px 2px, 2px 18%, 0 18%, 0 0, 100% 0, 100% 100%, 86% 100%, 86% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 82%, 100% 82%);
  }

  @media (max-width: 768px) {
    min-height: clamp(250px, 38vh, 340px);
  }
`;

export const BannerImage = styled.img`
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

export const BannerContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(calc(100% - 72px), 1180px);
  overflow: visible;
  padding: 40px 18px;
  text-align: center;
`;

export const BannerTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
`;

export const BannerTag = styled.span`
  padding: 3px 8px;
  border: 1px solid rgba(90, 210, 255, 0.58);
  border-radius: 2px;
  background: rgba(1, 14, 30, 0.68);
  color: var(--whitesmoke) !important;
  font-size: 9px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

export const CityGrid = styled.div<{ $sectionCount: number }>`
  display: grid;
  grid-template-columns: ${({ $sectionCount }) => {
    if ($sectionCount <= 1) return 'minmax(0, 1fr)';
    if ($sectionCount === 2) return 'repeat(2, minmax(0, 1fr))';
    return 'minmax(320px, 1.08fr) minmax(420px, 1.24fr) minmax(310px, 0.92fr)';
  }};
  align-items: start;
  gap: 18px;
  margin-top: 20px;

  @media (max-width: 1280px) {
    grid-template-columns: ${({ $sectionCount }) => $sectionCount <= 1
      ? 'minmax(0, 1fr)'
      : 'repeat(2, minmax(0, 1fr))'};
  }

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const HudPanel = styled.section<{ $gallery?: boolean; $neon: boolean; $standalone?: boolean }>`
  ${panelFrame}
  min-width: 0;
  width: 100%;
  max-height: ${({ $standalone }) => $standalone ? 'none' : 'var(--city-panel-max-height)'};
  height: fit-content;
  overflow: ${({ $standalone }) => $standalone ? 'visible' : 'hidden'};
  padding: 18px;
  box-sizing: border-box;
  animation: ${panelArrival} 0.55s ease-out both;

  ${({ $gallery }) => $gallery && css`
    @media (min-width: 821px) and (max-width: 1280px) {
      grid-column: 1 / -1;
    }
  `}

  @media (max-width: 540px) {
    padding: 14px;
  }
`;

export const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(91, 203, 255, 0.2);
`;

export const PanelTitle = styled.h2<{ $neon: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(14px, 1.1vw, 18px);
  font-weight: 100;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-shadow: ${({ $neon }) => $neon ? '0 0 8px var(--clearneonBlue)' : 'none'};

  svg {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    color: var(--clearneonBlue) !important;
    fill: var(--clearneonBlue) !important;
  }

  svg path {
    fill: var(--clearneonBlue) !important;
  }
`;

export const ViewAllButton = styled.button`
  flex: 0 0 auto;
  border: 0;
  padding: 5px 0;
  background: transparent;
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 11px;
  letter-spacing: 0.6px;
  text-transform: uppercase;

  &:hover,
  &:focus-visible {
    color: var(--whitesmoke);
    text-shadow: 0 0 8px var(--clearneonBlue);
    outline: none;
  }
`;

export const DescriptionButton = styled.button`
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  overflow: hidden;
  background: transparent;
  color: inherit;
  text-align: left;

  &:focus-visible {
    outline: 1px solid var(--clearneonBlue);
    outline-offset: 6px;
  }
`;

export const DescriptionPreview = styled.div`
  position: relative;
  max-height: 360px;
  overflow: hidden;
  color: var(--whitesmoke);

  &::after {
    content: 'Clique para continuar a leitura';
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 54px 6px 4px;
    background: linear-gradient(transparent, rgba(2, 8, 19, 0.98) 68%);
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 10px;
    letter-spacing: 0.8px;
    text-align: right;
    text-transform: uppercase;
  }
`;

export const MiddleColumn = styled.div<{ $single: boolean }>`
  display: grid;
  grid-template-rows: ${({ $single }) => $single ? 'auto' : 'repeat(2, minmax(0, 1fr))'};
  gap: 18px;
  min-width: 0;
  height: ${({ $single }) => $single ? 'fit-content' : 'var(--city-panel-max-height)'};
  max-height: var(--city-panel-max-height);

  > section {
    min-height: 0;
  }

  ${({ $single }) => !$single && css`
    > section {
      height: 100%;
      max-height: none;
    }
  `}

  @media (max-width: 820px) {
    grid-template-rows: none;
    height: auto;
    max-height: none;

    > section {
      height: fit-content;
      max-height: var(--city-panel-max-height);
    }
  }
`;

export const CompactCardGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 3 }) => $columns}, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 540px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const PointCard = styled.article`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(59, 187, 238, 0.34);
  border-radius: 4px;
  background: rgba(7, 22, 39, 0.72);
`;

export const PointImageButton = styled.button<{ $modal?: boolean }>`
  width: ${({ $modal }) => $modal ? '82px' : '58px'};
  height: ${({ $modal }) => $modal ? '82px' : '58px'};
  flex: 0 0 ${({ $modal }) => $modal ? '82px' : '58px'};
  overflow: hidden;
  border: 1px solid rgba(59, 187, 238, 0.45);
  border-radius: 3px;
  padding: 0;
  background: rgba(2, 10, 21, 0.88);

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 10px rgba(0, 204, 255, 0.28);
    outline: none;
  }
`;

export const PointImage = styled(FallbackImage)`
  width: 100%;
  height: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const PointContent = styled.div`
  min-width: 0;
  flex: 1;
  padding: 9px;
`;

export const CardName = styled.h3`
  margin: 0;
  overflow: hidden;
  color: var(--whitesmoke) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 11px;
  font-weight: 100;
  letter-spacing: 0.4px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CardDescription = styled.div`
  display: -webkit-box;
  margin-top: 7px;
  overflow: hidden;
  color: rgba(235, 245, 255, 0.73);
  font-size: 11px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;

  p { margin: 0 !important; font-size: inherit !important; line-height: inherit !important; }
`;

export const CharacterCard = styled.button`
  display: flex;
  min-width: 0;
  min-height: 126px;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(189, 77, 255, 0.34);
  border-radius: 4px;
  padding: 9px 6px;
  background: linear-gradient(180deg, rgba(27, 11, 47, 0.72), rgba(5, 17, 32, 0.8));
  color: inherit;

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonPurple);
    box-shadow: inset 0 0 18px rgba(190, 76, 255, 0.11);
    outline: none;
  }
`;

export const CharacterAvatar = styled(FallbackImage)`
  display: flex;
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--clearneonPurple);
  border-radius: 50%;
  background: rgba(16, 5, 31, 0.88);
  color: var(--clearneonPurple);
  box-shadow: 0 0 12px rgba(188, 70, 255, 0.2);

  img { width: 100%; height: 100%; object-fit: cover; }
  svg { width: 34px; height: 34px; }
`;

export const CharacterName = styled.span`
  max-width: 100%;
  overflow: hidden;
  color: var(--whitesmoke) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 10px;
  letter-spacing: 0.4px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const GalleryGrid = styled.div<{ $standalone?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: 9px;
  justify-content: center;
`;

export const GalleryButton = styled.button<{ $shape: ImageDisplayShape; $standalone?: boolean }>`
  position: relative;
  width: auto;
  height: ${({ $standalone }) => $standalone ? 'clamp(58px, 6.2vw, 104px)' : '72px'};
  flex: 0 0 auto;
  aspect-ratio: ${({ $shape }) => $shape === 'rectangle' ? '16 / 9' : '1'};
  overflow: hidden;
  border: 1px solid rgba(60, 203, 255, 0.32);
  border-radius: ${({ $shape }) => $shape === 'circle' ? '50%' : '3px'};
  padding: 0;
  background: rgba(2, 10, 21, 0.85);

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    outline: none;
  }

  @media (max-width: 540px) {
    height: ${({ $standalone }) => $standalone ? 'clamp(46px, 12.5vw, 64px)' : '64px'};
  }
`;

export const GalleryImage = styled(FallbackImage)<{ $shape: ImageDisplayShape }>`
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
    transition: transform 0.35s ease, filter 0.35s ease;
  }

  ${GalleryButton}:hover & img,
  ${GalleryButton}:focus-visible & img {
    filter: brightness(1.12);
    transform: scale(1.055);
  }
`;

export const ModalDescription = styled.div`
  color: var(--whitesmoke);
  line-height: 1.7;
`;

export const CityModalTitle = styled.span<{ $theme: 'dark' | 'light' }>`
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 18px;
  font-weight: 100;
  letter-spacing: 3px;
  color: var(--black) !important;
  text-shadow: ${({ $theme }) => $theme === 'dark'
    ? '-1px -1px 0 var(--neonBlue), -1px 1px 0 var(--neonBlue), 1px -1px 0 var(--neonBlue), 1px 1px 0 var(--neonBlue)'
    : '-1px -1px 0 var(--neonPink), -1px 1px 0 var(--neonPink), 1px -1px 0 var(--neonPink), 1px 1px 0 var(--neonPink)'};
`;

export const GalleryModalViewport = styled.div`
  width: 100%;
  max-height: min(486px, calc(100dvh - 150px));
  overflow-x: hidden;
  overflow-y: auto;
  padding: 6px 2px 14px;
  box-sizing: border-box;
  overscroll-behavior-y: contain;

  &::-webkit-scrollbar { width: 9px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, 0.72); }
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: var(--clearneonBlue);
  }
`;

export const GalleryModalTrack = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  min-width: 100%;
  align-items: flex-start;
  align-content: flex-start;
  justify-content: center;
  gap: 12px;
`;

export const GalleryModalButton = styled.button<{ $shape: ImageDisplayShape }>`
  width: auto;
  height: 150px;
  flex: 0 0 auto;
  aspect-ratio: ${({ $shape }) => $shape === 'rectangle' ? '16 / 9' : '1'};
  overflow: hidden;
  border: 1px solid rgba(60, 203, 255, 0.42);
  border-radius: ${({ $shape }) => $shape === 'circle' ? '50%' : '4px'};
  padding: 0;
  background: rgba(2, 10, 21, 0.9);

  &:hover,
  &:focus-visible {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 12px rgba(0, 204, 255, 0.32);
    outline: none;
  }

  @media (max-width: 600px) {
    height: 110px;
  }
`;

export const GalleryModalImage = styled(FallbackImage)`
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
  }
`;

export const RelatedPages = styled.div`
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(65, 200, 255, 0.25);
`;

export const RelatedPagesTitle = styled.h3`
  margin: 0 0 12px;
  color: var(--clearneonBlue) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 14px;
  font-weight: 100;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

export const RelatedPageLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(65, 200, 255, 0.14);
  padding: 10px 4px;
  color: var(--whitesmoke);
  text-decoration: none;

  svg { flex: 0 0 auto; color: var(--clearneonBlue); }

  &:hover,
  &:focus-visible {
    color: var(--clearneonBlue);
    outline: none;
  }
`;

export const ModalPointCard = styled(PointCard)`
  height: 100%;
`;

export const ModalCharacterCard = styled(CharacterCard)`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
`;

export const PageState = styled.div<{ $neon?: boolean }>`
  ${panelFrame}
  display: flex;
  width: min(760px, calc(100% - 32px));
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 42px auto;
  padding: 34px;
  text-align: center;

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

export const EmptyCityContent = styled.div<{ $neon?: boolean }>`
  ${panelFrame}
  margin-top: 20px;
  padding: 38px 20px;
  color: rgba(235, 245, 255, 0.74);
  text-align: center;
`;
