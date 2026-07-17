import styled, { css } from 'styled-components';
import {
  HudBottomLine,
  HudCornerEl,
  HudLeftLine,
  HudRightLine,
  HudTopLine,
} from '../../../Personagem/PersonagemPage.style';
import { FallbackImage } from '../../../../components/Generic/FallbackImage/FallbackImage';
import { ValueText } from '../../../../components/Generic/StatusBar/StatusBar.style';

interface ThemeProps {
  $themeMode: 'dark' | 'light';
  $neon: 'on' | 'off';
}

export const HudCard = styled.article<ThemeProps>`
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
  padding: 25px 28px 27px;
  border: 0;
  outline: 0;
  box-sizing: border-box;
  color: ${({ $themeMode }) => $themeMode === 'dark' ? 'var(--whitesmoke)' : 'var(--black)'};
  background: transparent;
  transition: transform 180ms ease, filter 180ms ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: ${({ $themeMode }) => $themeMode === 'dark'
      ? 'linear-gradient(135deg, rgba(0, 5, 15, 0.94), rgba(4, 21, 32, 0.86))'
      : 'linear-gradient(135deg, rgba(245, 250, 255, 0.95), rgba(208, 233, 244, 0.88))'};
    clip-path: polygon(
      13px 0, calc(100% - 13px) 0,
      100% 13px, 100% calc(100% - 13px),
      calc(100% - 13px) 100%, 13px 100%,
      0 calc(100% - 13px), 0 13px
    );
  }

  @media (hover: hover) {
    &:hover {
      transform: translateY(-4px);
      filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.32));

      ${HudCornerEl},
      ${HudTopLine},
      ${HudBottomLine},
      ${HudLeftLine},
      ${HudRightLine} {
        filter: ${({ $neon }) => $neon === 'on'
          ? 'drop-shadow(0 0 3px var(--clearneonBlue)) drop-shadow(0 0 8px rgba(0, 210, 255, 0.7))'
          : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))'};
      }

      &::before {
        background: ${({ $themeMode }) => $themeMode === 'dark'
          ? 'linear-gradient(135deg, rgba(0, 9, 24, 0.97), rgba(5, 31, 45, 0.92))'
          : 'linear-gradient(135deg, rgba(250, 253, 255, 0.98), rgba(198, 235, 249, 0.94))'};
      }
    }
  }

  @media (max-width: 600px) {
    gap: 11px;
    padding: 22px 18px 24px;
  }
`;

export const SelectionMarker = styled.span<{ $selected: boolean }>`
  position: absolute;
  top: 17px;
  right: 17px;
  z-index: 8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${({ $selected }) => $selected ? 'var(--clearneonRed)' : 'var(--neonRed)'};
  background: transparent;
  filter: ${({ $selected }) => $selected ? 'drop-shadow(0 0 5px var(--neonRed))' : 'none'};
  transition: color 160ms ease, filter 160ms ease;
  pointer-events: none;

  svg {
    width: 25px;
    height: 25px;
    fill: currentColor;
  }

  @media (max-width: 600px) {
    top: 14px;
    right: 14px;
    width: 26px;
    height: 26px;

    svg {
      width: 23px;
      height: 23px;
    }
  }
`;

export const CharacterHeader = styled.div`
  display: grid;
  grid-template-columns: clamp(92px, 23vw, 126px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(12px, 3vw, 22px);
  min-width: 0;

  @media (max-width: 390px) {
    grid-template-columns: 78px minmax(0, 1fr);
    gap: 10px;
  }
`;

export const CharacterAvatar = styled(FallbackImage)<ThemeProps>`
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  border-radius: 50%;
  flex: 0 0 auto;
  border: 2px solid ${({ $neon }) => $neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'};
  box-shadow: ${({ $neon }) => $neon === 'on'
    ? '0 0 8px var(--clearneonBlue), inset 0 0 7px rgba(0, 210, 255, 0.45)'
    : '0 0 5px rgba(0, 210, 255, 0.32)'};
`;

export const StatusColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;

  ${ValueText} {
    font-size: 0.68rem;
  }
`;

export const CharacterName = styled.h3`
  margin: 0 0 3px;
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(0.95rem, 2vw, 1.2rem);
  font-weight: 500;
  letter-spacing: 1.5px;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-shadow: 0 0 5px rgba(0, 210, 255, 0.55);
`;

export const StatusItem = styled.div`
  display: grid;
  grid-template-columns: 55px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  min-width: 0;

  @media (max-width: 600px) {
    > :last-child {
      width: calc(100% - 7px);
    }
  }

  @media (max-width: 390px) {
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 5px;
  }
`;

export const StatusLabel = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;

  @media (max-width: 390px) {
    font-size: 0.57rem;
  }
`;

