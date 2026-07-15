import styled from 'styled-components';

interface Props {
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
    hasFocus?: boolean;
    error?: boolean;
    hasImage?: boolean;
}

export const Form = styled.form<Props>`
    width: 90%;
    height: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
        width: 100%;
        height: auto;
        gap: 6px;
    }
`;

export const InputsController = styled.div<Props>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 25px;
    width: 100%;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }
`

export const ContainerInputs = styled.div<Props>`
    flex: 4;
    width: 0;
    display: flex;
    flex-direction: column;
    gap: 15px;

    @media (max-width: 768px) {
        flex: none;
        width: 100%;
        gap: 7px;
    }
`

export const ContainerAvatar = styled.div<Props>`
    flex: 2;
    width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    height: 100%;

    @media (max-width: 768px) {
        flex: none;
        width: 100%;
        height: auto;
        gap: 8px;

        > button {
            width: 72px;
            height: 72px;
        }

        > button svg {
            width: 72px;
            height: 72px;
        }
    }
`

export const SpanError = styled.span`
    width: 100%;
    font-size: 8px;
`

export const ContainerButtons = styled.div<Props>`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 30px;

    @media (max-width: 768px) {
        gap: 8px;
        flex-wrap: wrap;

        > div {
            width: min(100%, 165px) !important;
        }
    }
`
