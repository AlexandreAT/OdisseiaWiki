import styled from 'styled-components';

export const BindingSection = styled.section`
  display: grid;
  gap: 12px;
  width: 100%;
  margin-block: 12px 18px;
  padding: 14px;
  box-sizing: border-box;
  border: 1px solid rgba(150, 150, 150, 0.35);
  border-radius: 5px;
  background: rgba(0, 9, 20, 0.28);

  @media (max-width: 700px) {
    margin-block: 10px 16px;
  }
`;

export const BindingHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 0.9rem;
    font-weight: 100;
    letter-spacing: 1px;
  }

  span {
    color: var(--grey);
    font-size: 0.72rem;
  }
`;

export const BindingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;
