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

    @media (max-width: 768px) {
        padding: 10px;
    };

    @media (max-width: 480px) {
        justify-content: space-between;
        padding: 0px;
        gap: 8px;
    };

    transition: all 0.3s ease-in-out;
`;

const ContainerLogo = styled.div`
    width: 25%;
    display: flex;
    
    @media (max-width: 480px) {
        width: 10%;
    };
`

const Options = styled.div<Props>`
    display: flex;
    gap: 1rem;
    width: 50%;
    justify-content: center;
    align-items: center;

    @media (max-width: 900px) {
        gap: 8px;
    };

    @media (max-width: 480px) {
        display: flex;
        flex-direction: row;
        align-items: center;
        height: 35px;
        gap: 10px;
        overflow-x: auto;
        margin: 0 8px;
        padding: 6px 0 0;
        justify-content: flex-start;
        width: 80%;

        &::-webkit-scrollbar {
            height: 3px; 

            ${props => props.neon === 'on' && `
                height: 2px;     
            `};
        };

        &::-webkit-scrollbar-track {
            background: transparent; 
        };

        &::-webkit-scrollbar-thumb {
            background: transparent;
            border-radius: 10px;
        };

        &:hover::-webkit-scrollbar-thumb {
            background: var(--neonBlue);
            ${ props => props.theme === 'light' && `
                background: var(--clearneonViolet) !important;
            `};
        };
    };
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
        font-size: 13px;
    };

    transition: all 0.3s ease-in-out;
`;

const ContainerTheme = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: end;
    width: 25%;

    @media (max-width: 900px) {
        gap: 5px;
    };
    @media (max-width: 480px) {
        gap: 3px;
        margin: 5px 10px 0px 0px;
        width: 10%;
    };
`;

export const AvatarCotroller = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
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