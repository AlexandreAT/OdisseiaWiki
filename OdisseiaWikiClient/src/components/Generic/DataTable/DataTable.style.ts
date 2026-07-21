import styled, { css, keyframes } from "styled-components";

type Props = {
  theme: "dark" | "light";
  neon: "on" | "off";
  $error?: boolean;
};

const validationPulse = keyframes`
  0%, 100% {
    border-color: var(--clearneonRed);
    box-shadow: 0 0 8px 1px var(--neonRed), 0 0 16px rgba(0, 166, 255, 0.32);
  }
  45% {
    border-color: var(--clearneonBlue);
    box-shadow: 0 0 10px 2px var(--neonBlue), 0 0 18px rgba(255, 0, 65, 0.38);
  }
`;

export const DataTableContainer = styled.div<Props>`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    max-width: 100%;
    overflow: visible;

    ${({ $error }) => $error && css`
      padding: 5px;
      border: 2px solid var(--clearneonRed);
      border-radius: 9px;
      animation: ${validationPulse} 0.85s ease-in-out 2;
    `}

    .MuiPaper-root .icon{
        fill: ${({ theme, neon }) => theme === "dark" 
            ? neon === "on" 
                ? "var(--clearneonBlue)"
                : "var(--neonBlue)"
            : neon === "on" 
                ? "var(--clearneonViolet)"
                : "var(--neonViolet)"};
    }
    .MuiPaper-root .iconDelete {
        fill: ${({ neon }) => 
            neon === "on" 
                ? "var(--clearneonRed)"
                : "var(--neonRed)"}
    }

  .MuiPaper-root {
    background-color: ${({ theme }) =>
      theme === "dark" ? "var(--deepgray)" : "var(--whitesmoke)"} !important;
    border-radius: 7px;
    border: 1px solid
      ${({ theme }) => (theme === "dark" ? "var(--black)" : "var(--clearblack)")};
    box-shadow: 0 0 5px rgba(0,0,0,0.3);
    overflow: visible;
    min-width: 0;
    max-width: none;

    > div {
      max-width: 100%;
    }

    ${({ neon, theme }) =>
      neon === "on" &&
      css`
        &:focus-within {
          border-color: ${theme === "dark"
            ? "var(--clearneonBlue)"
            : "var(--clearneonPink)"};
          box-shadow: 0 0 12px 2px
            ${theme === "dark" ? "var(--neonBlue)" : "var(--neonViolet)"};
        }
      `}
  }

  && thead .MuiTableRow-root .MuiTableCell-head:first-child {
    border-top-left-radius: 7px;
  }

  && thead .MuiTableRow-root .MuiTableCell-head:last-child {
    border-top-right-radius: 7px;
  }

  && thead .MuiTableRow-root .MuiTableCell-head {
    background-color: ${({ theme }) =>
      theme === "dark" ? "var(--lightBlack)" : "var(--clearblack)"};
    border-bottom: 2px solid
      ${({ theme }) =>
        theme === "dark" ? "var(--lightBlue)" : "var(--lightGrey)"};
    padding-right: 20px;
    text-align: center !important;
  }

  && thead .MuiTableRow-root .MuiTableCell-head > div,
  && thead .MuiTableRow-root .MuiTableCell-head button {
    width: 100%;
    justify-content: center !important;
    text-align: center !important;
  }

  && thead .MuiTableRow-root .MuiTableCell-head [class*='MUIDataTableHeadCell-data'] {
    display: block;
    width: 100%;
    text-align: center !important;
  }

  && thead .MuiTableRow-root .MuiTableCell-head .tss-1akey0g-MUIDataTableHeadCell-data {
    text-transform: none !important;
    font-weight: 600;
    font-size: 0.85em;

    color: ${({ theme }) =>
      theme === "dark" ? "var(--lightGrey)" : "var(--whitesmoke)"} !important;
    font-size: 14px;
    font-weight: 600;

    ${({ neon, theme }) =>
      neon === "on" &&
      css`
        text-shadow: 0 0 6px
          ${theme === "dark" ? "var(--neonBlue)" : "var(--neonViolet)"};
        color: #fff !important;
      `}
  }

  && tbody .MuiTableCell-body {
    border-bottom: 1px solid
      ${({ theme }) =>
        theme === "dark" ? "var(--lightBlack)" : "var(--clearblack)"};
    padding: 10px;

    ${({ neon, theme }) =>
      neon === "on" &&
      css`
        &:hover {
          background-color: ${theme === "dark"
            ? "rgba(0, 150, 255, 0.05)"
            : "rgba(200, 0, 255, 0.08)"};
        }
      `}
  }

  && .MuiInputBase-input {
    color: ${({ theme }) =>
      theme === "dark" ? "var(--whitesmoke)" : "var(--black)"};
    font-size: 13px;
    text-align: left;
  }

  && .MuiInput-root:before {
    border-bottom: 1px solid
      ${({ theme }) => (theme === "dark" ? "var(--grey)" : "var(--lightBlack)")};
  }

  && .MuiInput-root:hover:not(.Mui-disabled, .Mui-error):before {
    border-bottom: 1px solid
      ${({ theme }) =>
        theme === "dark" ? "var(--clearneonBlue)" : "var(--clearneonViolet)"};
  }

  && .MuiInput-root.Mui-focused:after {
    border-bottom: 2px solid
      ${({ theme }) => (theme === "dark" ? "var(--neonBlue)" : "var(--neonViolet)")};
    ${({ neon, theme }) =>
      neon === "on" &&
      css`
        box-shadow: 0 0 8px
          ${theme === "dark" ? "var(--neonBlue)" : "var(--neonViolet)"};
      `}
  }

  @media (max-width: 768px) {
    && thead .MuiTableRow-root .MuiTableCell-head,
    && tbody .MuiTableCell-body {
      padding: 5px 6px;
      white-space: nowrap;
    }

    && thead .MuiTableRow-root .MuiTableCell-head .tss-1akey0g-MUIDataTableHeadCell-data,
    && .MuiInputBase-input {
      font-size: 11px;
    }

    && .MuiIconButton-root {
      width: 30px;
      height: 30px;
      padding: 5px;
    }
  }
`;

export const CellEditor = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  gap: 2px;
`;

export const CharacterCounter = styled.span`
  align-self: flex-end;
  min-height: 11px;
  padding-right: 1px;
  color: var(--grey) !important;
  font-size: 9px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0.025em;
  opacity: 0.68;
  pointer-events: none;
  user-select: none;
`;

export const ValidationMessage = styled.span`
  align-self: flex-start;
  padding: 4px 7px;
  border-left: 2px solid var(--clearneonRed);
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(255, 0, 55, 0.13), transparent);
  color: var(--clearneonRed) !important;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
  text-shadow: 0 0 5px rgba(255, 0, 55, 0.58);
`;

export const TableScrollContainer = styled.div`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;

  > .MuiPaper-root {
    width: max-content;
    min-width: 100%;
  }

  .MuiTableContainer-root {
    overflow: visible;
  }

  .MuiTable-root {
    width: 100%;
    min-width: 760px;
    table-layout: auto;
  }

  tr {
    display: table-row;
  }

  th,
  td {
    display: table-cell;
    min-width: 120px;
    vertical-align: middle;
  }

  th:last-child,
  td:last-child {
    min-width: 72px;
  }

  @media (max-width: 480px) {
    .MuiTable-root {
      min-width: 620px;
    }
  }
`;
