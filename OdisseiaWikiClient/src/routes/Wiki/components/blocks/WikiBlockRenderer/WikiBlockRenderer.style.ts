import styled from 'styled-components';

export const BlockRendererContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
`;

export const UnknownBlockMessage = styled.div`
  padding: 16px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
  border-radius: 4px;
  color: #dc3545;
  font-size: 13px;

  p {
    margin: 0;
  }
`;
