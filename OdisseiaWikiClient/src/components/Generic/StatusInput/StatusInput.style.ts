import styled, { css, keyframes } from "styled-components";

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
  margin-bottom: 4px;
  color: var(--whitesmoke);
`;

export const StatusInputField = styled.input<Props>`
  width: 100%;
  height: ${({ height }) => height || "36px"};
  padding: 0 10px;
  border-radius: 7px;
  outline: none;
  font-size: 1em;
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

const scanline = keyframes`
  0% { transform: translateX(-140%); opacity: 0; }
  25% { opacity: 0.22; }
  75% { opacity: 0.22; }
  100% { transform: translateX(140%); opacity: 0; }
`;

const neonPulse = keyframes`
  0%, 100% { filter: saturate(1) brightness(0.98); }
  50% { filter: saturate(1.08) brightness(1.06); }
`;

const shellScan = keyframes`
  0% { transform: translateX(-120%); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
`;


export const StatusInputShell = styled.div<Props>`
  position: relative;
  width: 100%;
  height: ${({ height }) => height || "36px"};
  border-radius: 7px;
  overflow: hidden;

  ${({ theme, neon, typeStatus }) => {
    const colors = statusColors[typeStatus || "vida"];

    return css`
      background: ${theme === "dark"
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

  ${({ neon, typeStatus }) => {
    if (neon !== "on") return "";

    const scanDuration = typeStatus === "vida" ? "4.4s" : typeStatus === "estamina" ? "3.6s" : "5.2s";

    return css`
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background: linear-gradient(90deg, transparent 0%, #ffffff3d 50%, transparent 100%);
        animation: ${shellScan} ${scanDuration} linear infinite;
      }
    `;
  }}
`;

export const StatusFill = styled.div<Props & { percentage: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ percentage }) => `${Math.max(0, Math.min(percentage, 100))}%`};
  transition: width 340ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
  ${({ neon, typeStatus }) => {
    if (neon !== "on") return "";

    const pulseDuration = typeStatus === "vida" ? "1.7s" : typeStatus === "estamina" ? "1.35s" : "2.1s";
    return css`
      animation: ${neonPulse} ${pulseDuration} ease-in-out infinite;
    `;
  }}

  ${({ typeStatus }) => {
    const colors = statusColors[typeStatus || "vida"];
    return css`
      background-color: ${colors.neon};
      box-shadow: inset 0 0 10px ${colors.neon}CC, 0 0 12px ${colors.neon}88;
    `;
  }}
`;

export const StatusInputsRow = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0 10px;
`;

export const StatusMiniInput = styled.input<{ align: "left" | "right"; emphasis: "current" | "max" }>`
  width: ${({ emphasis }) => (emphasis === "current" ? "58%" : "40%")};
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  text-align: ${({ align }) => align};
  font-size: ${({ emphasis }) => (emphasis === "current" ? "1.08em" : "0.88em")};
  font-weight: ${({ emphasis }) => (emphasis === "current" ? 800 : 600)};
  color: var(--whitesmoke);
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.75);

  appearance: textfield;
  -moz-appearance: textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:read-only {
    opacity: 0.85;
    cursor: not-allowed;
  }
`;