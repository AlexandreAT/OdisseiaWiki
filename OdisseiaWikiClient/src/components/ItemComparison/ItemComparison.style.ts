import styled, { css } from 'styled-components';

interface ThemeProps {
  $theme: 'dark' | 'light';
  $neon: boolean;
}

export const ComparisonHeader = styled.span`
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const ComparisonTitle = styled.span<ThemeProps>`
  min-width: 0;
  overflow: hidden;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(18px, 2vw, 27px);
  font-weight: 500;
  letter-spacing: 0.055em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  ${({ $neon, $theme }) => $neon && css`
    color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
    text-shadow: 0 0 8px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}

  @media (max-width: 600px) {
    font-size: 17px;
    white-space: normal;
  }
`;

export const PreviewButton = styled.button<ThemeProps>`
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'} !important;
  border-radius: 5px !important;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'} !important;

  ${({ $neon, $theme }) => $neon && css`
    border-color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'} !important;
    color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'} !important;
    box-shadow: 0 0 7px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}
`;

export const ComparisonRoot = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
`;

export const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 14px;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

export const ComparisonSearchSlot = styled.div`
  grid-column: 1 / -1;
  display: block;

  > div {
    width: 100%;
  }
`;

export const ComparisonColumn = styled.section<ThemeProps>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 174, 255, 0.38)' : 'rgba(111, 0, 168, 0.34)'};
  border-radius: 7px;
  background: ${({ $theme }) => $theme === 'dark'
    ? 'linear-gradient(145deg, rgba(0, 20, 34, 0.72), rgba(7, 8, 16, 0.94))'
    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(232, 228, 238, 0.94))'};
  ${({ $neon, $theme }) => $neon && css`
    border-color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
    box-shadow: inset 0 0 12px ${$theme === 'dark' ? 'rgba(0, 174, 255, 0.08)' : 'rgba(111, 0, 168, 0.08)'};
  `}

  @media (max-width: 600px) {
    padding: 9px;
  }
`;

export const ColumnLabel = styled.h3<ThemeProps>`
  margin: 0;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  font-family: 'DO Futuristic', sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  ${({ $neon, $theme }) => $neon && css`
    color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
    text-shadow: 0 0 5px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}
`;

export const ItemIdentity = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  align-items: center;
  gap: 14px;

  @media (max-width: 520px) {
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 10px;
  }

  @media (max-width: 380px) {
    grid-template-columns: 92px minmax(0, 1fr);
  }
`;

export const ItemImageFrame = styled.div<ThemeProps>`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  border-radius: 4px;
  background: ${({ $theme }) => $theme === 'dark' ? 'var(--black)' : 'var(--lightGrey)'};
  ${({ $neon, $theme }) => $neon && css`
    border-color: ${$theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
    box-shadow: 0 0 9px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  svg {
    width: 42%;
    height: 42%;
    color: var(--grey);
  }
`;

export const IdentityCopy = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
`;

export const ItemName = styled.h4<ThemeProps>`
  margin: 0;
  overflow-wrap: anywhere;
  color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--neonViolet)'};
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 500;
  line-height: 1.05;
  ${({ $neon, $theme }) => $neon && css`
    text-shadow: 0 0 6px ${$theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'};
  `}
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const ItemTag = styled.span<{ $kind?: 'type' | 'subtype' }>`
  padding: 4px 8px;
  border: 1px solid ${({ $kind }) => $kind === 'type' ? 'var(--neonPurple)' : 'var(--neonBlue)'};
  border-radius: 3px;
  color: ${({ $kind }) => $kind === 'type' ? 'var(--clearneonPurple)' : 'var(--clearneonBlue)'};
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
`;

export const MetricList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const MetricCard = styled.div<ThemeProps>`
  min-width: 0;
  min-height: 82px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: 7px 10px;
  padding: 9px 10px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 174, 255, 0.34)' : 'rgba(111, 0, 168, 0.3)'};
  border-radius: 5px;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 8, 18, 0.66)' : 'rgba(255,255,255,.46)'};
`;

export const MetricName = styled.span`
  min-width: 0;
  color: var(--clearneonBlue);
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  line-height: 1.25;
  text-transform: uppercase;
`;

export const MetricValue = styled.strong`
  color: inherit;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
`;

export const MetricTrack = styled.div`
  position: relative;
  grid-column: 1 / -1;
  height: 5px;
  border-radius: 999px;
  background: rgba(83, 97, 142, 0.36);
`;

export const MetricFill = styled.span<{ $percentage: number; $accent?: ItemComparisonMetricAccent }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $percentage }) => Math.min(Math.max($percentage, 0), 100)}%;
  border-radius: inherit;
  background: ${({ $accent }) => $accent === 'green'
    ? 'linear-gradient(90deg, var(--neonGreen), var(--clearneonGreen))'
    : $accent === 'purple'
      ? 'linear-gradient(90deg, var(--neonPurple), var(--clearneonPink))'
      : 'linear-gradient(90deg, var(--clearneonPink), var(--neonPurple))'};
  box-shadow: 0 0 6px currentColor;
