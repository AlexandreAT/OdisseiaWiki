import styled from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    isLoginPage?: Boolean;
    isWikiPage?: boolean;
}

const Page = styled.div<Props>`
    --main-header-height: 85px;

    @media (max-width: 1100px) {
        --main-header-height: 67px;
    }

    @media (max-width: 768px) {
        --main-header-height: 54px;
    }

    .link {
        text-decoration: none;
    }

    button{
        cursor: pointer;
    }

    ${props => props.theme === 'dark' && `
        p, h1, h2, h3, h4, h5, span, .link, .icon {
            color: var(--whitesmoke);
            fill: var(--whitesmoke);
            transition: all 0.3s ease-in-out;
        }
    `}

    ${props => props.theme === 'light' && `
        p, h1, h2, h3, h4, h5, span, .link, .icon {
            color: var(--deepgray);
            fill: var(--deepgray);
            transition: all 0.3s ease-in-out;
        }
    `}

    transition: all 0.3s ease-in-out;
`;

const Header = styled.header<Props>`
    width: 100%;
    position: fixed;
    top: 0;
    border-bottom-right-radius: 10px;
    border-bottom-left-radius: 10px;
    z-index: 5;
    max-width: 100vw;
    box-sizing: border-box;

    background-color: ${({ theme }) =>
        theme === 'dark' ? 'rgba(0, 8, 18, 0.58)' : 'rgba(255, 255, 255, 0.58)'};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid ${({ theme }) =>
        theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};

    transition: all 0.3s ease-in-out;
`;

const Body = styled.body<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${props =>
        props.isLoginPage
            ? '0px'
            : props.isWikiPage
                ? '84px 0 0'
                : '84px 0 4rem'};
    width: 100%;
    min-height: 100vh;
    height: 100%;

    ${props => props.theme === 'dark' ? `
        background-color: var(--black-blue);
    ` : `
        background-image: linear-gradient(to right top, #fdddaa, #fde1b3, #fde6bc, #feeac6, #feeecf, #f5f0d1, #edf2d5, #e6f3da, #d2f2e1, #c2f0ec, #bbebf8, #c1e4ff, #b6dbfd, #b1d6fb, #a7cdf9, #a1c8f9, #9bc4f8, #87b9f9);
    `};

    @media (max-width: 768px) {
        padding: ${props => props.isLoginPage
            ? '0'
            : props.isWikiPage
                ? '54px 0 0'
                : '54px 0 4rem'};
    };

    @media (min-width: 769px) and (max-width: 1100px) {
        padding: ${props => props.isLoginPage
            ? '0'
            : props.isWikiPage
                ? '66px 0 0'
                : '66px 0 4rem'};
    };

    transition: all 0.3s ease-in-out;
`;

const Footer = styled.footer<Props>`
    width: 100%;
    bottom: 0;
    z-index: 15;
    position: relative;
    
    ${props => props.theme === 'dark' ? `
        background-color: var(--black-blue);
    ` : `
        background-color: var(--black);
    `};

    transition: all 0.3s ease-in-out;
`;

export { Page, Header, Body, Footer };
