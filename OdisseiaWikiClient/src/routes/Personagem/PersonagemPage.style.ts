import styled, { css } from 'styled-components';
import { wikiHeading1Style, wikiHeading2Style, wikiHeading3Style, wikiParagraphStyle, wikiListStyle, wikiBlockquoteStyle, wikiCodeStyle, wikiLinkStyle } from '../Wiki/shared/WikiTextStyles';
import HudCorner from '../../assets/svg/HudCorner.svg';
import Hexagono from '../../assets/svg/Hexagono.svg';
import HexagonoFill from '../../assets/svg/HexagonoFill.svg';
import { FallbackImage } from '../../components/Generic/FallbackImage/FallbackImage';

export const BackgroundVideoContainer = styled.div`
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
`;

export const PageController = styled.div`
  width: 100%;
  max-width: 100vw;
  padding-top: 24px;

  @media (max-width: 1100px) {
    min-width: 0;
    box-sizing: border-box;
  }
`

export const PageLoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: calc(100svh - var(--main-header-height, 85px));
  padding: 40px 16px 24px;
  box-sizing: border-box;
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-size: 18px;
  letter-spacing: 1px;
  text-align: center;
  text-shadow: 0 0 7px var(--clearneonBlue);

  @media (max-width: 768px) {
    min-height: calc(100svh - var(--main-header-height, 54px));
    padding: 24px 12px;
    font-size: 14px;
  }
`;

export const BackgroundVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const BackgroundOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 20, 0.75);
  pointer-events: none;
`;

export const PageContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
  gap: 24px;
  align-items: flex-start;
  position: relative;
  z-index: 1;

  @media (max-width: 1100px) {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 10px;
  }
`;

export const TopSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 12px;
    padding: 0 15px 25px;

    @media (max-width: 1100px) {
      flex-direction: column;
      min-width: 0;
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      padding: 0 0 20px;
      gap: 24px;
    }
`;

export const BottomInfoLeft = styled.div`
  width: 35%;
  min-width: 0;

  &:only-child {
    width: 100%;
  }

  @media (max-width: 1100px) {
    width: 100%;
  }
`

export const BottomInfoRight = styled.div`
  width: 65%;
  min-width: 0;

  &:only-child {
    width: 100%;
  }

  @media (max-width: 1100px) {
    width: 100%;
  }
`

export const BottomSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 25px;
    padding: 0 25px;

    @media (max-width: 1100px) {
      display: grid;
      grid-template-columns: minmax(0, 38fr) minmax(0, 62fr);
      min-width: 0;
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      grid-template-columns: minmax(0, 1fr);
      gap: 20px;
      padding: 0;
    }
`;

export const AvatarDivController = styled.div`
    display: flex;
    width: 50%;
    gap: 25px;

    @media (max-width: 1100px) {
      width: 100%;
      min-width: 0;
      align-items: stretch;

      > :last-child {
        flex: 1;
        min-width: 0;
        max-width: none;
      }
    }

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      gap: 20px;

      > :last-child {
        width: 100%;
        flex: none;
      }
    }
`;

export const AvatarWrapper = styled.div`
    min-width: 300px;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 1100px) {
      --avatar-size: clamp(180px, 20vw, 210px);
      flex: 0 0 var(--avatar-size);
      width: var(--avatar-size);
      min-width: var(--avatar-size);
      min-height: var(--avatar-size);

      > button {
        width: var(--avatar-size) !important;
        height: var(--avatar-size) !important;
        transform: none;
      }

      .iconAvatar {
        width: 100%;
        height: 100%;
      }
    }

    @media (max-width: 768px) {
      --avatar-size: clamp(150px, 48vw, 200px);
      flex-basis: var(--avatar-size);
    }
`;

export const MetaRow = styled.div`
  margin-top: 6px;
`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
`;

