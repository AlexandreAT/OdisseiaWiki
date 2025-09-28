import styled, { css } from "styled-components";

interface Props {
  theme?: "dark" | "light";
  neon?: "on" | "off";
  typeStatus?: "vida" | "estamina" | "mana";
  width?: string;
  height?: string;
}

const statusColors: Record<string, { neon: string; clear: string }> = {
  vida: { neon: "var(--neonRed)", clear: "var(--clearneonRed)" },
  estamina: { neon: "var(--neonGreen)", clear: "var(--clearneonGreen)" },
  mana: { neon: "var(--neonBlue)", clear: "var(--clearneonBlue)" },
};

export const ContentController = styled.div<Props>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: ${({ width }) => width || `100%`};
  ${({ height }) => height && `height: ${height};`}
`;

export const StatusLabel = styled.span`
  font-family: "DO Futuristic", sans-serif;
  font-size: 0.8em;
  font-weight: 500;
  letter-spacing: 2px;
  margin-bottom: 6px;
  color: var(--whitesmoke);
`;

export const StatusInputField = styled.input<Props>`
  width: 100%;
  height: 100%;
  padding: 10px;
  border-radius: 7px;
  outline: none;
  font-size: 0.9em;
  font-weight: 600;

  ${({ theme, neon, typeStatus }) => {
    const colors = statusColors[typeStatus || "vida"];

    return css`
      background-color: ${theme === "dark"
        ? "var(--blackTransp)"
        : neon === "on"
        ? "var(--clearWhite)"
        : "var(--clearblack)"};

      border: 2px solid ${neon === "on" ? "#fff" : colors.clear};

      color: var(--deepgrey);

      box-shadow: ${neon === "on"
        ? `0 0 8px 1px ${colors.neon}, inset 0 0 8px 1px ${colors.neon}`
        : "0 0 1px 1px rgba(50, 50, 50, 0.8)"};

      &:read-only {
        opacity: 0.7;
        cursor: not-allowed;
      }
    `;
  }}
`;