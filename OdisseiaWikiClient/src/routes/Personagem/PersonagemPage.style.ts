import { color } from './../../Global Styles/ColorScheme';
import styled, { css } from 'styled-components';
import { wikiHeading1Style, wikiHeading2Style, wikiHeading3Style, wikiParagraphStyle, wikiListStyle, wikiBlockquoteStyle, wikiCodeStyle, wikiLinkStyle } from '../Wiki/shared/WikiTextStyles';

export const PageContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
  gap: 24px;
  align-items: flex-start;
`;

export const TopSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 12px;
    padding: 0 15px 25px;
`;

export const BottomSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 12px;
`;

export const AvatarDivController = styled.div`
    display: flex;
    width: 50%;
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

export const CardContent = styled.div<{ gap?: number }>`
  padding: 16px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap ?? 0}px;
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
  width: 100%;
  .ProseMirror {
    outline: none;
    padding: 0;
    background-color: transparent;

    p {
      ${wikiParagraphStyle}
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
  max-height: 200px;
  overflow: hidden;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(transparent, var(--black-blue, #0a0a1a));
    pointer-events: none;
  }
`;

export const HistoryExpandHint = styled.div`
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--clearneonBlue, #4fc3f7);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  z-index: 2;
  padding: 4px 12px;
  border: 1px solid var(--clearneonBlue, #4fc3f7);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 8px var(--clearneonBlue, #4fc3f7);
  }
`;

// ─── History Modal ────────────────────────────────────────────────────────────

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
    gap: 8px;
    width: 100%;
    align-items: center;
    justify-content: center;
`;

export const StatusHeader = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 28px;
`

export const StatusDiv = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 250px;
  padding: 8px;
  border: 1px solid var(--neonBlue);
  border-radius: 8px;
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
  border-radius: 6px;
  overflow: hidden;
  margin-top: 6px;
`;

export const StatusBarFill = styled.div<{ $color: string; $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.max(0, Math.min(100, $pct))}%`};
  background: ${({ $color }) => $color};
  transition: width 250ms ease;
`;

// ─── Consolidated reusable layout components ───────────────────────────────────

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
  color: var(--whitesmoke);
  font-family: "Orbitron", sans-serif;
  display: inline;
`;

export const ItemThumb = styled.img`
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
`;

export const ItemPlaceholder = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.04);
  border-radius: 6px;
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
  border-radius: 4px;
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
