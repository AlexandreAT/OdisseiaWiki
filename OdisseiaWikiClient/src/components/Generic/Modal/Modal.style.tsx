import styled from "styled-components";

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;

  @media (max-width: 767px) {
    padding: 0;
  }
`;

export const ModalContainer = styled.div<{ theme: 'light' | 'dark'; neon: 'on' | 'off'; $width?: string }>`
  background: ${({ theme }) => (theme === 'dark' ? 'var(--deepgray)' : 'var(--whitesmoke)')};
  border-radius: 8px;
  width: ${({ $width }) => $width ?? '500px'};
  max-width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 0 10px var(--blackTransp);
  display: flex;
  flex-direction: column;
  border: 2px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--lightBlack)"
      : neon === "on"
        ? "var(--neonViolet)"
      : "var(--lightGrey)"
  };

  @media (max-width: 767px) {
    width: 100vw;
    max-width: 100vw;
    max-height: calc(100vh - 16px);
    border-radius: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ModalHeaderContainer = styled.div<ThemeProps>`
  padding: 12px 16px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--lightBlack)"
      : neon === "on"
        ? "var(--neonViolet)"
        : "var(--lightGrey)"
  };

  button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme === 'dark' ? 'var(--whitesmoke)' : 'var(--deepgray)'};
    transition: all 0.3s ease;
    border-radius: 4px;

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

    svg {
      font-size: 1.5rem;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  }
`;

export const ModalContentContainer = styled.div`
  padding: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: var(--neonBlue); }
`;

export const ModalFooterContainer = styled.div<ThemeProps>`
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--lightBlack)"
      : neon === "on"
        ? "var(--neonViolet)"
        : "var(--lightGrey)"
  };
`;