export const InfoRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-block: 1px solid rgba(0, 210, 255, 0.28);
  min-width: 0;

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const InfoItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  padding: 10px 8px;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 160ms ease;

  & + & {
    border-left: 1px solid rgba(0, 210, 255, 0.28);
  }

  &:focus-visible {
    outline: 1px solid var(--clearneonBlue);
    outline-offset: -2px;
  }

  @media (hover: hover) {
    &:hover {
      background: rgba(0, 210, 255, 0.07);
    }
  }

  > span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  @media (max-width: 600px) {
    gap: 5px;
    padding-inline: 5px;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding: 8px 10px;

    & + & {
      border-left: 0;
      border-top: 1px solid rgba(0, 210, 255, 0.28);
    }
  }
`;

export const InfoIcon = styled.span<{ $icon: string }>`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  background: var(--clearneonBlue);
  mask: url(${({ $icon }) => $icon}) center / contain no-repeat;
  -webkit-mask: url(${({ $icon }) => $icon}) center / contain no-repeat;
  transition: background 160ms ease, filter 160ms ease;

  ${InfoItem}:hover &,
  ${InfoItem}:focus-visible & {
    background: var(--neonBlue);
    filter: drop-shadow(0 0 4px rgba(0, 210, 255, 0.5));
  }

  @media (max-width: 600px) {
    width: 18px;
    height: 18px;
    flex-basis: 18px;
  }
`;

export const InfoLabel = styled.small`
  color: var(--clearneonBlue);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.7px;
  text-transform: uppercase;
`;

export const InfoValue = styled.strong`
  display: block;
  min-width: 0;
  font-size: 0.7rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    white-space: normal;
    overflow-wrap: anywhere;
  }
`;

export const XpSection = styled.div<{ $ready: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: stretch;
  gap: 12px;
  padding: 8px 10px 8px 0;
  border: 1px solid var(--neonYellow);
  background: rgba(0, 0, 0, 0.22);
  ${({ $ready }) => $ready && css`
    box-shadow: 0 0 7px rgba(255, 235, 0, 0.48), inset 0 0 8px rgba(255, 235, 0, 0.08);
  `}

  @media (max-width: 390px) {
    gap: 8px;
  }
`;

export const LevelFlag = styled.button`
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 7px 13px 7px 10px;
  border: 0;
  margin-block: -8px;
  color: var(--clearneonYellow);
  background: rgba(255, 214, 0, 0.16);
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%);
  font: inherit;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 0.69rem;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;

  @media (hover: hover) {
    &:hover {
      color: var(--black);
      background: var(--clearneonYellow);
      text-shadow: none;
    }
  }

  @media (max-width: 390px) {
    min-width: 68px;
    padding-inline: 7px 12px;
    font-size: 0.6rem;
  }
`;

export const ProgressBody = styled.div`
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  min-width: 0;
`;

export const ProgressHeader = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  color: var(--clearneonYellow);
  font-size: 0.76rem;

  span { min-width: 0; text-align: center; overflow-wrap: anywhere; }
`;

export const ProgressTrack = styled.div`
  width: 100%;
  height: 7px;
  overflow: hidden;
  border: 1px solid var(--neonYellow);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.62);
`;

export const ProgressFill = styled.div<{ $progress: number; $ready: boolean }>`
  width: ${({ $progress }) => `${$progress}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ $ready }) => $ready ? 'var(--clearneonYellow)' : 'var(--neonYellow)'};
  box-shadow: 0 0 8px var(--clearneonYellow);
  transition: width 250ms ease;
`;

export const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 9px;
  min-width: 0;
`;

export const DetailItem = styled.div`
  min-width: 0;
  padding: 8px 10px;
  border-left: 2px solid var(--neonBlue);
  background: rgba(0, 210, 255, 0.06);
`;

export const DetailLink = styled.button`
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 160ms ease;

  @media (hover: hover) {
    &:hover { color: var(--clearneonBlue); }
  }
`;

export const DetailLabel = styled.small`
  display: block;
  margin-bottom: 3px;
  color: var(--clearneonBlue);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.7px;
  text-transform: uppercase;
`;

export const DetailValue = styled.span`
  display: block;
  min-width: 0;
  font-size: 0.76rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
`;

export const ProficiencyValue = styled(DetailValue)`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
`;

export const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  > button:last-child {
    grid-column: 1 / -1;
  }
`;

export const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  min-height: 36px;
  padding: 7px 10px;
  border: 1px solid var(--neonBlue);
  background: rgba(0, 15, 28, 0.78);
  color: var(--clearneonBlue);
  font: inherit;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;

  svg {
    width: 17px;
    height: 17px;
    color: inherit;
    fill: currentColor;
  }

  svg path {
    color: currentColor !important;
    fill: currentColor !important;
  }

  &:focus-visible {
    outline: 2px solid var(--clearneonYellow);
    outline-offset: 2px;
  }

  @media (hover: hover) {
    &:hover {
      color: var(--black);
      background: var(--clearneonBlue);
      box-shadow: 0 0 8px rgba(0, 210, 255, 0.68);
    }
  }
`;
