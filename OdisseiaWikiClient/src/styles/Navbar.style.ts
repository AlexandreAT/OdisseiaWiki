import styled from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

const ContainerNavbar = styled.div<Props>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
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
        justify-content: center;
        padding: 0px;
        gap: 8px;
    };

    transition: all 0.3s ease-in-out;
`;

const Logo = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    
    @media (max-width: 480px) {
        margin: 8px 0px 6px 8px;
        .linkTitle{
            display: none;
        };
        padding-top: 3px;
    };
`;

const LogoImg = styled.img`
    width: 50px;

    @media (max-width: 900px) {
        width: 35px;
    };

    @media (max-width: 768px) {
        width: 30px;
    };

    @media (max-width: 480px) {
        width: 18px;
    };
`;

const Title = styled.h1<Props>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    font-size: 2rem;
    letter-spacing: 3px;
    color: white;
    text-shadow: 1px 1px 4px var(--clearneonPink);
    
    ${ props => props.theme === 'light' && `
        color: white !important;
        text-shadow: 0px 0px 5px var(--clearneonViolet);    
    `};

    ${ props => props.neon === 'on' && `
        color: var(--clearneonBlue) !important;
        text-shadow: 1.5px 1.5px 5px var(--clearneonPink);    
    `};

    ${ props => props.neon === 'on' && props.theme === 'light' && `
        color: var(--clearneonViolet) !important;
        text-shadow: 1.5px 1.5px 5px var(--deepneonViolet);    
    `};

    @media (max-width: 900px) {
        font-size: 25px;
    };

    transition: all 0.3s ease-in-out;
`;

const Options = styled.div<Props>`
    display: flex;
    gap: 1rem;

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
    justify-content: center;
    gap: 10px;

    @media (max-width: 900px) {
        gap: 5px;
    };
    @media (max-width: 480px) {
        gap: 3px;
        margin: 5px 10px 0px 0px;
    };
`;

const OptionButton = styled.button<Props>`
    background-color: transparent;
    border: none;
    font-size: 18px;

    .iconOff:hover,
    .iconOn:hover,
    .iconDark:hover,
    .iconLight:hover {
        transform: scale(1.5);
    }
    
    ${ props => props.theme === 'dark' ? `
        .iconDark {
            fill: var(--grey);
            transition: all 0.3s ease-in-out;
        }
    ` : `
        .iconLight {
            fill: var(--neonOrange);
            transition: all 0.3s ease-in-out;
        }
    `};

    ${ props => props.neon === 'on' ? `
        .iconOn {
            fill: var(--neonBlue);
            transition: all 0.3s ease-in-out;
        }
    ` : `
        .iconOff {
            fill: var(--grey);
            transition: all 0.3s ease-in-out;
        }
    `}

    @media (max-width: 480px) {
        font-size: 14px;
    };
`;



export { ContainerNavbar, Logo, LogoImg, Title, Options, SpanOption, ContainerTheme, OptionButton };