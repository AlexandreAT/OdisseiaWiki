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

export const BarContainer = styled.div<Props>`
  position: relative;
  width: 100%;
  height: ${({ height }) => height || "24px"};
  border-radius: 7px;
  overflow: hidden;

  ${({ theme, neon, typeStatus }) => {
    const colors = statusColors[typeStatus || "vida"];
    return css`
      background-color: ${theme === "dark"
        ? "var(--blackTransp)"
        : neon === "on"
        ? "var(--clearWhite)"
        : "var(--clearblack)"};

      border: 2px solid ${neon === "on" ? "#fff" : colors.clear};

      box-shadow: ${neon === "on"
        ? `0 0 8px 1px ${colors.neon}, inset 0 0 8px 1px ${colors.neon}`
        : "0 0 1px 1px rgba(50, 50, 50, 0.8)"};
    `;
  }}
`;

export const BarFill = styled.div<Props>`
  height: 100%;
  transition: width 0.3s ease;

  ${({ typeStatus }) => {
    const colors = statusColors[typeStatus || "vida"];
    return css`
      background-color: ${colors.neon};
    `;
  }}
`;

export const ValueText = styled.p`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1em;
  font-weight: 600;
  color: var(--whitesmoke);
  text-shadow: 1px 1px 1px black;
`;