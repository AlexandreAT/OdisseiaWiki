import styled, { keyframes } from 'styled-components';
import { cyberButtonsFillWidth } from '../../../components/Generic/HighlightButton/HighlightButton.styles';
import { GameFrame } from '../GameShared.style';

export const LandingSection = styled(GameFrame)`
  display: grid;
  gap: 20px;
`;

export const SectionHeading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 600px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const ActiveRunContent = styled.div`
  display: grid;
  grid-template-columns: minmax(170px, .85fr) minmax(0, 1.5fr) auto;
  align-items: center;
  gap: 18px;

  @media (max-width: 950px) {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
`;

export const ActiveRunActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 350px);
  gap: 10px;
  ${cyberButtonsFillWidth}

  @media (max-width: 600px) {
    width: 100%;
    button { font-size: 10px; }
  }
`;

export const ActiveRunIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

export const ActiveRunName = styled.div`
  min-width: 0;
  max-width: 100%;
`;

export const ActiveRunResources = styled.div`
  min-width: 0;

  @media (max-width: 950px) {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  @media (max-width: 600px) {
    grid-column: auto;
    grid-row: auto;
  }
`;

export const ActiveRunSummary = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
  span {
    color: #b8c8d7;
    font-size: .78rem;
  }
`;

export const CharacterSearch = styled.div`
  width: min(100%, 430px);
`;

export const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
  gap: 14px;
`;

export const GameChoiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  max-height: min(65vh, 680px);
  overflow-y: auto;
  padding: 8px 4px 12px;
  @media (max-width: 740px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 490px) { grid-template-columns: 1fr; }
`;

export const GameChoiceCard = styled.button`
  display: grid;
  align-content: start;
  gap: 9px;
  min-width: 0;
  padding: 0 0 14px;
  text-align: left;
  color: var(--whitesmoke);
  background: rgba(1, 14, 25, .78);
  border: 1px solid var(--neonBlue);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color .2s, box-shadow .2s, transform .2s;
  &:hover, &:focus-visible {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 15px rgba(0, 187, 255, .28);
    transform: translateY(-2px);
  }
  &:disabled { opacity: .55; cursor: wait; transform: none; }
  img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  strong { padding: 0 12px; font-family: 'DO Futuristic', sans-serif; color: var(--clearneonBlue); }
  small { padding: 0 12px; color: #b8c8d7; line-height: 1.35; }
`;

export const CharacterCard = styled.div`
  position: relative;
  min-width: 0;
`;

const warningAppear = keyframes`
  from { opacity: 0; transform: translateY(-7px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const warningDisappear = keyframes`
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(-7px) scale(.98); }
`;

export const CharacterWarningButton = styled.button`
  position: absolute;
  z-index: 1;
  top: 9px;
  right: 9px;
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(245, 199, 60, .62);
  border-radius: 50%;
  background: rgba(9, 20, 29, .88);
  color: var(--clearneonYellow);
  cursor: pointer;
  transition: color .2s, border-color .2s, box-shadow .2s;

  svg { font-size: 15px; }
  &:hover, &[aria-expanded='true'] {
    border-color: var(--clearneonYellow);
    box-shadow: 0 0 10px rgba(245, 199, 60, .34);
  }
  &:focus-visible { outline: 2px solid var(--clearneonYellow); outline-offset: 2px; }
`;

export const CharacterWarningTooltip = styled.div<{ $top: number; $left: number; $closing: boolean }>`
  position: fixed;
  z-index: 12000;
  top: ${({ $top }) => `${$top}px`};
  left: ${({ $left }) => `${$left}px`};
  width: min(340px, calc(100vw - 24px));
  max-height: min(300px, calc(100vh - 24px));
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  padding: 12px 14px;
  border: 1px solid var(--clearneonYellow);
  border-radius: 9px;
  background: rgba(5, 16, 28, .97);
  box-shadow: 0 10px 26px rgba(0, 0, 0, .45), 0 0 10px rgba(245, 199, 60, .1);
  color: var(--whitesmoke);
  animation: ${({ $closing }) => $closing ? warningDisappear : warningAppear} .18s ease both;

  strong {
    display: block;
    margin-bottom: 8px;
    color: var(--clearneonYellow);
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: .04em;
  }
  p { margin: 0; color: #d0dae0; font-size: .81rem; line-height: 1.45; }
  p + p { margin-top: 9px; padding-top: 9px; border-top: 1px solid rgba(245, 199, 60, .2); }

  @media (prefers-reduced-motion: reduce) { animation: none; }
`;

export const CharacterChoice = styled.button<{ $selected: boolean }>`
  box-sizing: border-box;
  min-width: 0;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 116px;
  padding: 14px;
  border: 1px solid ${({ $selected }) => $selected ? 'var(--clearneonBlue)' : 'rgba(185, 211, 224, .25)'};
  border-radius: 10px;
  background: ${({ $selected }) => $selected ? 'rgba(77, 238, 234, .14)' : 'rgba(15, 39, 56, .68)'};
  box-shadow: ${({ $selected }) => $selected ? '0 0 18px rgba(77, 238, 234, .12)' : 'none'};
  color: var(--whitesmoke);
  text-align: left;
  transition: border-color .2s, background .2s, transform .2s;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--clearneonBlue);
  }
  &:focus-visible {
    outline: 2px solid var(--clearneonBlue);
    outline-offset: 3px;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: .6;
    transform: none;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const CharacterPortrait = styled.div`
  width: 72px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(77, 238, 234, .4);
  border-radius: 50%;
  background: rgba(77, 238, 234, .08);
  color: var(--clearneonBlue);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  svg { font-size: 2rem; }
`;

export const CharacterInfo = styled.span`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 7px;
  padding-right: 30px;
  strong {
    display: block;
    min-width: 0;
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1rem, 1.5vw, 1.25rem);
    font-weight: 100;
    letter-spacing: .04em;
    color: var(--clearneonBlue);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    display: -webkit-box;
    min-width: 0;
    color: #a9c0cc;
    line-height: 1.3;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;

