import styled from "styled-components";

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const FormContainer = styled.div<Props>`
    display: flex;
    flex-direction: column;
    width: 90%;
    max-width: 1200px;
    min-height: 600px;
    border-radius: 8px;
    padding: 25px;
    ${({ theme }) => theme === 'light' ? 'background-color: var(--clearWhite)' : 'background-color: rgba(0, 0, 0, 0.5)'};
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
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 1100px) {
        width: 96%;
        padding: 20px;
    }

    @media (max-width: 768px) {
        width: 100%;
        min-height: 0;
        padding: 16px;
    }

    @media (max-width: 480px) {
        padding: 12px 8px;
    }
`
