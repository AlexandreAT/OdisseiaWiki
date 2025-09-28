import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const PerfilDropdown = styled.div<{ themeMode?: 'dark' | 'light' }>`
  position: absolute;
  top: 50px;
  left: -20px;
  background: var(--black-blue);
  border-radius: 10px;
  min-width: 180px;
  z-index: 100;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fadeIn 0.2s;
  border: 2px solid
    ${({ themeMode }) =>
      themeMode === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'};

  &::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 24px;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 14px solid
      ${({ themeMode }) =>
        themeMode === 'light'
          ? 'var(--clearneonViolet)'
          : 'var(--clearneonBlue)'};
    filter: drop-shadow(0 2px 4px var(--clearblack));
  }

  &::after {
    content: '';
    position: absolute;
    top: -12px;
    left: 25px;
    width: 0;
    height: 0;
    border-left: 11px solid transparent;
    border-right: 11px solid transparent;
    border-bottom: 12px solid var(--black-blue);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px);}
    to { opacity: 1; transform: translateY(0);}
  }
`;

export const PerfilOption = styled(Link)<{ themeMode?: 'dark' | 'light' }>`
  padding: 10px 20px;
  color: var(--whitesmoke);
  text-decoration: none;
  font-size: 1rem;
  transition: background 0.2s;
  &:hover {
    background: ${({ themeMode }) =>
      themeMode === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'};
    color: var(--black-blue);
  }
`;

export const PerfilButton = styled.button<{ themeMode?: 'dark' | 'light' }>`
  padding: 10px 20px;
  color: var(--whitesmoke);
  background: none;
  border: none;
  text-align: left;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ themeMode }) =>
      themeMode === 'light'
        ? 'var(--clearneonViolet)'
        : 'var(--clearneonBlue)'};
    color: var(--black-blue);
  }
`;