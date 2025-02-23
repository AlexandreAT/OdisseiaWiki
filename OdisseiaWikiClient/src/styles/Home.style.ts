import styled from 'styled-components';

const Main = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    gap: 4rem;

    @media (max-width: 768px) {
        width: 93%;
    };
`;

export { Main };