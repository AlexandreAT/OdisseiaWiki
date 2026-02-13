import styled from "styled-components";

interface Props {
  theme?: "dark" | "light";
  neon?: "on" | "off";
  width?: string;
}

export const ListWrapper = styled.div<{ width?: string }>`
  width: ${({ width }) => width || "100%"};
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

export const ListController = styled.div<Props>`
    position: relative;
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    padding: 5px;
    box-sizing: border-box;
    background: ${({ theme, neon }) =>
        theme === "dark"
        ? "var(--blackTransp)"
        : neon === "on"
        ? "var(--clearWhite)"
        : "var(--clearblack)"};

    border-radius: 5px;
    border: 2px solid var(--black-blue);
    box-shadow: 0 0 1px 1px rgba(50, 50, 50, 0.8);
    overflow: hidden;
`;

export const ScrollContainer = styled.div`
    display: flex;
    gap: 5px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    flex: 1;
    min-width: 0;
    padding: 2px 2px 5px 2px;

    &::-webkit-scrollbar {
        height: 4px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--clearneonBlue);
        border-radius: 3px;
        transition: background 0.2s;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--clearneonPink);
    }
`;

export const ListItem = styled.div<Props>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  flex-shrink: 0;
  background: ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--black-blue)"
        : "var(--deepgray)"
      : neon === "on"
      ? "var(--clearWhite)"
      : "var(--whitesmoke)"};
  border: 1px solid ${({ theme, neon }) =>
    theme === "dark" 
        ? neon === "on"
            ? "var(--clearneonBlue)"
            : "var(--black-blue)"
        : "var(--black-blue)"};
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
`;

export const ItemName = styled.span`
  white-space: nowrap;
`;

export const DeleteButton = styled.button<Props>`
    background: transparent;
    border: none;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.2s;
    display: flex;
    align-items: center;

    .icon {
        fill: ${({ theme }) =>
            theme === "dark" ? "var(--lightGrey)" : "var(--deepgrey)"} !important;
    }

    &:hover {
        .icon{
            fill: var(--neonRed) !important;
        }
    }
`;

export const NavigationButton = styled.button<Props & { position?: 'left' | 'right' }>`
    background: ${({ theme, neon }) =>
        theme === "dark"
            ? neon === "on"
                ? "var(--black-blue)"
                : "var(--deepgray)"
            : neon === "on"
            ? "var(--clearWhite)"
            : "var(--whitesmoke)"};
    border: 2px solid ${({ theme, neon }) =>
        theme === "dark" 
            ? neon === "on"
                ? "var(--clearneonBlue)"
                : "var(--black-blue)"
            : "var(--black-blue)"};
    border-radius: 5px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;

    .icon {
        font-size: 1.5em;
        fill: ${({ theme, neon }) =>
            theme === "dark"
                ? neon === "on"
                    ? "var(--clearneonBlue)"
                    : "var(--whitesmoke)"
                : "var(--black-blue)"} !important;
        transition: fill 0.3s;
    }

    &:hover:not(:disabled) {
        background: ${({ theme, neon }) =>
            theme === "dark"
                ? "var(--clearneonBlue)"
                : "var(--clearneonPink)"};
        border-color: ${({ theme, neon }) =>
            theme === "dark"
                ? "var(--clearneonBlue)"
                : "var(--clearneonPink)"};
        ${({ theme, neon }) =>
            neon === "on" &&
            (theme === "dark"
                ? "box-shadow: 0 0 10px var(--clearneonBlue);"
                : "box-shadow: 0 0 10px var(--clearneonPink);")}

        .icon {
            fill: var(--black) !important;
        }
    }

    &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }
`;
