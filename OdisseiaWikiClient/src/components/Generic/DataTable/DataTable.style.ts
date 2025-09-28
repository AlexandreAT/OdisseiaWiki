import styled, { css } from "styled-components";

type Props = {
  theme: "dark" | "light";
  neon: "on" | "off";
};

export const DataTableContainer = styled.div<Props>`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;

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
    overflow: hidden;

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
`;
