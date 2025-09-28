import styled from "styled-components";

interface Props {
  theme?: "dark" | "light";
  neon?: "on" | "off";
  width?: string;
}

export const ListController = styled.div<Props>`
    display: flex;
    flex-wrap: wrap; /* ✅ permite quebra de linha */
    gap: 5px;
    width: ${({ width }) => width || "100%"};
    padding: 5px;
    background: ${({ theme, neon }) =>
        theme === "dark"
        ? "var(--blackTransp)"
        : neon === "on"
        ? "var(--clearWhite)"
        : "var(--clearblack)"};

    border-radius: 5px;
    
    border: 2px solid var(--black-blue);
    
    box-shadow: 0 0 1px 1px rgba(50, 50, 50, 0.8);
`;

export const ListItem = styled.div<Props>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
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
