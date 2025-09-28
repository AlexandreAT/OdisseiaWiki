import styled from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    isLoginPage?: Boolean;
}

const Page = styled.div<Props>`
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

    ${props => props.theme === 'dark' ? `
        background-color: var(--black-blue);
    ` : `
        background-color: var(--black);
    `};

    transition: all 0.3s ease-in-out;
`;

const Body = styled.body<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${props => props.isLoginPage ? '0px' : '6% 0px 4rem'};
    width: 100%;
    min-height: 100vh;
    height: 100%;

    ${props => props.theme === 'dark' ? `
        background-color: var(--black);
    ` : `
        background-image: linear-gradient(to right top, #fdddaa, #fde1b3, #fde6bc, #feeac6, #feeecf, #f5f0d1, #edf2d5, #e6f3da, #d2f2e1, #c2f0ec, #bbebf8, #c1e4ff, #b6dbfd, #b1d6fb, #a7cdf9, #a1c8f9, #9bc4f8, #87b9f9);
    `};

    @media (max-width: 768px) {
        padding: 6% 0px 4rem;
    };

    transition: all 0.3s ease-in-out;
`;

const Footer = styled.footer<Props>`
    width: 100%;
    bottom: 0;
    z-index: 5;
    position: relative;
    
    ${props => props.theme === 'dark' ? `
        background-color: var(--black-blue);
    ` : `
        background-color: var(--black);
    `};

    transition: all 0.3s ease-in-out;
`;

export { Page, Header, Body, Footer };