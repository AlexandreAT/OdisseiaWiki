import { color } from './../../Global Styles/ColorScheme';
import styled, { css } from 'styled-components';
import { wikiHeading1Style, wikiHeading2Style, wikiHeading3Style, wikiParagraphStyle, wikiListStyle, wikiBlockquoteStyle, wikiCodeStyle, wikiLinkStyle } from '../Wiki/shared/WikiTextStyles';
import HudCorner from '../../assets/svg/HudCorner.svg';
import Hexagono from '../../assets/svg/Hexagono.svg';
import HexagonoFill from '../../assets/svg/HexagonoFill.svg';

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
`

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
`;

export const TopSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 12px;
    padding: 0 15px 25px;
`;

export const BottomInfoLeft = styled.div`
  width: 35%;
`

export const BottomInfoRight = styled.div`
  width: 65%;
`

export const BottomSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 25px;
    padding: 0 25px;
`;

export const AvatarDivController = styled.div`
    display: flex;
    width: 50%;
    gap: 25px;
`;

export const AvatarWrapper = styled.div`
    min-width: 300px;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const MetaRow = styled.div`
  margin-top: 6px;
`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CardContent = styled.div<{ gap?: number, maxWidth?: string, maxHeight?: string, neon: 'on' | 'off' }>`
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
  box-shadow: ${({ neon }) => neon === 'on' ? 'inset 0 0 20px var(--clearneonBlue)' : 'none'};
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

  -webkit-mask-image: url(${HudCorner});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url(${HudCorner});
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
`;

export const InfoItem = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted, #cfcfcf);
  display: inline;
`;

export const PersonagemRichText = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
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

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    background: linear-gradient(transparent, var(--black-blue, #0a0a1a));
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
  background: ${({ theme }) => theme === 'dark' ? 'var(--lightBlack)' : 'var(--whitesmoke)'};
  border: 2px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on" ? "var(--clearneonBlue)" : "var(--lightBlack)"
      : neon === "on" ? "var(--neonViolet)" : "var(--lightGrey)"
  };
  border-radius: 8px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px var(--blackTransp);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
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
  color: ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on" ? "var(--clearneonBlue)" : "var(--clearWhite)"
      : neon === "on" ? "var(--neonViolet)" : "var(--deepgray)"
  };
  font-size: 1.5rem;
  font-weight: 600;
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
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgray)'};

  .ProseMirror {
    outline: none;
    padding: 0;
    background: transparent;

    p {
      ${wikiParagraphStyle}
      color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgray)'};
    }
    h1 {
      ${wikiHeading1Style}
      color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgray)'};
    }
    h2 {
      ${wikiHeading2Style}
      color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgray)'};
    }
    h3 {
      ${wikiHeading3Style}
      color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgray)'};
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
        ? neon === "on" ? "var(--neonBlue)" : "var(--clearWhite)"
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
`;

export const MetaContent = styled.div`
  padding: 8px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
`;

export const SectionSpacer = styled.div<{ size?: number }>`
  margin-top: ${({ size }) => (size !== undefined ? `${size}px` : '16px')};
`;

export const SatusDivController = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 50%;
    align-items: center;
    justify-content: center;
`;

export const StatusController = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`

export const StatusList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 32px;
    width: 100%;
    align-items: center;
    justify-content: center;
`;

export const StatusHeader = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 32px;
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

export const StatusBarWrapper = styled.div`
  width: 160px;
  height: 10px;
  background: rgba(255,255,255,0.06);
  border-radius: 0;
  overflow: hidden;
  margin-top: 6px;
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
`;

export const MutedText = styled.div<{ padding?: string }>`
  font-size: 13px;
  color: var(--muted, #cfcfcf);
  ${({ padding }) => padding ? `padding: ${padding};` : ''}
`;

export const BoldLabel = styled.div`
  color: var(--neonBlue);
  font-family: "Orbitron", sans-serif;
  display: inline;
  font-size: 16px;
`;

export const InfoSpan = styled.span`
  color: var(--lightGrey);
  font-size: 13px;
`

export const ItemThumb = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 0;
`;

export const ItemPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.04);
  border-radius: 0;
`;

export const GalleryToggle = styled.div`
  cursor: pointer;
`;

export const GalleryContent = styled.div`
  padding: 0 12px 12px 12px;
`;

export const SkillItem = styled.div`
  margin-bottom: 8px;
`;

export const Spacer = styled.div<{ height?: number }>`
  height: ${({ height }) => height ?? 12}px;
`;

export const MaskIcon = styled.div<{ src: string; color?: string; size?: number }>`
  width: ${({ size }) => size ?? 64}px;
  height: ${({ size }) => size ?? 64}px;
  display: inline-block;
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

export const ItemRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
`;

export const FlexFill = styled.div`
  flex: 1;
`;

export const InfoControllers = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
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
`;

export const HexagonHud = styled.div`
  position: relative;
  width: 85px;
  height: 85px;
  align-self: center;
  margin-top: 12px;
`;

export const HexagonBackground = styled.div`
  position: absolute;
  inset: 6px;
  background: rgba(0, 0, 10, 0.88);
  -webkit-mask-image: url(${HexagonoFill});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url(${HexagonoFill});
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;
  z-index: 1;
`;

export const HexagonContent = styled.div`
  position: absolute;
  inset: 6px;
  background: transparent;
  -webkit-mask-image: url(${HexagonoFill});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url(${HexagonoFill});
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
  -webkit-mask-image: url(${Hexagono});
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  -webkit-mask-position: center;
  mask-image: url(${Hexagono});
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