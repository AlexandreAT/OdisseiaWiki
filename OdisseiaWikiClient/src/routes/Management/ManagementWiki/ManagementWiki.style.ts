import styled from "styled-components";

interface Props {
    buttonClicked?: boolean;
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const ManagementContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 20px;
`;

export const ButtonDiv = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 250px;
    padding: 0;
    margin: 0;
    border-top-right-radius: 5px;
    border-top-left-radius: 5px;
    overflow: hidden;
`

export const ButtonForm = styled.button<Props>`
    border: 2px solid transparent;
    width: 50%;

    background-color: ${({ buttonClicked, theme, neon }) =>
        buttonClicked ?    
            neon === 'on'
                ? theme === 'light'
                    ? 'var(--clearneonViolet)'
                    : 'var(--clearneonBlue)'
                : theme === 'light'
                    ? 'var(--neonViolet)'
                    : 'var(--neonBlue)'
            : 'var(--deepgray)'};

    border-color: ${({ buttonClicked, theme, neon }) => 
        buttonClicked 
            ? neon === 'on'
                ? theme === 'light'
                    ? 'var(--clearneonViolet)'
                    : 'var(--clearneonBlue)'
                : theme === 'light'
                    ? 'var(--neonViolet)'
                    : 'var(--neonBlue)' 
            : 'var(--deepgray)'};
    padding: 5px;
    transition: all 0.3s ease-in-out;
`

export const BoxContent = styled.div<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 200px;
    background-color: transparent;
    gap: 15px;
    cursor: pointer;

    .icon {
        transition: all 0.3s ease;
        font-size: 50px;
        fill: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'light'
                    ? 'var(--clearneonViolet)'
                    : 'var(--clearneonBlue)'
                : theme === 'light'
                    ? 'var(--neonViolet)'
                    : 'var(--neonBlue)'
        };
    }

    z-index: 200;
`;

export const Button = styled.button<Props>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background-color: transparent;
    border: none;
    outline: none;
    clip-path: polygon(0 0, 83.5% 0, 100% 29%, 100% 100%, 18.5% 100%, 0% 68.5%, 0 100%);
    border-radius: 8px;
    
    .label {
        color: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'light'
                    ? 'var(--clearneonViolet)'
                    : 'var(--clearneonBlue)'
                : theme === 'light'
                    ? 'var(--black)'
                    : 'var(--whitesmoke)'
        };
    }

    &:hover ${BoxContent} .label {
        text-shadow: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'light'
                    ? '0 0 8px var(--clearneonViolet)'
                    : '0 0 8px var(--clearneonBlue)'
                : theme === 'light'
                    ? '0 0 4px var(--neonViolet)'
                    : '0 0 4px var(--neonBlue)'
        };

        color: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'light'
                    ? 'var(--clearneonViolet) !important'
                    : 'var(--clearneonBlue) !important'
                : theme === 'light'
                    ? 'var(--black) !important'
                    : 'var(--white) !important'};
    }

    &:hover .icon {
        transition: all 0.3s ease;
        transform: scale(1.2);

        filter: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'light'
                    ? `drop-shadow(0 0 3px var(--clearneonViolet))`
                    : `drop-shadow(0 0 3px var(--clearneonBlue))`
                : theme === 'light'
                    ? `drop-shadow(0 0 3px var(--neonViolet))`
                    : `drop-shadow(0 0 3px var(--neonBlue))`
        };
    }

    transition: all 0.3s ease;
`;