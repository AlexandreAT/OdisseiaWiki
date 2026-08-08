import styled, { css } from 'styled-components';
import { FallbackImage } from '../Generic/FallbackImage/FallbackImage';

interface ThemeProps {
  $theme: 'dark' | 'light';
  $neon: boolean;
}

const accentFor = (candidate?: boolean, theme: 'dark' | 'light' = 'dark') => {
  if (candidate) return 'var(--clearneonPink)';
  return theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)';
};

export const ComparisonHeader = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  min-width: 0;
`;

export const ModalTitle = styled.span<ThemeProps>`
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  overflow: hidden;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(18px, 2vw, 27px);
  font-weight: 500;
  letter-spacing: 0.05em;
  line-height: 1.1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;

  ${({ $neon, $theme }) => $neon && css`
    color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
    text-shadow: 0 0 7px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}

  > svg {
    flex: 0 0 auto;
    color: currentColor;
  }

  .comparison-character-name {
    overflow: hidden;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-overflow: ellipsis;
  }

  @media (max-width: 600px) {
    gap: 7px;
    font-size: 15px;

    .comparison-character-name {
      display: none;
    }
  }
`;

export const PreviewButton = styled.button<ThemeProps>`
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 38px;
  margin-left: 2px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'} !important;
  border-radius: 5px !important;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 13, 24, 0.76)' : 'rgba(245, 240, 249, 0.92)'} !important;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'} !important;
  cursor: pointer;

  ${({ $neon, $theme }) => $neon && css`
    border-color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'} !important;
    box-shadow: 0 0 7px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}

  &:hover,
  &:focus-visible {
    outline: 0;
    box-shadow: 0 0 8px ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  }
`;

export const ComparisonRoot = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  overflow-x: hidden;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
`;

export const SearchArea = styled.section`
  position: relative;
  z-index: 5;
  width: 100%;

  > div {
    width: 100%;
  }
`;

export const SearchFeedback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 7px 10px;
  color: var(--lightGrey);
  font-size: 0.82rem;
  text-align: center;
`;

export const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 14px;
  min-width: 0;

  @media (max-width: 880px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const CharacterCard = styled.article<ThemeProps & { $candidate?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 615px;
  padding: 18px 20px 17px;
  isolation: isolate;
  --comparison-accent: ${({ $candidate, $theme }) => accentFor($candidate, $theme)};
  --comparison-accent-soft: ${({ $candidate }) => $candidate
    ? 'rgba(255, 0, 184, 0.33)'
    : 'rgba(77, 238, 234, 0.34)'};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -2;
    background: ${({ $candidate, $theme }) => {
      if ($theme === 'light') {
        return $candidate
          ? 'linear-gradient(145deg, rgba(255, 248, 254, 0.98), rgba(239, 228, 242, 0.96))'
          : 'linear-gradient(145deg, rgba(248, 253, 255, 0.98), rgba(226, 238, 243, 0.96))';
      }
      return $candidate
        ? 'radial-gradient(circle at 15% 12%, rgba(198, 16, 174, 0.11), transparent 34%), linear-gradient(145deg, rgba(3, 14, 27, 0.97), rgba(5, 7, 15, 0.98))'
        : 'radial-gradient(circle at 15% 12%, rgba(0, 184, 255, 0.12), transparent 34%), linear-gradient(145deg, rgba(0, 18, 32, 0.97), rgba(4, 7, 14, 0.98))';
    }};
    clip-path: polygon(
      12px 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% calc(100% - 12px),
      calc(100% - 12px) 100%,
      12px 100%,
      0 calc(100% - 12px),
      0 12px
    );
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    padding: ${({ $neon }) => $neon ? '2px' : '1px'};
    pointer-events: none;
    background: ${({ $candidate, $theme, $neon }) => {
      const accent = accentFor($candidate, $theme);
      return $neon ? accent : `color-mix(in srgb, ${accent} 45%, transparent)`;
    }};
    clip-path: polygon(
      12px 0,
      calc(100% - 12px) 0,
      100% 12px,
      100% calc(100% - 12px),
      calc(100% - 12px) 100%,
      12px 100%,
      0 calc(100% - 12px),
      0 12px
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  ${({ $neon, $candidate }) => $neon && css`
    filter: drop-shadow(0 0 5px ${$candidate ? 'rgba(255, 0, 184, 0.2)' : 'rgba(77, 238, 234, 0.2)'});
  `}

  @media (max-width: 880px) {
    min-height: auto;
  }

  @media (max-width: 520px) {
    padding: 15px 11px 14px;
  }
`;