`;

type ItemComparisonMetricAccent = 'pink' | 'purple' | 'green';

export const ReferenceMarker = styled.span<{ $percentage: number }>`
  position: absolute;
  z-index: 2;
  top: -5px;
  left: ${({ $percentage }) => Math.min(Math.max($percentage, 0), 100)}%;
  width: 2px;
  height: 15px;
  border-radius: 2px;
  background: var(--clearneonYellow);
  box-shadow: 0 0 6px var(--neonYellow);
  transform: translateX(-50%);

  span {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 8px);
    width: max-content;
    max-width: 210px;
    padding: 6px 8px;
    border: 1px solid var(--clearneonYellow);
    border-radius: 4px;
    background: var(--black);
    color: var(--whitesmoke);
    font-size: 10px;
    font-weight: 500;
    line-height: 1.35;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 4px);
    transition: opacity .16s ease, transform .16s ease;
  }

  &:hover span,
  &:focus span {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  @media (max-width: 600px) {
    span {
      max-width: min(250px, 72vw);
      padding: 8px 10px;
      font-size: 11px;
      line-height: 1.5;
    }
  }
`;

export const DetailList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const DetailCard = styled.div<ThemeProps>`
  min-width: 0;
  min-height: 62px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 174, 255, 0.34)' : 'rgba(111, 0, 168, 0.3)'};
  border-radius: 5px;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 8, 18, 0.62)' : 'rgba(255,255,255,.42)'};

  > svg {
    width: 20px;
    height: 20px;
    color: ${({ $theme }) => $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
  }
`;

export const DetailText = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;

  small {
    color: var(--clearneonBlue);
    font-family: 'Orbitron', sans-serif;
    font-size: 9px;
    line-height: 1.25;
    text-transform: uppercase;
  }

  strong {
    overflow-wrap: anywhere;
    color: inherit;
    font-size: 13px;
    line-height: 1.3;
  }
`;

export const Delta = styled.span<{ $quality: 'better' | 'worse' | 'equal' }>`
  align-self: end;
  color: ${({ $quality }) => $quality === 'better'
    ? 'var(--clearneonGreen)'
    : $quality === 'worse' ? 'var(--clearneonRed)' : 'var(--grey)'};
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
`;

export const LongDetail = styled.div<ThemeProps & { $gold?: boolean }>`
  min-height: 62px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  padding: 10px 11px;
  border: 1px solid ${({ $gold, $theme }) => $gold
    ? 'var(--neonYellow)'
    : $theme === 'dark' ? 'rgba(0, 174, 255, 0.34)' : 'rgba(111, 0, 168, 0.3)'};
  border-radius: 5px;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 8, 18, 0.62)' : 'rgba(255,255,255,.42)'};

  > svg {
    width: 21px;
    height: 21px;
    color: ${({ $gold, $theme }) => $gold
      ? 'var(--clearneonYellow)'
      : $theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'};
  }

  ${({ $neon, $gold }) => $neon && css`
    box-shadow: inset 0 0 8px ${$gold ? 'rgba(255, 216, 0, .06)' : 'rgba(0, 174, 255, .06)'};
  `}
`;

export const SearchPanel = styled.div<ThemeProps>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 10px;
  border: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 174, 255, 0.35)' : 'rgba(111, 0, 168, 0.3)'};
  border-radius: 6px;
  background: ${({ $theme }) => $theme === 'dark' ? 'rgba(0, 5, 13, .72)' : 'rgba(255,255,255,.5)'};

  p {
    margin: 0;
    color: var(--grey);
    font-size: 11px;
  }
`;

export const EmptyCandidate = styled.div`
  min-height: 230px;
  display: grid;
  place-items: center;
  padding: 24px;
  color: var(--grey);
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
`;

export const RuntimeNotice = styled.div<{ $warning?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 10px;
  border: 1px solid ${({ $warning }) => $warning ? 'var(--clearneonYellow)' : 'rgba(0, 174, 255, .28)'};
  border-radius: 5px;
  color: ${({ $warning }) => $warning ? 'var(--clearneonYellow)' : 'var(--grey)'};
  font-size: 11px;
  line-height: 1.4;

  svg {
    flex: 0 0 16px;
    margin-top: 1px;
  }

  @media (max-width: 600px) {
    padding: 10px;
    font-size: 12px;
    line-height: 1.5;
  }
`;

export const LoadingLine = styled.div`
  height: 2px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0, 174, 255, .16);

  &::after {
    content: '';
    display: block;
    width: 35%;
    height: 100%;
    background: var(--clearneonBlue);
    box-shadow: 0 0 7px var(--neonBlue);
    animation: comparison-loading 1.1s ease-in-out infinite alternate;
  }

  @keyframes comparison-loading {
    from { transform: translateX(-20%); }
    to { transform: translateX(210%); }
  }
`;
