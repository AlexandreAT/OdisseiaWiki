import styled from "styled-components";

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

interface OptionButtonProps extends Props {
    selected: boolean;
}

interface OptionsControllerProps {
    expanded: boolean;
}

interface MainContentProps {
    sidebarExpanded: boolean;
}

interface ToggleSidebarButtonProps extends Props {
    expanded: boolean;
}

export const MainContainer = styled.div`
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: row;
`

export const OptionsController = styled.div<OptionsControllerProps>`
    width: ${props => props.expanded ? '150px' : '0px'};
    position: fixed;
    top: 80px;
    left: 0;
    height: calc(100vh - 80px);
    transition: width 0.3s ease-in-out;
    z-index: 0;
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

export const MainContent = styled.div<MainContentProps>`
    padding: 20px;
    width: 100%;
    min-height: 100vh;
    height: 100%;
    margin-left: ${props => props.sidebarExpanded ? '150px' : '0px'};
    display: flex;
    flex-direction: column;
    transition: margin-left 0.3s ease-in-out;
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

export const ToggleSidebarButton = styled.button<ToggleSidebarButtonProps>`
    position: absolute;
    top: 80px;
    right: ${props => props.expanded ? '-40px' : '-40px'};
    width: 40px;
    height: 40px;
    border: 1px solid ${({ theme, neon }) =>
        neon === 'on'
            ? theme === 'dark'
                ? 'var(--clearneonBlue)'
                : 'var(--clearneonViolet)'
            : theme === 'dark'
                ? 'var(--grey)'
                : 'var(--lightGrey)'};
    background-color: ${({ theme }) =>
        theme === 'light' ? 'var(--black)' : 'var(--black-blue)'};
    color: ${({ theme, neon }) =>
        neon === 'on'
            ? theme === 'dark'
                ? 'var(--clearneonBlue)'
                : 'var(--clearneonViolet)'
            : theme === 'dark'
                ? 'var(--whitesmoke)'
                : 'var(--lightGrey)'};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 0 8px 8px 0;
    transition: all 0.3s ease-in-out;
    outline: none;
    z-index: 15;

    &:hover {
        color: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'dark'
                    ? 'var(--neonBlue)'
                    : 'var(--neonPink)'
                : theme === 'dark'
                    ? 'var(--neonPink)'
                    : 'var(--neonViolet)'};
        box-shadow: ${({ theme, neon }) =>
            neon === 'on'
                ? theme === 'dark'
                    ? '0px 0px 10px var(--clearneonBlue)'
                    : '0px 0px 10px var(--clearneonViolet)'
                : 'none'};
    }

    svg {
        width: 24px;
        height: 24px;
    }
`