export const CardContent = styled.div<{ gap?: number, maxWidth?: string, maxHeight?: string, neon: 'on' | 'off'; $color?: string }>`
  padding: 16px;
  width: 100%;
  max-width: ${({ maxWidth }) => maxWidth || 'none'};
  max-height: ${({ maxHeight }) => maxHeight || 'none'};
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap ?? 0}px;
  position: relative;
  z-index: 2;
  background: rgba(0, 0, 10, 0.65);
  min-width: 0;
  box-sizing: border-box;
  box-shadow: ${({ neon, $color }) => neon === 'on' ? `inset 0 0 20px ${$color ?? 'var(--neonBlue)'}` : 'none'};
  clip-path: polygon(
    12px 0, calc(100% - 12px) 0, 100% 12px,
    100% calc(100% - 12px), calc(100% - 12px) 100%,
    12px 100%, 0 calc(100% - 12px), 0 12px
  );

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    clip-path: polygon(
      12px 0, calc(100% - 12px) 0, 100% 12px,
      100% calc(100% - 12px), calc(100% - 12px) 100%,
      12px 100%, 0 calc(100% - 12px), 0 12px
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 3px;
  }

  transition: all 0.2s ease;
`;

export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const HudCornerEl = styled.div<{ $position: CornerPosition; $color?: string; $clearColor?: string; $neon?: boolean }>` 
  position: absolute;
  width: 50px;
  height: 50px;
  pointer-events: none;
  z-index: 3;
  filter: ${({ $color, $clearColor, $neon }) => {
    const glow = $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)');
    return `
    drop-shadow(0 0 2px ${glow})
    drop-shadow(0 0 4px ${glow})
    drop-shadow(0 0 8px ${glow})
    drop-shadow(0 0 16px ${glow})
  `; }};

  ${({ $position, $color, $clearColor, $neon }) => {
    const clearColor = $clearColor ?? 'var(--clearneonBlue)';
    if ($neon) {
      switch ($position) {
        case 'bottom-left':
          return css`bottom: 0; left: 0; transform: scale(1, 1); background-color: ${clearColor};`;
        case 'bottom-right':
          return css`bottom: 0; right: 0; transform: scaleX(-1); background-color: ${clearColor};`;
        case 'top-left':
          return css`top: 0; left: 0; transform: scaleY(-1); background-color: ${clearColor};`;
        case 'top-right':
          return css`top: 0; right: 0; transform: scale(-1); background-color: ${clearColor};`;
        default:
          return css``;
      }
    }
    const color = $color ?? 'var(--neonBlue)';
    switch ($position) {
      case 'bottom-left':
        return css`
          bottom: 0;
          left: 0;
          transform: scale(1, 1);
          background-color: ${color};
        `;
      case 'bottom-right':
        return css`
          bottom: 0;
          right: 0;
          transform: scaleX(-1);
          background: linear-gradient(to right, ${clearColor}, ${color});
        `;
      case 'top-left':
        return css`
          top: 0;
          left: 0;
          transform: scaleY(-1);
          background: linear-gradient(to right, ${color}, ${clearColor});
        `;
      case 'top-right':
        return css`
          top: 0;
          right: 0;
          transform: scale(-1);
          background-color: ${clearColor};
        `;
      default:
        return css``;
    }
  }}

  -webkit-mask-image: url("${HudCorner}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url("${HudCorner}");
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;

  ${({ $position }) => {
    switch ($position) {
      case 'top-left':
        return css`
          -webkit-mask-position: top left;
          mask-position: top left;
        `;
      case 'bottom-right':
        return css`
          -webkit-mask-position: bottom right;
          mask-position: bottom right;
        `;
      default:
        return css``;
    }
  }}
`;

export const HudTopLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  top: 0;
  left: 50px;
  right: 50px;
  height: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleX(0);
  transform-origin: left center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineHorizontal 500ms ease-out forwards;
  `}

  @keyframes hudLineHorizontal {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
`;

