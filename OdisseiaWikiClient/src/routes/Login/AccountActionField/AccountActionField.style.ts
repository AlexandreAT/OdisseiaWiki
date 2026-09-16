import styled from 'styled-components';

export const Form = styled.form`
  width: 70%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    width: 82%;
  }

  @media (max-width: 768px) {
    width: 100%;
    min-height: 0;
    padding: 12px 0;
    gap: 12px;
  }
`;

export const Message = styled.p<{ $success?: boolean }>`
  width: 100%;
  margin: 0;
  text-align: center;
  line-height: 1.5;
  color: ${({ $success }) => $success ? 'var(--clearneonBlue)' : 'var(--whitesmoke)'};
`;

export const InputContainer = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const ButtonContainer = styled.div`
  width: 70%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;

    > div {
      width: min(100%, 185px) !important;
    }
  }
`;
