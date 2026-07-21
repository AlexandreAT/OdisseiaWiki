import styled from "styled-components";

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ModalOverlay = styled.div<{ $mobileInset?: boolean }>`
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
  box-sizing: border-box;

  @media (max-width: 767px) {
    padding: ${({ $mobileInset }) => $mobileInset ? '12px' : '0'};
  }
`;

export const ModalContainer = styled.div<{
  theme: 'light' | 'dark';
  neon: 'on' | 'off';
  $width?: string;
  $mobileInset?: boolean;
}>`
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
    width: ${({ $mobileInset }) => $mobileInset ? '100%' : '100vw'};
    max-width: ${({ $mobileInset }) => $mobileInset ? '100%' : '100vw'};
    height: ${({ $mobileInset }) => $mobileInset ? 'auto' : '100dvh'};
    max-height: ${({ $mobileInset }) => $mobileInset ? 'calc(100dvh - 24px)' : '100dvh'};
    margin: 0;
    border-radius: ${({ $mobileInset }) => $mobileInset ? '8px' : '0'};

    input,
    select,
    textarea {
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
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

  @media (max-width: 767px) {
    padding: 10px;
    overscroll-behavior: contain;
  }
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
