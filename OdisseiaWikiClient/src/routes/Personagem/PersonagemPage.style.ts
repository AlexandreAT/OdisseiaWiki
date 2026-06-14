import styled from 'styled-components';
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
    background-color: yellow;
    padding: 15px;
`;

export const BottomSection = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 12px;
`;

export const AvatarDivController = styled.div`
    display: flex;
    background-color: red;
    width: 50%;
`;

export const AvatarWrapper = styled.div`
    min-width: 300px;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: blue;
`;

export const TitleRow = styled.div``;
export const MetaRow = styled.div`margin-top: 6px;`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: wheat;
`;

export const CardContent = styled.div`
  padding: 16px;
  color: var(--text, #eaeaea);
  width: 100%;
  background-color: green;
`;

export const Heading = styled.h2`
  margin: 0 0 12px 0;
  font-size: 20px;
`;

export const SubHeading = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  width: 100%;
`;

export const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--muted, #cfcfcf);
`;

export const InfoItem = styled.div`
  font-size: 14px;
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

    ul,
    ol {
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

export const HeaderStatusController = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    background-color: purple;
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
    background-color: rosybrown;
`;

export const StatusController = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: lightblue;
`

export const StatusList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    align-items: center;
    justify-content: center;
    background-color: blueviolet;
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

export const StatusIcon = styled.div`
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  & svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  & svg path {
    fill: currentColor;
  }
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
