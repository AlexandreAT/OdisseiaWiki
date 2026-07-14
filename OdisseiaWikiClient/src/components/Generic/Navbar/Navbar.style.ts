import styled from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

const ContainerNavbar = styled.div<Props>`
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: center;
    width: 100%;
    padding: 1rem;
    border-bottom: 2px solid transparent;
    border-radius: 10px;
    position: relative;
    z-index: 40;
    box-sizing: border-box;

    ${ props => props.theme === 'dark' ? `
        border-color: var(--grey);
    ` : `
        border-color: var(--grey);
    `};

    ${ props => props.neon === 'on' && `
        border-color: white;
        box-shadow: 0px 0px 10px var(--clearneonBlue), inset 0px 0px 10px var(--clearneonBlue);
    `};

    ${ props => props.neon === 'on' && props.theme === 'light' && `
        border-color: white;
        box-shadow: 0px 0px 10px 2px var(--clearneonViolet), inset 0px 0px 10px 2px var(--clearneonViolet);
    `};

    @media (max-width: 1100px) {
        gap: 10px;
        padding: 12px;
    };

    @media (max-width: 768px) {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        height: 54px;
        padding: 8px 12px;
        gap: 8px;
    };

    @media (max-width: 480px) {
        padding: 6px 8px;
        gap: 6px;
    };

    transition: all 0.3s ease-in-out;
`;

const ContainerLogo = styled.div`
    width: 25%;
    display: flex;
    min-width: 0;

    @media (max-width: 1100px) {
        width: 28%;
    };

    @media (max-width: 768px) {
        width: auto;
    };
    
    @media (max-width: 480px) {
        width: auto;
    };
`

const Options = styled.div<Props>`
    display: flex;
    gap: 1rem;
    width: 50%;
    justify-content: center;
    align-items: center;
    min-width: 0;

    @media (max-width: 1100px) {
        gap: 8px;
        width: 48%;
    };

    @media (max-width: 768px) {
        display: flex;
        width: 100%;
        min-width: 0;
        gap: 8px;
        justify-content: flex-start;
    };
`;

export const NavigationLinks = styled.nav`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-width: 0;

    @media (max-width: 1100px) {
        gap: 8px;
    }

    @media (max-width: 768px) {
        flex: 1;
        justify-content: flex-start;
        gap: 12px;
        overflow-x: auto;
        overflow-y: hidden;
        white-space: nowrap;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
            display: none;
        }

        > .link {
            flex-shrink: 0;
        }
    }
`;

const SpanOption = styled.div<Props>`
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 15px;

    &:hover {
        transform: scale(1.05);
        text-shadow: 0px 0px 5px var(--clearneonBlue);
    }

    ${ props => props.theme === 'light' && `
        color: var(--lightGrey) !important;
        &:hover {
            transform: scale(1.05);
            text-shadow: 1.5px 1.5px 5px var(--clearneonViolet);
        }
        ${props.neon === 'on' && `
            color: var(--clearneonViolet) !important;
            &:hover {
                text-shadow: 1px 1px 3px var(--deepneonYellow);
            }
        `};
    `};

    @media (max-width: 768px) {
        font-size: 11px;
        white-space: nowrap;
    };

    transition: all 0.3s ease-in-out;
`;

const ContainerTheme = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: end;
    width: 25%;

    @media (max-width: 1100px) {
        gap: 5px;
        width: 24%;
    };
    @media (max-width: 768px) {
        width: auto;
    };
    @media (max-width: 480px) {
        gap: 3px;
        margin: 0;
        width: auto;
    };
`;

export const AvatarCotroller = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
    z-index: 9999;

    @media (max-width: 768px) {
        justify-content: flex-start;
    }
`


export const Avatar = styled.div<Props>`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease-in-out;

    ${props => props.neon === 'on' && `
        box-shadow: 0 0 8px var(--clearneonBlue);
    `};

    ${props => props.theme === 'light' && props.neon === 'on' && `
        box-shadow: 0 0 8px var(--clearneonViolet);
    `};

    &:hover {
        transform: scale(1.1);
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
`;


export { ContainerNavbar, ContainerLogo, Options, SpanOption, ContainerTheme };
