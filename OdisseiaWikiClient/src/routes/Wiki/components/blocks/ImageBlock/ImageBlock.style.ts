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
  min-width: 0;
`;

/* Clearfix container that wraps the floated image + text */
export const ImageWithTextContainer = styled.div`
  width: 80%;
  max-width: 1100px;
  background-color: #0006;
  border-radius: 10px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    width: 90%;
  }

  @media (max-width: 768px) {
    width: 100%;
  }

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
  min-width: 0;
  overflow-wrap: anywhere;

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
  border: 2px solid transparent;
  transition: border-color 0.2s ease, scale 0.2s ease, box-shadow 0.2s ease;

  @media (max-width: 768px) {
    float: none;
    margin: 0 0 14px;
    width: 100%;
  }

  &:hover {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 10px 1px var(--black-blue);
    scale: 1.03;
  }

  &:hover p {
    color: var(--clearneonBlue) !important;
  }
`;

export const StyledImage = styled.img`
  max-height: 350px;
  max-width: 350px;
  object-fit: contain;
  max-width: 100%;
  display: block;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    max-height: 320px;
  }
`;

export const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  cursor: pointer;

  &:hover p {
    color: var(--clearneonBlue) !important;
  }
`;

export const ImageCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--lightGrey) !important;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 4px 0;
  background-color: var(--black-blue);
  transition: color 0.2s ease;
`;

export const TextContent = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;

  .ProseMirror {
    outline: none;
    padding: 0;
    background-color: transparent;
    min-width: 0;
    overflow-wrap: anywhere;

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
