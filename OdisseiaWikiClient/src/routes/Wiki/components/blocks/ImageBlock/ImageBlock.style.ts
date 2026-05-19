import styled from 'styled-components';

export const ImageBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const ImageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: 8px;
  background-color: #0004;
`;

export const StyledImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: contain;
  border-radius: 8px;
`;

export const ImageCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  text-align: center;
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