export const HudBottomLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 50px;
  right: 50px;
  height: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleX(0);
  transform-origin: right center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineHorizontal 500ms ease-out forwards;
  `}
`;

export const HudLeftLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  left: 0;
  top: 50px;
  bottom: 50px;
  width: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleY(0);
  transform-origin: top center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineVertical 500ms ease-out 250ms forwards;
  `}

  @keyframes hudLineVertical {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
`;

export const HudRightLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  right: 0;
  top: 50px;
  bottom: 50px;
  width: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleY(0);
  transform-origin: bottom center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineVertical 500ms ease-out 250ms forwards;
  `}
`;

export const StatusTopLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  top: 0;
  left: 50px;
  right: 2px;
  height: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleX(0);
  transform-origin: left center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineHorizontal 500ms ease-out forwards;
  `}
`;

export const StatusBottomLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 2px;
  right: 50px;
  height: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleX(0);
  transform-origin: right center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineHorizontal 500ms ease-out forwards;
  `}
`;

export const StatusLeftLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  left: 0;
  top: 50px;
  bottom: 2px;
  width: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleY(0);
  transform-origin: top center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineVertical 500ms ease-out 250ms forwards;
  `}
`;

export const StatusRightLine = styled.div<{ $isActive?: boolean; $color?: string; $clearColor?: string; $neon?: boolean }>`
  position: absolute;
  right: 0;
  top: 2px;
  bottom: 50px;
  width: 2px;
  background: ${({ $color, $clearColor, $neon }) => $neon ? ($clearColor ?? 'var(--clearneonBlue)') : ($color ?? 'var(--neonBlue)')};
  transform: scaleY(0);
  transform-origin: bottom center;
  pointer-events: none;
  z-index: 1;
  ${({ $isActive }) => $isActive && `
    animation: hudLineVertical 500ms ease-out 250ms forwards;
  `}
`;

export const Heading = styled.h2`
  margin: 0 0 12px 0;
  font-size: 20px;
`;

export const SubHeading = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
`;

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted, #cfcfcf);
  align-items: flex-start;
  min-width: 0;
`;

export const InfoItem = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted, #cfcfcf);
  display: inline;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const PersonagemRichText = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  overflow-wrap: anywhere;
  .ProseMirror {
    outline: none;
    padding: 0;
    background-color: transparent;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
    overflow-wrap: break-word;

    p {
      ${wikiParagraphStyle}
      margin: 0 0 12px;
    }

    h1 {
      ${wikiHeading1Style}
    }
    h2 {
      ${wikiHeading2Style}
    }
    h3 {
      ${wikiHeading3Style}
    }
    ul, ol {
      ${wikiListStyle}
    }
    blockquote {
      ${wikiBlockquoteStyle}
    }
    code {
      ${wikiCodeStyle}
    }
    a {
      ${wikiLinkStyle}
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 1em 0;
    }
  }
`;

export const HistoryWrapper = styled.div`
  position: relative;
  max-height: 250px;
  overflow: hidden;
  cursor: pointer;
  border-bottom-left-radius: 10px;

  .ProseMirror {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 8;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 64px;
    height: 38px;
    background: linear-gradient(90deg, transparent, var(--black-blue, #0a0a1a) 55%);
    pointer-events: none;
  }
`;

export const HistoryModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10100;
  padding: 20px;
`;

export const HistoryModalSheet = styled.div<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  background: ${({ theme }) => theme === 'dark' ? 'var(--black-blue)' : 'var(--whitesmoke)'};
  border: 2px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on" ? "var(--clearneonBlue)" : "var(--lightBlack)"
      : neon === "on" ? "var(--neonViolet)" : "var(--lightGrey)"
  };
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px var(--blackTransp);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 767px) {
    max-width: 100vw;
    max-height: calc(100vh - 16px);
    border-radius: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const HistoryModalHeader = styled.div<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on" ? "var(--clearneonBlue)" : "var(--lightBlack)"
      : neon === "on" ? "var(--neonViolet)" : "var(--lightGrey)"
  };
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const HistoryModalTitle = styled.h2<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  margin: 0;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 18px;
  font-weight: 100;
  letter-spacing: 3px;
  color: var(--black) !important;
  text-shadow: ${({ theme }) => theme === 'dark'
    ? '-1px -1px 0 var(--neonBlue), -1px 1px 0 var(--neonBlue), 1px -1px 0 var(--neonBlue), 1px 1px 0 var(--neonBlue)'
    : '-1px -1px 0 var(--neonPink), -1px 1px 0 var(--neonPink), 1px -1px 0 var(--neonPink), 1px 1px 0 var(--neonPink)'};