export const CardEyebrow = styled.span<{ $candidate?: boolean }>`
  display: block;
  margin-bottom: 10px;
  color: ${({ $candidate }) => $candidate ? 'var(--clearneonPink)' : 'var(--clearneonBlue)'};
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: 0.085em;
  text-transform: uppercase;
`;

export const Identity = styled.header`
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  min-width: 0;

  @media (max-width: 430px) {
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 10px;
  }
`;

export const Avatar = styled(FallbackImage)<{ $candidate?: boolean; $neon: boolean }>`
  width: 84px;
  height: 84px;
  overflow: hidden;
  border: 2px solid ${({ $candidate }) => $candidate ? 'var(--clearneonPink)' : 'var(--clearneonBlue)'};
  border-radius: 50%;
  background: var(--black);
  box-shadow: ${({ $neon, $candidate }) => $neon
    ? `0 0 8px ${$candidate ? 'rgba(255, 0, 184, 0.5)' : 'rgba(77, 238, 234, 0.5)'}`
    : 'none'};

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 430px) {
    width: 68px;
    height: 68px;
  }
`;

export const IdentityText = styled.div<Pick<ThemeProps, '$theme'> & { $candidate?: boolean }>`
  min-width: 0;

  h3 {
    margin: 0 0 7px;
    color: ${({ $candidate, $theme }) => accentFor($candidate, $theme)};
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1.25rem, 2.3vw, 1.75rem);
    font-weight: 500;
    line-height: 1.05;
    overflow-wrap: anywhere;
  }
`;

export const SystemLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--lightGrey);
  font-size: 0.76rem;
  line-height: 1.35;

  svg {
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
    color: var(--comparison-accent);
  }

  span {
    min-width: 0;
    color: inherit;
  }

  b {
    color: var(--comparison-accent);
    font-weight: 500;
  }

  i {
    color: var(--grey);
    font-style: normal;
  }

  @media (max-width: 560px) {
    flex-wrap: wrap;
    row-gap: 2px;
    font-size: 0.78rem;
  }
`;

export const RuntimeWarning = styled.div<{ $different?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  margin-top: 7px;
  padding: 4px 7px;
  border: 1px solid ${({ $different }) => $different ? 'var(--neonOrange)' : 'var(--neonYellow)'};
  border-radius: 3px;
  background: rgba(255, 173, 0, 0.08);
  color: ${({ $different }) => $different ? 'var(--clearneonOrange)' : 'var(--clearneonYellow)'};
  font-size: 0.7rem;
  line-height: 1.2;

  svg {
    width: 15px;
    height: 15px;
    color: currentColor;
  }
`;

export const RadarFigure = styled.figure`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 540px;
  min-height: 382px;
  margin: 3px auto 1px;

  @media (max-width: 520px) {
    min-height: 270px;
  }
`;

