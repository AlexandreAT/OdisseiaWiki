import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10100;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

export const ModalSheet = styled.div<ThemeProps>`
  background: ${({ theme }) => theme === 'dark' ? 'var(--lightBlack)' : 'var(--whitesmoke)'};
  border: 2px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--lightBlack)"
      : neon === "on"
        ? "var(--neonViolet)"
        : "var(--lightGrey)"
  };
  border-radius: 8px;
  width: 100%;
  max-width: 1200px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px var(--blackTransp);
  animation: slideIn 0.3s ease-out;

  @media (max-width: 768px) {
    max-height: calc(100dvh - 16px);
    border-radius: 6px;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const ModalHeader = styled.div<ThemeProps>`
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--lightBlack)"
      : neon === "on"
        ? "var(--neonViolet)"
        : "var(--lightGrey)"
  };
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 12px 14px;
  }
`;

export const ModalTitle = styled.h2<ThemeProps>`
  margin: 0;
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: 18px;
  font-weight: 100;
  letter-spacing: 3px;
  color: var(--black) !important;
  text-shadow: ${({ theme }) => theme === 'dark'
    ? '-1px -1px 0 var(--neonBlue), -1px 1px 0 var(--neonBlue), 1px -1px 0 var(--neonBlue), 1px 1px 0 var(--neonBlue)'
    : '-1px -1px 0 var(--neonPink), -1px 1px 0 var(--neonPink), 1px -1px 0 var(--neonPink), 1px 1px 0 var(--neonPink)'};
`;

export const CloseButton = styled.button<ThemeProps>`
  background: none;
  border: none;
  color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 4px;

  svg {
    font-size: 1.5rem;
  }

  &:hover {
    color: ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on"
          ? "var(--clearneonRed)"
          : "var(--whitesmoke)"
        : neon === "on"
          ? "var(--neonPink)"
          : "var(--grey)"
    };
    background: ${({ theme }) => theme === 'dark' ? 'var(--lightBlack)' : 'var(--lightGrey)'};
    transform: scale(1.1);
    ${({ theme, neon }) => 
      neon === "on" && `box-shadow: 0 0 10px ${theme === 'dark' ? 'var(--clearneonRed)' : 'var(--neonPink)'};`
    }
  }
`;

export const ModalContent = styled.div<ThemeProps>`
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 12px;
  }
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme === 'dark' ? 'var(--black-blue)' : 'var(--whitesmoke)'};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on"
          ? "var(--clearneonBlue)"
          : "var(--lightBlack)"
        : neon === "on"
          ? "var(--neonViolet)"
          : "var(--lightGrey)"
    };
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on"
          ? "var(--neonBlue)"
          : "var(--clearWhite)"
        : neon === "on"
          ? "var(--deepneonViolet)"
          : "var(--deepgray)"
    };
  }
`;

export const EditorWrapper = styled.div<ThemeProps>`
  min-height: 300px;
  
  /* Estilos do editor interno */
  .ProseMirror {
    min-height: 300px;
    outline: none;
    padding: 12px;
    background: ${({ theme }) => theme === 'dark' ? 'var(--black-blue)' : 'var(--clearWhite)'};
    border: 1px solid ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on"
          ? "var(--clearneonBlue)40"
          : "var(--lightBlack)"
        : neon === "on"
          ? "var(--neonViolet)40"
          : "var(--lightGrey)"
    };
    border-radius: 4px;
    color: ${({ theme }) => theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgray)'};
    
    &:focus {
      border-color: ${({ theme, neon }) =>
        theme === "dark"
          ? neon === "on"
            ? "var(--clearneonBlue)"
            : "var(--clearWhite)"
          : neon === "on"
            ? "var(--neonViolet)"
            : "var(--deepgray)"
      };
    }
  }
`;

export const ModalFooter = styled.div<ThemeProps>`
  padding: 16px 24px;
  border-top: 1px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--lightBlack)"
      : neon === "on"
        ? "var(--neonViolet)"
        : "var(--lightGrey)"
  };
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 10px 12px;
    gap: 6px;
    overflow-x: auto;
  }
`;
