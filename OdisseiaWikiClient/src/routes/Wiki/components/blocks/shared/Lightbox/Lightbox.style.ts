import styled from 'styled-components';

export const LightboxOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
`;

export const LightboxContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 90vw;
  max-height: 90vh;
  min-height: 0;
  background-color: #1a1a1a;
  border: 2px solid #333;
  border-radius: 12px;
  padding: 16px;
  position: relative;
`;

export const LightboxImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  min-height: 0;
  object-fit: contain;
  border-radius: 8px;
`;

export const LightboxCaption = styled.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  padding: 4px 0;
`;

export const LightboxTopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 32px;
`;

export const LightboxCloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  margin-left: auto;
  background-color: transparent;
  border: 1px solid var(--clearneonBlue);
  border-radius: 6px;
  color: var(--clearneonBlue);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 212, 255, 0.12);
    box-shadow: 0 0 10px var(--clearneonBlue);
    color: var(--neonBlue);
  }

  svg {
    display: block;
  }
`;

export const LightboxBottomBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 4px;
`;

export const LightboxCounter = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  letter-spacing: 1px;
`;

export const LightboxNavButton = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: transparent;
  border: 1px solid ${props => (props.disabled ? '#555' : 'var(--clearneonBlue)')};
  border-radius: 6px;
  color: ${props => (props.disabled ? '#555' : 'var(--clearneonBlue)')};
  font-size: 22px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  opacity: ${props => (props.disabled ? 0.4 : 1)};

  &:not(:disabled):hover {
    background-color: rgba(0, 212, 255, 0.12);
    box-shadow: 0 0 10px var(--clearneonBlue);
    color: var(--neonBlue);
  }

  svg {
    display: block;
  }
`;

export const LightboxError = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 40px;
  font-size: 14px;
`;