export const RadarSvg = styled.svg<ThemeProps>`
  display: block;
  width: 100%;
  height: auto;
  max-height: 420px;
  overflow: visible;

  .radar-grid {
    fill: none;
    stroke: ${({ $theme }) => $theme === 'dark' ? 'rgba(189, 189, 189, 0.25)' : 'rgba(44, 44, 44, 0.24)'};
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .radar-axis {
    stroke: ${({ $theme }) => $theme === 'dark' ? 'rgba(189, 189, 189, 0.27)' : 'rgba(44, 44, 44, 0.25)'};
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .radar-scale {
    fill: ${({ $theme }) => $theme === 'dark' ? 'rgba(229, 229, 229, 0.54)' : 'rgba(44, 44, 44, 0.54)'};
    font: 10px 'Nunito', sans-serif;
  }

  .radar-area {
    stroke-width: 2.25;
    vector-effect: non-scaling-stroke;
  }

  .radar-area.current {
    fill: rgba(0, 184, 255, 0.18);
    stroke: var(--clearneonBlue);
  }

  .radar-area.candidate {
    fill: rgba(255, 0, 184, 0.17);
    stroke: var(--clearneonPink);
  }

  .radar-area.secondary {
    opacity: 0.48;
  }

  .radar-area.primary {
    opacity: 1;
    filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 4px currentColor)' : 'none'};
  }

  .radar-dot {
    stroke-width: 1.25;
    vector-effect: non-scaling-stroke;
  }

  .radar-dot.current {
    fill: var(--clearneonBlue);
    stroke: var(--neonBlue);
  }

  .radar-dot.candidate {
    fill: var(--clearneonPink);
    stroke: var(--neonPink);
  }

  .radar-dot.secondary {
    opacity: 0.5;
  }

  .radar-label {
    fill: ${({ $theme }) => $theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    font: 13px 'Nunito', sans-serif;
  }

  .radar-value {
    fill: ${({ $theme }) => $theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    font-size: 12px;
    font-weight: 800;
  }

  .radar-delta {
    font-size: 10px;
    font-weight: 800;
  }

  .radar-delta.positive { fill: var(--clearneonGreen); }
  .radar-delta.negative { fill: var(--clearneonRed); }
  .radar-delta.equal { fill: var(--lightGrey); }

  @media (max-width: 520px) {
    max-height: 350px;

    .radar-scale { font-size: 13px; }
    .radar-label { font-size: 18px; }
    .radar-value { font-size: 16px; }
    .radar-delta { font-size: 14px; }
  }
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 0.72fr 0.72fr 1.56fr;
  margin-top: auto;
  overflow: hidden;
  border: 1px solid var(--comparison-accent-soft);
  border-radius: 5px;

  @media (max-width: 460px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 68px;
  padding: 8px;
  text-align: center;

  & + & {
    border-left: 1px solid var(--comparison-accent-soft);
  }

  small {
    display: block;
    color: var(--comparison-accent);
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.055em;
    text-transform: uppercase;
  }

  > strong {
    margin-top: 3px;
    font-size: 1.18rem;
  }

  @media (max-width: 460px) {
    min-height: 62px;

    small {
      font-size: 0.74rem;
    }

    &:last-child {
      grid-column: 1 / -1;
      border-top: 1px solid var(--comparison-accent-soft);
      border-left: 0;
    }
  }
`;

export const DefenseRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  width: 100%;
  margin-top: 5px;

  > span {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    color: var(--lightGrey);
    font-size: 0.62rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  b {
    margin-top: 2px;
    color: inherit;
    font-size: 0.85rem;
  }

  @media (max-width: 460px) {
    > span {
      font-size: 0.7rem;
    }

    b {
      font-size: 0.9rem;
    }
  }
`;

export const DeltaText = styled.em<{ $kind: 'positive' | 'negative' | 'equal' }>`
  display: inline-block;
  margin-left: 4px;
  color: ${({ $kind }) => $kind === 'positive'
    ? 'var(--clearneonGreen)'
    : $kind === 'negative' ? 'var(--clearneonRed)' : 'var(--lightGrey)'};
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 700;
`;

export const EmptyCandidate = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 420px;
  padding: 28px;
  color: var(--lightGrey);
  text-align: center;

  svg {
    width: 35px;
    height: 35px;
    margin-bottom: 3px;
    color: var(--clearneonPink);
    opacity: 0.8;
  }

  strong {
    color: var(--whitesmoke);
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 500;
  }

  span {
    max-width: 390px;
    color: var(--lightGrey);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  @media (max-width: 880px) {
    min-height: 210px;
  }
`;

export const ErrorState = styled.div`
  padding: 9px 11px;
  border: 1px solid var(--neonRed);
  border-radius: 4px;
  background: rgba(210, 39, 48, 0.08);
  color: var(--clearneonRed);
  font-size: 0.82rem;
`;

export const RuntimeNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border: 1px solid rgba(77, 238, 234, 0.42);
  border-radius: 4px;
  color: var(--lightGrey);
  font-size: 0.76rem;
  line-height: 1.35;

  svg {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
    color: var(--clearneonBlue);
  }
`;

export const CompareButton = styled.button<ThemeProps & { $absolute?: boolean }>`
  ${({ $absolute }) => $absolute && css`
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 9;
  `}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  border-radius: 4px;
  background: rgba(0, 10, 20, 0.78);
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  cursor: pointer;
  transition: color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  svg {
    width: 19px;
    height: 19px;
    fill: currentColor;
  }

  ${({ $neon, $theme }) => $neon && css`
    box-shadow: 0 0 6px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}

  &:hover,
  &:focus-visible {
    outline: 0;
    box-shadow: 0 0 7px ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  }
`;
