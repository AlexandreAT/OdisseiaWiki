import styled, { css } from 'styled-components';
import {
  wikiHeading1Style,
  wikiHeading2Style,
  wikiHeading3Style,
  wikiParagraphStyle,
  wikiListStyle,
} from '../../../shared/WikiTextStyles';

interface ImageFloatProps {
  $float: 'left' | 'right';
}

export const ImageBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

/* Clearfix container that wraps the floated image + text */
export const ImageWithTextContainer = styled.div`
  width: 80%;
  max-width: 1100px;
  background-color: #0006;
  border-radius: 10px;

  &::after {
    content: '';
    display: table;
    clear: both;
  }
`;

export const TextSide = styled.div`
  padding: 0 16px;
  margin: 0;
  border-radius: 10px;

  h1 {
    ${wikiHeading1Style}
    margin-top: 0;
  }

  h2 {
    ${wikiHeading2Style}
    margin-top: 0;
  }

  h3 {
    ${wikiHeading3Style}
    margin-top: 0;
  }

  p {
    ${wikiParagraphStyle}
    margin-top: 0;
  }

  ul,
  ol {
    ${wikiListStyle}
    margin-top: 0;
  }

  /* Reset all top margins so text starts flush at the top */
  > * {
    margin-top: 0;
  }
`;

export const ImageSide = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #0006;
`;

export const ImageContent = styled.div<ImageFloatProps>`
  float: ${props => props.$float};
  ${props =>
    props.$float === 'right'
      ? css`margin-left: 20px;`
      : css`margin-right: 20px;`
  }
  max-width: 100%;
  overflow: hidden;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  z-index: 1;
`;

export const StyledImage = styled.img`
  max-height: 350px;
  max-width: 350px;
  object-fit: contain;
  max-width: 100%;
  display: block;
  cursor: pointer;
`;

export const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
  cursor: pointer;
`;

export const ImageCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--lightGrey) !important;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 4px 0;
  background-color: #0006;
`;

export const TextContent = styled.div`
  .ProseMirror {
    outline: none;
    padding: 0;
    background-color: transparent;

    p {
      ${wikiParagraphStyle}
    }

    h1 {
      ${wikiHeading1Style}
      margin: 10px 0 5px;
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
  }
`;

export const ErrorMessage = styled.div`
  padding: 12px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
  border-radius: 4px;
  color: #dc3545;
  font-size: 12px;

  p {
    margin: 0;
  }
`;