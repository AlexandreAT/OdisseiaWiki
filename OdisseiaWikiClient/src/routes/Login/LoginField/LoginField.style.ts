import styled from 'styled-components';

export const Form = styled.form`
    width: 70%;
    height: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 1100px) {
        width: 82%;
    }

    @media (max-width: 768px) {
        width: 100%;
        height: auto;
        gap: 10px;
    }
`;

export const InputContainer = styled.div`
    width: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;

    @media (max-width: 1100px) {
        width: 82%;
    }

    @media (max-width: 768px) {
        width: 100%;
    }
`

export const ButtonContainer = styled.div`
    width: 70%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 12px;

    @media (max-width: 1100px) {
        width: 82%;
    }

    @media (max-width: 768px) {
        width: 100%;
        flex-wrap: wrap;
        justify-content: center;

        > div {
            width: min(100%, 175px) !important;
        }
    }
`;

export const GoogleLoginContainer = styled.div`
    width: 70%;
    margin: 10px 0;

    > div {
        max-width: 100%;
    }

    @media (max-width: 768px) {
        width: 100%;
        display: flex;
        justify-content: center;
        margin: 4px 0;
    }
`;

export const CheckboxContainer = styled.div`
    display: flex;
    align-items: flex-start;
    width: 70%;

    @media (max-width: 768px) {
        width: 100%;
    }
`;

export const LinkContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 70%;
    z-index: 1;
    min-width: 0;
    text-align: center;

    @media (max-width: 768px) {
        width: 100%;
        overflow-wrap: anywhere;
    }
`;