`;

export const HistoryModalClose = styled.button<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  background: none;
  border: none;
  color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 4px;

  svg { font-size: 1.5rem; }

  &:hover {
    color: ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on" ? "var(--clearneonRed)" : "var(--whitesmoke)"
        : neon === "on" ? "var(--neonPink)" : "var(--grey)"
    };
    background: ${({ theme }) => theme === 'dark' ? 'var(--lightBlack)' : 'var(--lightGrey)'};
    transform: scale(1.1);
    ${({ theme, neon }) =>
      neon === "on" && `box-shadow: 0 0 10px ${theme === 'dark' ? 'var(--clearneonRed)' : 'var(--neonPink)'};`
    }
  }
`;

export const HistoryModalContent = styled.div<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
  color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
  background: ${({ theme }) => theme === 'dark' ? 'var(--black-blue)' : 'var(--whitesmoke)'};

  .ProseMirror {
    outline: none;
    padding: 0;
    background: transparent;

    p {
      ${wikiParagraphStyle}
      color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    }
    h1 {
      ${wikiHeading1Style}
      color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    }
    h2 {
      ${wikiHeading2Style}
      color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    }
    h3 {
      ${wikiHeading3Style}
      color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    }
    ul, ol {
      ${wikiListStyle}
    }
    blockquote {
      ${wikiBlockquoteStyle}
    }
    code {
      ${wikiCodeStyle}
    }
    a {
      ${wikiLinkStyle}
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 1em 0;
    }
  }

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: ${({ theme }) => theme === 'dark' ? 'var(--black-blue)' : 'var(--whitesmoke)'}; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on" ? "var(--clearneonBlue)" : "var(--lightBlack)"
        : neon === "on" ? "var(--neonViolet)" : "var(--lightGrey)"
    };
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on" ? "var(--neonBlue)" : "var(--whitesmoke)"
        : neon === "on" ? "var(--deepneonViolet)" : "var(--deepgray)"
    };
  }
`;

export const HeaderStatusController = styled.div`
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    justify-content: flex-start;
    min-width: 0;
`;

export const MetaContent = styled.div`
  padding: 8px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  min-width: 0;

  > * {
    min-width: 0;
    flex-wrap: wrap;
    overflow-wrap: anywhere;
  }
`;

export const SectionSpacer = styled.div<{ size?: number }>`
  width: 100%;
  margin-top: ${({ size }) => (size !== undefined ? `${size}px` : '16px')};
`;

export const SatusDivController = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 50%;
    align-items: center;
    justify-content: center;

    @media (max-width: 1100px) {
      width: 100%;
      min-width: 0;
      align-items: stretch;
    }
`;

export const StatusController = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    min-width: 0;
`

export const StatusList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
    align-items: center;
    justify-content: center;

    @media (max-width: 1100px) {
      gap: 16px;
    }

    @media (max-width: 768px) {
      order: 1;
      gap: 12px;
    }
`;

