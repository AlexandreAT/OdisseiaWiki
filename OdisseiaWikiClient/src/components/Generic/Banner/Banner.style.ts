import styled, { keyframes } from 'styled-components';

interface Props {
    image?: string;
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

const revealBannerImage = keyframes`
    0% {
        filter: blur(11px);
        transform: scale(1.14);
    }

    100% {
        filter: blur(0);
        transform: scale(1);
    }
`;

const drawBannerTextBackground = keyframes`
    0% {
        transform: scaleX(0);
    }

    100% {
        transform: scaleX(1);
    }
`;

const revealBannerText = keyframes`
    0% {
        opacity: 0;
        transform: translateY(clamp(180px, 48vh, 520px));
    }

    100% {
        opacity: 1;
        transform: translateY(0);
    }
`;

const ContainerBanner = styled.div<Props>`
    height: calc(100svh - clamp(64px, 5vw, 76px));
    width: 100%;
    padding: 4% 2% 4% 0px;
    border: 2px solid var(--black);
    border-radius: 10px;
    position: relative;
    isolation: isolate;
    overflow: hidden;

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

    @media (max-width: 768px) {
        height: calc(100svh - 6vw);
    };

    @media (max-width: 550px) {
        padding: 10% 0% 2%;
    };

    transition: all 0.3s ease-in-out;
`;

const BannerBackground = styled.div<Props>`
    position: absolute;
    inset: 0;
    z-index: 0;
    border-radius: inherit;
    background-image: url("${props => props.image}");
    background-size: cover;
    background-position: center bottom;
    background-repeat: no-repeat;
    animation: ${revealBannerImage} 1.5s cubic-bezier(0.22, 1, 0.36, 1) both;

`;

const BannerEfect = styled.div<Props>`
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    z-index: 1;
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
    top: 50%;
    left: 50%;
    width: min(88%, 1240px);
    margin: 0;
    padding: clamp(18px, 2vw, 30px);
    transform: translate(-50%, -46%);
    position: absolute;
    z-index: 2;
    isolation: isolate;
    transition: all 0.3s ease-in-out;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 100vw;
        margin-left: -50vw;
        z-index: -1;
        transform: scaleX(0);
        transform-origin: left center;
        animation: ${drawBannerTextBackground} 1.05s cubic-bezier(0.22, 1, 0.36, 1) 120ms forwards;
        background: ${props => props.theme === 'dark'
            ? 'linear-gradient(90deg, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.82) 34%, rgba(0, 0, 0, 0.46) 68%, rgba(0, 0, 0, 0) 100%)'
            : 'linear-gradient(90deg, rgba(238, 246, 244, 0.94) 0%, rgba(238, 246, 244, 0.82) 38%, rgba(238, 246, 244, 0.36) 74%, rgba(238, 246, 244, 0) 100%)'};
        pointer-events: none;
    }

    @media (max-width: 480px) {
        gap: 12px;
        padding: 15px 2px 15px 28px;
        left: 50%;
        width: calc(100% - 20px);
        max-width: 430px;

        &::before {
            background: ${props => props.theme === 'dark'
                ? 'linear-gradient(90deg, rgba(0, 0, 0, 0.94) 0%, rgba(0, 0, 0, 0.84) 48%, rgba(0, 0, 0, 0) 100%)'
                : 'linear-gradient(90deg, rgba(238, 246, 244, 0.96) 0%, rgba(238, 246, 244, 0.84) 48%, rgba(238, 246, 244, 0) 100%)'};
        }
    };
`;

const BannerTitleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;

    svg {
        width: clamp(360px, 42vw, 720px);
        height: clamp(54px, 7vw, 104px);
    }

    @media (max-width: 768px) {
        svg {
            width: min(86vw, 520px);
            height: clamp(48px, 12vw, 76px);
        }
    }

    @media (max-width: 480px) {
        svg {
            width: min(88vw, 390px);
            height: clamp(42px, 13vw, 62px);
        }
    }
`;

const BannerText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: min(82%, 980px);
    margin: 0 auto;

    @media (max-width: 768px) {
        gap: 8px;
        width: 92%;
    };
`;

const BannerRevealItem = styled.div<{ $delay: number }>`
    opacity: 0;
    animation: ${revealBannerText} 650ms cubic-bezier(0.22, 1, 0.36, 1)
        ${({ $delay }) => $delay}ms forwards;

`;

const Title = styled.h1<Props>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    text-shadow: 0px 0px 10px var(--clearneonPink);
    font-size: 38px;

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

    @media (min-width: 1600px) {
        font-size: 46px;
    };

    @media (max-width: 1200px) {
        font-size: 34px;
    };

    @media (max-width: 768px) {
        font-size: 30px;
    };

    @media (max-width: 480px) {
        font-size: 24px;
    };

    transition: all 0.3s ease-in-out;
`;

const Paragraph = styled.p<Props>`
    width: 100%;
    text-shadow: 0px 0px 2px var(--clearneonBlue);
    font-size: 24px;

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

    @media (min-width: 1600px) {
        font-size: 28px;
    };

    @media (max-width: 1200px) {
        font-size: 22px;
    };

    @media (max-width: 768px) {
        font-size: 20px;
    };

    @media (max-width: 480px) {
        font-size: 16px;
    };

    transition: all 0.3s ease-in-out;
`;

export {
    ContainerBanner,
    BannerBackground,
    BannerEfect,
    BannerContent,
    BannerTitleRow,
    BannerRevealItem,
    BannerText,
    Title,
    Paragraph,
};
