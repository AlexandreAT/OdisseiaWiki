import styled from 'styled-components';

interface Props {
    image?: string;
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

const ContainerBanner = styled.div<Props>`
    height: 80vh;
    width: 100%;
    padding: 4% 2% 4% 0px;
    background-image: url(${props => props.image});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 2px solid var(--black);
    border-radius: 10px;
    position: relative;

    ${props => props.theme === 'light' && `
        box-shadow: 0px 0px 10px var(--lightBlack);
    `};

    ${props => props.neon === 'on' && `
        border-color: white;
        box-shadow: 0px 0px 10px var(--clearneonBlue), inset 0px 0px 10px var(--clearneonBlue);
        ${props.theme === 'light' && `
            border-color: var(--whitesmoke);
            box-shadow: 0px 0px 10px 2px var(--clearneonViolet), inset 0px 0px 10px 2px var(--clearneonViolet);
        `};
    `};

    @media (min-width: 1600px) and (max-width: 3600px) {
        margin-top: -70px;
    };

    @media (max-width: 768px) {
        height: 50vh;
    };

    @media (max-width: 550px) {
        padding: 10% 0% 2%;
    };

    transition: all 0.3s ease-in-out, background-image 0.04s ease;
`;

const BannerEfect = styled.div<Props>`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    z-index: 0;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.3);
    ${props => props.theme === 'light' && `
        background-color: transparent;
    `};
`;

const BannerContent = styled.div<Props>`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    padding-left: 25px;
    width: 100%;
    margin-left: -15px;
    position: absolute;   
    transition: all 0.3s ease-in-out;

    ${props => props.theme === 'dark' && `
        background: linear-gradient(90deg, var(--black) 20%, rgba(77,238,234,0) 100%);
    `};

    ${props => props.theme === 'light' && `
        background: linear-gradient(90deg, #ccf0e4 20%, rgba(77,238,234,0) 95%);
    `};

    @media (max-width: 480px) {
        gap: 12px;
        padding: 15px 2px 15px 28px;
        width: 347px;
        ${props => props.theme === 'dark' && `
            background: linear-gradient(90deg, var(--black) 40%, rgba(77,238,234,0) 100%);
        `};
    
        ${props => props.theme === 'light' && `
            background: linear-gradient(90deg, #ccf0e4 40%, rgba(77,238,234,0) 95%);
        `};
    };
`;

const BannerText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;

    @media (max-width: 768px) {
        gap: 8px;
    };
`;

const Title = styled.h1<Props>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    text-shadow: 0px 0px 10px var(--clearneonPink);
    font-size: 30px;

    ${props => props.theme === 'light' && `
        color: var(--deepneonViolet) !important;
        text-shadow: 0px 0px 5px var(--clearneonViolet);    
    `};

    ${props => props.neon === 'on' && `
        color: var(--clearneonBlue) !important;
        text-shadow: 1.5px 1.5px 5px var(--clearneonPink);    
        ${props.theme === 'light' && `
            color: var(--neonViolet) !important;
            text-shadow: 1.5px 1.5px 5px var(--clearneonViolet);
        `};
    `};

    @media (max-width: 768px) {
        font-size: 25px;
    };

    @media (max-width: 480px) {
        font-size: 20px;
    };

    transition: all 0.3s ease-in-out;
`;

const Paragraph = styled.p<Props>`
    width: 90%;
    text-shadow: 0px 0px 2px var(--clearneonBlue);
    font-size: 22px;

    ${props => props.theme === 'light' && `
        width: 90%;
        color: var(--black) !important;
        text-shadow: 0.5px 0.5px 1px var(--clearneonViolet);    
    `};

    ${props => props.neon === 'on' && `
        color: var(--clearneonBlue) !important;
        text-shadow: 0.5px 0.5px 3px var(--clearneonPink);
        ${props.theme === 'light' && `
            color: var(--deepneonViolet) !important;
            text-shadow: 0.5px 0.5px 1px var(--neonYellow);
        `};
    `};

    @media (max-width: 768px) {
        font-size: 18px;
    };

    @media (max-width: 480px) {
        font-size: 14px;
    };

    transition: all 0.3s ease-in-out;
`;

export { ContainerBanner, BannerEfect, BannerContent, BannerText, Title, Paragraph };