import styled, { css } from 'styled-components';

interface Props {
    theme: 'dark' | 'light';
    neon?: 'on' | 'off';
    textSize?: string;
    colorScheme: {
        primary: string;
        primaryClear: string;
        primaryDeep: string;
        secondary: string;
        secondaryClear: string;
        secondaryDeep: string;
    };
}

export const CardLinkWrapper = styled.div<Props>`
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: ${({ textSize }) => textSize ? textSize : `15px`};

    .link{
        color: var(${props => props.colorScheme.primaryClear}) !important;
    }

    color: var(${props => props.colorScheme.primaryClear}) !important;
    position: relative;
    padding-bottom: 1px;
    &::after {
        content: " ";
        width: 0%;
        height: 2px;
        bottom: 0;
        left: 0;
        border-radius: 10px;
        position: absolute;
        background-color: var(${props => props.colorScheme.primaryClear});
        ${({ neon, colorScheme }) => neon === 'on' && `box-shadow: 0 0 5px var(${colorScheme.primaryClear});`}
        transition: all 350ms ease;
    }
    &:hover::after {
        width: 100%;
        transition: all 350ms ease;
    }
  

    ${props => props.theme === 'light' && props.colorScheme.primary === '--neonViolet' && css`
        color: var(${props.colorScheme.primaryClear}) !important;
        text-shadow: 0px 0px 5px var(--black);
    `}

    @media (max-width: 768px) {
        font-size: 15px;
    }

    @media (max-width: 480px) {
        font-weight: bold;
        font-size: 12px;
    }
    transition: all 0.3s ease-in-out;
`;