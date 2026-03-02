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
  color: var(--whitesmoke);
`;

export const StatusHeader = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
  margin-bottom: 4px;
`;

export const CalculatorTrigger = styled.button<Props>`
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  color: ${({ theme, neon }) =>
    theme === "dark"
      ? neon === "on"
        ? "var(--clearneonBlue)"
        : "var(--clearWhite)"
      : neon === "on"
      ? "var(--neonViolet)"
      : "var(--deepgrey)"};
  transition: transform 0.15s ease, filter 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    filter: ${({ neon }) => (neon === "on" ? "drop-shadow(0 0 4px currentColor)" : "none")};
  }

  .icon {
    font-size: 0.95rem;
  }
`;

export const CalculatorDropdown = styled.div<Props>`
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 30;
  min-width: 120px;
  padding: 6px;
  border-radius: 6px;
  background: ${({ theme }) => (theme === "dark" ? "var(--deepgrey)" : "var(--whitesmoke)")};
  border: none;
  box-shadow: ${({ neon, theme }) =>
    neon === "on"
      ? `0 0 8px ${theme === "dark" ? "var(--neonBlue)" : "var(--neonViolet)"}, 0 4px 10px rgba(0,0,0,0.35)`
      : "0 2px 6px rgba(0,0,0,0.2)"};
`;

export const CalculatorInput = styled.input<Props>`
  width: 100%;
  height: 28px;
  border-radius: 4px;
  border: 1px solid
    ${({ theme, neon }) =>
      theme === "dark"
        ? neon === "on"
          ? "var(--clearneonBlue)"
          : "var(--clearWhite)"
        : neon === "on"
        ? "var(--neonViolet)"
        : "var(--lightGrey)"};
  outline: none;
  padding: 0 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => (theme === "dark" ? "var(--whitesmoke)" : "var(--deepgrey)")};
  background: ${({ theme }) => (theme === "dark" ? "var(--lightBlack)" : "var(--clearWhite)")};
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
  transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
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

export const StatusValueGroup = styled.div<{ emphasis: "current" | "max" }>`
  position: relative;
  width: ${({ emphasis }) => (emphasis === "current" ? "58%" : "40%")};
  display: flex;
  align-items: center;
`;

export const StatusMiniInputWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  position: relative;
`;

export const OverflowPlus = styled.div`
  position: absolute;
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 800;
  color: var(--whitesmoke);
  pointer-events: none;
  user-select: none;
  margin-left: 2px;
  top: -5px;
  left: -10px;
`;

export const StatusMiniInput = styled.input<{ align: "left" | "right"; emphasis: "current" | "max" }>`
  width: ${({ emphasis }) => (emphasis === "current" ? "auto" : "100%")};
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