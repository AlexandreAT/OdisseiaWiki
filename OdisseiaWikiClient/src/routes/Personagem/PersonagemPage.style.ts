import styled from 'styled-components';
import { wikiHeading1Style, wikiHeading2Style, wikiHeading3Style, wikiParagraphStyle, wikiListStyle, wikiBlockquoteStyle, wikiCodeStyle, wikiLinkStyle } from '../Wiki/shared/WikiTextStyles';

export const PageContainer = styled.div`
  padding: 24px;
  display: flex;
  gap: 24px;
  align-items: flex-start;
`;

export const LeftColumn = styled.div`
  width: 260px;
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const RightColumn = styled.div`
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
`;

export const AvatarWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 0 0 0;
`;

export const TitleRow = styled.div``;
export const MetaRow = styled.div`margin-top: 6px;`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CardContent = styled.div`
  padding: 16px;
  color: var(--text, #eaeaea);
`;

export const Heading = styled.h2`
  margin: 0 0 12px 0;
  font-size: 20px;
`;

export const SubHeading = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
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


export const MetaContent = styled.div`
  padding: 8px;
  font-size: 13px;
  color: var(--muted, #cfcfcf);
`;

export const SectionSpacer = styled.div<{ size?: number }>`
  margin-top: ${({ size }) => (size !== undefined ? `${size}px` : '16px')};
`;

/* debug styles removed */
