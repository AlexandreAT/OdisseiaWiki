import styled from 'styled-components';

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
    font-family: 'DO Futuristic', sans-serif !important;
    font-size: 2.5rem !important;
    font-weight: 100;
    letter-spacing: 4px;
    color: white;
    text-align: center;
  }

  p {
  }

  ul,
  ol {
    padding-left: 20px;
    margin-left: 0;
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
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  padding: 8px 0;

  p {
    margin: 0 0 8px 0;
  }

  p:last-child {
    margin-bottom: 0;
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