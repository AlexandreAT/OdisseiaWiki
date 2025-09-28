import styled from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

export const ModalContainer = styled.div<{ theme: 'light' | 'dark'; neon: 'on' | 'off' }>`
  background: ${({ theme }) => (theme === 'dark' ? 'var(--deepgray)' : 'var(--whitesmoke)')};
  border-radius: 8px;
  width: 500px;
  max-width: 95%;
  box-shadow: 0 0 10px rgba(0,0,0,0.9);
  display: flex;
  flex-direction: column;
  border: ${({ neon }) => neon === 'on' ? '2px solid #0ff' : 'none'};
`;

export const ModalHeaderContainer = styled.div`
  padding: 12px 16px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ccc;
`;

export const ModalContentContainer = styled.div`
  padding: 16px;
  flex: 1;
`;

export const ModalFooterContainer = styled.div`
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #ccc;
`;