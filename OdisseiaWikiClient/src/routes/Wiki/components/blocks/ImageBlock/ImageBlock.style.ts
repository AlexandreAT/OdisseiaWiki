import styled from 'styled-components';

interface ImageWithTextProps {
  $posicaoTexto: 'left' | 'right';
}

export const ImageBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const ImageWithTextContainer = styled.div<ImageWithTextProps>`
  display: flex;
  flex-direction: ${props => (props.$posicaoTexto === 'left' ? 'row-reverse' : 'row')};
  gap: 20px;
  width: 100%;
  align-items: flex-start;
`;

export const ImageSide = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TextSide = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
`;

export const StyledImage = styled.img`
  height: 350px;
  object-fit: contain;
  border-radius: 10px !important;
`;

export const ImageCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--lightGrey) !important;
  font-style: italic;
  text-align: center;
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