export const StatusHeader = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 32px;

    @media (max-width: 1100px) {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    @media (max-width: 768px) {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }
`

export const StatusDiv = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 250px;
  padding: 12px 15px;
  position: relative;
  z-index: 2;
  background: rgba(0, 0, 10, 0.65);
  box-sizing: border-box;

  > :last-child {
    flex: 1;
    min-width: 0;
    padding-right: 4px;
    box-sizing: border-box;
  }

  @media (max-width: 1100px) {
    width: 100%;
    min-width: 0;
  }

  @media (max-width: 768px) {
    --mask-icon-size: 46px;
    padding: 10px 12px;
  }
  clip-path: polygon(
    10px 0, calc(100% - 10px) 0, 100% 10px,
    100% calc(100% - 10px), calc(100% - 10px) 100%,
    10px 100%, 0 calc(100% - 10px), 0 10px
  );

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    clip-path: polygon(
      10px 0, calc(100% - 10px) 0, 100% 10px,
      100% calc(100% - 10px), calc(100% - 10px) 100%,
      10px 100%, 0 calc(100% - 10px), 0 10px
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 3px;
  }
`;

export const StatusLabel = styled.div`
  font-weight: 700;
  font-size: 14px;
`;

export const StatusValue = styled.div`
  font-size: 13px;
  color: var(--muted, #cfcfcf);
`;

export const StatusBarWrapper = styled.div<{ $color: string }>`
  width: 100%;
  height: 10px;
  min-width: 0;
  background: rgba(255,255,255,0.06);
  border: 1px solid ${({ $color }) => $color};
  box-sizing: border-box;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 6px;

  @media (max-width: 1100px) {
    max-width: 100%;
  }
`;

export const StatusBarFill = styled.div<{ $color: string; $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  background: ${({ $color }) => $color};
  transition: width 250ms ease;
  border-radius: 20px;
`;

export const FlexRow = styled.div<{ gap?: number; alignItems?: string }>`
  display: flex;
  gap: ${({ gap }) => gap ?? 12}px;
  align-items: ${({ alignItems }) => alignItems ?? 'center'};
  min-width: 0;
`;

export const MutedText = styled.div<{ padding?: string }>`
  font-size: 13px;
  color: var(--muted, #cfcfcf);
  ${({ padding }) => padding ? `padding: ${padding};` : ''}
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const BoldLabel = styled.div<{ $color?: string }>`
  color: ${({ $color }) => $color ?? 'var(--neonBlue)'};
  font-family: "Orbitron", sans-serif;
  display: block;
  font-size: 15px;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const InfoSpan = styled.span`
  color: var(--lightGrey);
  font-size: 13px;
`

export const ItemThumb = styled(FallbackImage)<{ $size?: number; $color?: string; $clearColor?: string }>`
  width: ${({ $size }) => $size ?? 48}px;
  height: ${({ $size }) => $size ?? 48}px;
  border-radius: 0;
  box-sizing: border-box;
  flex-shrink: 0;
  border: 1px solid ${({ $color }) => $color ?? 'var(--neonBlue)'};
  box-shadow: 0 0 8px ${({ $color }) => $color ?? 'var(--neonBlue)'};
`;

export const ItemPlaceholder = styled.div<{ $size?: number; $color?: string; $clearColor?: string }>`
  width: ${({ $size }) => $size ?? 48}px;
  height: ${({ $size }) => $size ?? 48}px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 0, 20, 0.7);
  box-sizing: border-box;
  border: 1px solid ${({ $color }) => $color ?? 'var(--neonBlue)'};
  color: ${({ $color }) => $color ?? 'var(--neonBlue)'};
  box-shadow: 0 0 8px ${({ $color }) => $color ?? 'var(--neonBlue)'};
  border-radius: 0;

  svg {
    font-size: ${({ $size }) => Math.max(24, Math.round(($size ?? 48) * 0.48))}px;
    color: inherit;
  }
`;

export const GalleryToggle = styled.button`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border: 1px solid var(--neonBlue);
  background: rgba(0, 0, 10, 0.42);
  color: var(--clearneonBlue);
  font-family: 'Orbitron', sans-serif;
  font-size: 10px;
  cursor: pointer;

  svg {
    width: 14px;
    height: 14px;
    transform: rotate(0deg);
    transition: transform 180ms ease;
  }

  &[aria-expanded='false'] svg {
    transform: rotate(-90deg);
  }
`;

export const GalleryContent = styled.div`
  padding: 0 32px 24px;
  min-width: 0;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 2px 8px;

    /* GalleryBlock renders either a grid or a carousel. Both become a
       compact four-column gallery in the character page on mobile. */
    > div > div {
      width: 100%;
      max-width: none;
      min-width: 0;
      box-sizing: border-box;
    }

    > div > div:not(:has(> button[aria-label="Anterior"])) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      padding: 4px;
    }

    > div > div:has(> button[aria-label="Anterior"]) > button {
      display: none;
    }

    > div > div:has(> button[aria-label="Anterior"]) > div {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
      width: 100%;
      padding: 4px;
      overflow: visible;
      box-sizing: border-box;

      > button {
        width: 100%;
        min-width: 0;
      }
    }
  }

  @media (max-width: 480px) {
    padding-inline: 0;

    > div > div:not(:has(> button[aria-label="Anterior"])),
    > div > div:has(> button[aria-label="Anterior"]) > div {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }
`;

export const SkillItem = styled.div`
  margin-bottom: 8px;
`;

export const Spacer = styled.div<{ height?: number }>`
  height: ${({ height }) => height ?? 12}px;
`;

export const MaskIcon = styled.div<{ src: string; color?: string; size?: number }>`
  width: var(--mask-icon-size, ${({ size }) => size ?? 64}px);
  height: var(--mask-icon-size, ${({ size }) => size ?? 64}px);
  display: inline-block;
  flex-shrink: 0;
  background-color: ${({ color }) => color ?? 'currentColor'};
  -webkit-mask-image: ${({ src }) => `url("${src}")`};
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: ${({ src }) => `url("${src}")`};
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;
`;

export const ItemRow = styled.div<{ $clickable?: boolean; $color?: string; $clearColor?: string }>`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: flex-start;
  padding-right: 10px;
  height: 50px;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid transparent;
  margin-bottom: 8px;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
  width: 100%;
  min-width: 0;
  max-width: 100%;

  * {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &:hover {
    border-color: ${({ $color }) => $color ?? 'var(--neonBlue)'};
    background: rgba(0, 184, 255, 0.08);
    box-shadow: 0 0 10px ${({ $color }) => $color ?? 'var(--neonBlue)'};
  }
`;

export const FlexFill = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  margin-left: 5px;
`;

export const InfoControllers = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
  min-width: 0;
`;

export const TitleDiv = styled.div`
  width: 100%;
`;

export const TagItem = styled.span`
  display: inline-block;
  background: rgba(255,255,255,0.08);
  border: 1px solid var(--neonBlue);
  border-radius: 0;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  font-size: 13px;
  color: var(--text, #eaeaea);
  max-width: 100%;
  overflow-wrap: anywhere;
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
`;

export const RelatedLink = styled.span`
  display: inline-flex;
  align-items: center;

  .inline-link {
    display: inline-flex !important;
    width: auto !important;
  }
`;

export const StoryWithImage = styled.div<{ cityImage?: string | null }>`
  position: relative;
  margin-top: 12px;
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  ${({ cityImage }) => cityImage ? `
    display: flex;
    padding-right: 0;
  ` : ''}

  @media (max-width: 768px) {
    flex-direction: column;
    min-width: 0;
  }
`;

export const StoryImage = styled.img<{ src?: string }>`
  position: relative;
  width: 50%;
  height: auto;
  object-fit: cover;
  object-position: center;
  border-radius: 10px;
  opacity: 0.5;
  pointer-events: none;
  flex-shrink: 0;
  mask-image: linear-gradient(to right, transparent, black 20%, black 80%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 50%, black 100%, transparent);

  @media (max-width: 768px) {
    width: 100%;
    max-height: 240px;
    margin-top: 12px;
    object-fit: cover;
    mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
  }
`;

export const HexagonHud = styled.div`
  position: relative;
  width: 85px;
  height: 85px;
  align-self: center;
  margin-top: 12px;

  @media (max-width: 768px) {
    order: -1;
    margin: 0 auto 8px;
  }
`;

export const HexagonBackground = styled.div`
  position: absolute;
  inset: 6px;
  background: rgba(0, 0, 10, 0.88);
  -webkit-mask-image: url("${HexagonoFill}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url("${HexagonoFill}");
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;
  z-index: 1;
`;

export const HexagonContent = styled.div`
  position: absolute;
  inset: 6px;
  background: transparent;
  -webkit-mask-image: url("${HexagonoFill}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url("${HexagonoFill}");
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 2;
`;

export const HexagonBorder = styled.div<{ $neon?: boolean }>`
  position: absolute;
  inset: 0;
  background: var(--neonBlue);
  -webkit-mask-image: url("${Hexagono}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  -webkit-mask-position: center;
  mask-image: url("${Hexagono}");
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
  mask-position: center;
  z-index: 3;
  filter: ${({ $neon }) => $neon ? 'drop-shadow(0 0 2px var(--clearneonBlue))' : 'none'};
`;

export const HexagonValue = styled.div`
  font-size: 30px;
  font-weight: 700;
  color: var(--clearneonBlue);
  line-height: 1;
  font-family: "Orbitron", sans-serif;
`;

export const SectionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  width: 100%;

  > :only-child {
    grid-column: 1 / -1;
  }

  > * {
    min-width: 0;
  }

  @media (max-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`;

export const InventoryList = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const ViewMoreButton = styled.button<{ $color: string }>`
  align-self: center;
  margin-top: 4px;
  padding: 6px 10px;
  border: 0;
  background: transparent;
  color: ${({ $color }) => $color};
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;

  &:hover { text-shadow: 0 0 8px ${({ $color }) => $color}; }
`;

export const LoadBar = styled.div`
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
`;

export const LoadProgress = styled.div<{ $pct: number; $color: string }>`
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  height: 100%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 8px ${({ $color }) => $color};
  transition: width 250ms ease;
`;

export const ImplantGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
`;

export const ImplantCard = styled.article`
  position: relative;
  height: 48px;
  overflow: hidden;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  grid-template-rows: min-content min-content;
  column-gap: 12px;
  background: rgba(157, 78, 221, 0.08);
  border: 1px solid var(--neonPurple);

  &::before {
    content: '';
    grid-row: 1 / -1;
    width: 48px;
    height: 48px;
    box-sizing: border-box;
    border: 1px solid var(--neonPurple);
    box-shadow: 0 0 8px var(--clearneonPurple);
  }

  ${BoldLabel} {
    color: var(--neonPurple);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover { box-shadow: 0 0 10px var(--clearneonPurple); }
`;

export const ImplantMaterial = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: fit-content;
  padding: 2px 6px;
  color: var(--clearneonPurple);
  border: 1px solid var(--neonPurple);
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  text-transform: uppercase;
`;

export const ImplantMods = styled.div`
  display: none;
  flex-wrap: wrap;
  gap: 4px 8px;
  color: var(--lightGrey);
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  span { color: var(--clearneonPurple); }
`;

export const ContentTabs = styled.div`
  display: flex;
  gap: 8px;
`;

export const ContentTab = styled.button<{ $active: boolean; $color: string }>`
  padding: 8px 14px;
  border: 1px solid ${({ $color }) => $color};
  background: ${({ $active, $color }) => $active ? $color : 'rgba(0, 0, 10, 0.35)'};
  color: ${({ $active }) => $active ? 'var(--black)' : 'var(--whitesmoke)'};
  cursor: pointer;
  font-family: 'Orbitron', sans-serif;
  font-size: 12px;
  transition: box-shadow 180ms ease, background 180ms ease;

  &:hover { box-shadow: 0 0 10px ${({ $color }) => $color}; }
`;

export const SkillGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
`;

export const NpcSkillCard = styled.article<{ $color: string }>`
  height: 48px;
  overflow: hidden;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  grid-template-rows: min-content min-content;
  column-gap: 12px;
  border: 1px solid ${({ $color }) => $color};
  background: rgba(0, 0, 10, 0.42);
  transition: transform 180ms ease, box-shadow 180ms ease;

  &::before {
    content: '';
    grid-row: 1 / -1;
    width: 48px;
    height: 48px;
    box-sizing: border-box;
    border: 1px solid ${({ $color }) => $color};
    box-shadow: 0 0 8px ${({ $color }) => $color};
  }

  ${BoldLabel} {
    color: ${({ $color }) => $color};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    transform: none;
    box-shadow: 0 0 14px ${({ $color }) => $color};
  }
`;

export const AbilityDescription = styled.p`
  color: var(--whitesmoke);
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const AbilityPair = styled(SectionRow)``;

export const AbilityCard = styled.article`
  min-height: 150px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CooldownBar = styled.div`
  width: 100%;
  height: 8px;
  margin-top: auto;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
`;

export const CooldownFill = styled.div<{ $pct: number }>`
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  height: 100%;
  background: var(--neonOrange);
  box-shadow: 0 0 8px var(--clearneonOrange);
`;

export const ItemDescriptionPreview = styled.div`
  position: relative;
  max-height: 24px;
  overflow: hidden;
  color: var(--muted, #cfcfcf);

  & > div {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  p {
    margin: 0;
  }

  &::after {
    content: '…';
    position: absolute;
    right: 0;
    bottom: 0;
    padding-left: 8px;
    color: var(--whitesmoke);
    background: transparent;
    pointer-events: none;
  }
`;

export const ItemDescriptionLayout = styled.div<{ $withoutMedia?: boolean }>`
  display: flow-root;

  ${({ $withoutMedia }) => !$withoutMedia && `
    > :first-child {
      float: right;
      margin: 0 0 16px 24px;
    }

    @media (max-width: 767px) {
      > :first-child {
        float: none;
        display: block;
        margin: 0 auto 16px;
      }
    }
  `}
`;

export const ItemDetailsBody = styled.div`
  min-width: 0;
`;

export const DetailAttributes = styled.div<{ $inline?: boolean }>`
  display: ${({ $inline }) => $inline ? 'flex' : 'grid'};
  grid-template-columns: ${({ $inline }) => $inline ? 'none' : 'repeat(auto-fit, minmax(120px, 1fr))'};
  flex-wrap: ${({ $inline }) => $inline ? 'wrap' : 'nowrap'};
  justify-content: flex-start;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;

  ${({ $inline }) => $inline && `
    > div {
      flex: 1 1 140px;
      min-width: 140px;
      max-width: 100%;
    }

    > .detail-special {
      flex: 1 1 100%;
    }
  `}
`;

export const DetailTextPair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const DetailText = styled.div`
  min-width: 0;
  padding: 10px;
  background: rgba(0, 0, 10, 0.32);
  border-left: 2px solid var(--neonBlue);
`;

export const DetailAttribute = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-left: 2px solid var(--neonBlue);
  background: rgba(0, 0, 10, 0.32);

  span { color: var(--muted, #cfcfcf); font-size: 11px; }
  strong { color: var(--whitesmoke); font-size: 13px; }

  &.detail-special { grid-column: 1 / -1; }
`;

export const ItemDescriptionImage = styled(FallbackImage)`
  width: 200px;
  max-width: 100%;
  height: auto;
  max-height: 300px;
  border: 1px solid var(--neonBlue);
  box-shadow: 0 0 10px var(--clearneonBlue);

  > img {
    object-fit: contain;
  }

  @media (max-width: 767px) {
    width: min(100%, 220px);
    max-height: 240px;
    margin-inline: auto;
  }
`;
