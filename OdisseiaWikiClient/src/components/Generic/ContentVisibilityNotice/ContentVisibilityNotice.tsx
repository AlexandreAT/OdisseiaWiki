import styled from 'styled-components';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const Notice = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 5px 9px;
  border: 1px solid rgba(255, 208, 79, 0.65);
  background: rgba(26, 21, 7, 0.92);
  color: #ffe58a;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;

  svg { width: 16px; height: 16px; }
`;

export const ContentVisibilityNotice = ({ visible }: { visible?: boolean }) => (
  visible === false ? (
    <Notice role="status" title="Este conteúdo não aparece para outros usuários.">
      <VisibilityOffOutlinedIcon aria-hidden="true" />
      Só você vê
    </Notice>
  ) : null
);
