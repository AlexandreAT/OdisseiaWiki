import styled from 'styled-components';

interface ThemeProps {
  $isDark?: boolean;
}

export const FormPageContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

export const SectionHeader = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  margin-bottom: 12px;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

export const GridInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const FullWidthInput = styled.div`
margin-top: 12px;
  grid-column: 1 / -1;
`;

export const CoverImageContainer = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#f5f5f5')};
`;

export const CoverImagePreview = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
`;

export const BlocksContainer = styled.div<ThemeProps>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
  background-color: ${props => (props.$isDark ? '#0a0a0a' : '#fafafa')};
`;

export const BlockItem = styled.div<{ isDragging?: boolean; $isDark?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid ${props => (props.isDragging ? '#007bff' : props.$isDark ? '#333' : '#ddd')};
  background-color: ${props => (props.$isDark ? '#1a1a1a' : '#fff')};
  transition: all 0.3s ease;

  &:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  }
`;

export const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const BlockTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  span {
    font-size: 12px;
    opacity: 0.6;
  }
`;

export const BlockActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const IconButton = styled.button<{ danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background-color: ${props => (props.danger ? 'rgba(220, 53, 69, 0.1)' : '#e9ecef')};
  color: ${props => (props.danger ? '#dc3545' : '#495057')};
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => (props.danger ? 'rgba(220, 53, 69, 0.2)' : '#dee2e6')};
    color: ${props => (props.danger ? '#c82333' : '#212529')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const BlockContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const AddBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const BlockTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  width: 100%;
`;

export const BlockTypeButton = styled.button<{ active?: boolean }>`
  padding: 12px;
  border: 2px solid ${props => (props.active ? '#007bff' : '#ddd')};
  border-radius: 8px;
  background-color: ${props => (props.active ? 'rgba(0, 123, 255, 0.1)' : '#fff')};
  color: ${props => (props.active ? '#007bff' : '#495057')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #007bff;
    background-color: rgba(0, 123, 255, 0.1);
  }
`;

export const ActionButtonsContainer = styled.div<ThemeProps>`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${props => (props.$isDark ? '#333' : '#ddd')};
`;

export const EmptyBlocksMessage = styled.div`
  text-align: center;
  padding: 32px;
  opacity: 0.6;
  font-size: 14px;

  p {
    margin: 0;
  }
`;

export const ErrorMessage = styled.div`
  padding: 8px 12px;
  border-radius: 4px;
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  font-size: 12px;
  border: 1px solid rgba(220, 53, 69, 0.3);
`;
