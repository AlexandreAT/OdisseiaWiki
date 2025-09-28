import styled from "styled-components";

interface Props {
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
    width?: string;
}

export const BoxContainer = styled.div<Props>`
    ${({ width }) => width && `width: ${width};`};
    display: flex;
    padding: 2px 16px 2px 8px;
    border-left: 2px solid ${({ theme, neon }) =>
        theme === "dark" 
            ? neon === "on" 
                ? "var(--clearneonBlue)"
                : "var(--grey)"
            : neon === "on"
                ? "var(--neonViolet)"
                : "var(--lightBlack)"
        };
    
    border-bottom: 2px solid ${({ theme, neon }) =>
        theme === "dark" 
            ? neon === "on" 
                ? "var(--neonBlue)"
                : "var(--grey)"
            : neon === "on"
                ? "var(--neonViolet)"
                : "var(--lightBlack)"
        };
    border-bottom-left-radius: 5px;
    box-sizing: border-box;
`