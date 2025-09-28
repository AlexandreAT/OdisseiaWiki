import styled from "styled-components";

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const FormContainer = styled.div<Props>`
    display: flex;
    flex-direction: column;
    width: 70%;
    max-width: 1000px;
    min-height: 600px;
    border-radius: 8px;
    padding: 25px;
    ${({ theme }) => theme === 'light' && 'background-color: var(--clearWhite)'};
    border: 2px solid ${({ theme, neon }) =>
        neon === 'on'
            ? theme === 'light'
                ? 'var(--neonViolet)'
                : 'var(--clearneonBlue)'
            : theme === 'light'
                ? 'var(--deepneonViolet)'
                : 'var(--neonBlue)'};

    box-shadow: ${({ theme, neon }) =>
        neon === 'on'
            ? theme === 'light'
            ? '0 0 12px var(--clearneonViolet)'
            : '0 0 12px var(--clearneonPink)'
            : 'none'};
`
