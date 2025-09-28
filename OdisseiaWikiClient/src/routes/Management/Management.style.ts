import styled from "styled-components";

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

interface OptionButtonProps extends Props {
    selected: boolean;
}

export const MainContainer = styled.div`
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: row;
`

export const OptionsController = styled.div`
    width: 150px;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
`

export const Options = styled.div<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 100px;
    gap: 10px;
    width: 100%;
    height: 100%;
    background-color: ${({ theme }) =>
        theme === 'light' ? 'var(--black)' : 'var(--black-blue)'};
    border-right: 2px solid
        ${({ theme, neon }) =>  
            neon === 'on'
                ? theme === 'light'
                    ? 'white'
                    : 'white'
                : 'var(--grey)'};
    box-shadow:
        ${({ neon, theme }) =>
            neon === 'on'
                ? theme === 'light'
                    ? '0px 0px 10px 2px var(--clearneonViolet)'
                    : '0px 0px 10px var(--clearneonBlue)'
                : 'none'};
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 15px;
    transition: all 0.3s ease-in-out;
`

export const MainContent = styled.div`
    padding: 20px;
    width: 100%;
    min-height: 100vh;
    height: 100%;
    margin-left: 150px;
    display: flex;
    flex-direction: column;
`

export const OptionButton = styled.button<OptionButtonProps>`
    width: 90%;
    padding: 10px 0;
    border: none;
    background: ${({ selected }) => selected ? 'transparent' : 'rgba(0,0,0,0.03)'};
    color: ${({ selected, theme, neon }) =>
        selected
            ? neon === 'on'
                ? theme === 'dark'
                    ? 'var(--clearneonBlue)'
                    : 'var(--clearneonViolet)'
                : theme === 'dark'
                    ? 'var(--clearneonPink)'
                    : 'var(--clearneonViolet)'
            : neon === 'on'
                ? theme === 'dark'
                    ? 'var(--black-blue)'
                    : 'var(--black)'
                : theme === 'dark'
                    ? 'var(--whitesmoke)'
                    : 'var(--lightGrey)'
    };
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 16px;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, color 0.2s;
    outline: none;
    letter-spacing: 1px;

    ${({ selected, theme, neon }) => !selected && neon === 'on' && `
        text-shadow: ${
            theme === 'dark'
                ? '-1px -1px 0px var(--neonBlue), -1px 1px 0px var(--neonBlue), 1px -1px 0px var(--neonBlue), 1px 1px 0px var(--neonBlue)'
                : '-1px -1px 0px var(--clearneonViolet), -1px 1px 0px var(--clearneonViolet), 1px -1px 0px var(--clearneonViolet), 1px 1px 0px var(--clearneonViolet)'
        };
    `}

    &:hover {
        color: ${({ selected, theme, neon }) =>
            !selected
                && (neon === 'on'
                    ? theme === 'dark'
                        ? 'var(--clearneonBlue)'
                        : 'var(--neonPink)'
                    : theme === 'dark'
                        ? 'var(--neonPink)'
                        : 'var(--neonViolet)')
        };
    }
`

export const ContainerContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    z-index: 0;
`