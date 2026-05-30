import styled from 'styled-components';
import {
  wikiHeading1Style,
  wikiHeading2Style,
  wikiHeading3Style,
  wikiParagraphStyle,
  wikiListStyle,
} from '../../../shared/WikiTextStyles';

interface ImageWithTextProps {
  $posicaoTexto: 'left' | 'right';
}

export const ImageBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

export const ImageWithTextContainer = styled.div<ImageWithTextProps>`
  display: flex;
  flex-direction: ${props => (props.$posicaoTexto === 'left' ? 'row-reverse' : 'row')};
  gap: 20px;
  width: 65%;
  align-items: flex-start;
`;

export const TextSide = styled.div`
  flex: 1;
  min-width: 0;
  padding: 0 16px;
  background-color: #0006;
  border-radius: 10px;

  h1 {
    ${wikiHeading1Style}
    margin: 10px 0 5px;
    text-align: center;
  }

  h2 {
    ${wikiHeading2Style}
  }

  h3 {
    ${wikiHeading3Style}
  }

  p {
    ${wikiParagraphStyle}
  }

  ul,
  ol {
    ${wikiListStyle}
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

export const ImageContent = styled.div`
  width: fit-content;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: 10px;
  align-self: flex-start;
`;

export const StyledImage = styled.img`
  max-height: 350px;
  max-width: 350px;
  object-fit: contain;
  max-width: 100%;
  display: block;
`;

export const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
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
  padding: 8px 0;

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