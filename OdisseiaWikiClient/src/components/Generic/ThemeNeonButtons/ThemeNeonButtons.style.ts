import styled from "styled-components";

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ContainerOptions = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background-color: transparent;

    @media (max-width: 480px) {
        gap: 5px;
    };
`

export const OptionButton = styled.button<Props>`
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