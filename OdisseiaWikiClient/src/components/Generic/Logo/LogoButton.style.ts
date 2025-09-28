import styled from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const Logo = styled.div`
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

export const LogoImg = styled.img`
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

export const Title = styled.h1<Props>`
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