import styled from 'styled-components';
import {
  wikiHeading1Style,
  wikiHeading2Style,
  wikiHeading3Style,
  wikiParagraphStyle,
  wikiListStyle,
} from '../../../shared/WikiTextStyles';

export const InfoLoreBlockContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 100, 100, 0.05) 100%);
  border: 1px solid rgba(0, 212, 255, 0.1);
  border-radius: 8px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const InfoLoreImage = styled.img`
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
  }
`;

export const InfoLoreImagePlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #0a3a3a 0%, #1a1a1a 100%);
  border-radius: 8px;
  color: rgba(0, 212, 255, 0.3);
  font-size: 48px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
`;

export const InfoLoreContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;

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
`;

export const InfoLoreTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #00d4ff;
  letter-spacing: -0.5px;
`;

export const InfoLoreDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  white-space: pre-wrap;
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
