import styled from 'styled-components';

const Main = styled.div<{ $backgroundImage: string }>`
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: 100%;

    &::before,
    &::after {
        content: '';
        position: fixed;
        inset: 0;
        pointer-events: none;
    }

    &::before {
        z-index: -2;
        background-image: url("${({ $backgroundImage }) => $backgroundImage}");
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(12px);
        transform: scale(1.08);
    }

    &::after {
        z-index: -1;
        background-color: rgba(0, 0, 0, 0.62);
    }

`;

const HomeContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    gap: 4rem;
    margin-top: 4rem;

    @media (max-width: 768px) {
        width: 93%;
    };
`;

export { Main, HomeContent };
