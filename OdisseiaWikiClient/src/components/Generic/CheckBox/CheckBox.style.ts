import styled from 'styled-components';

interface Props {
  typeStyle?: 'primary' | 'secondary';
  fontSize?: string;
  width?: string;
  height?: string;
  neon?: 'on' | 'off'
}

const getNeon = (typeStyle?: 'primary' | 'secondary') => typeStyle === 'secondary' ? 'var(--neonPink)' : 'var(--neonBlue)';
const getClearNeon = (typeStyle?: 'primary' | 'secondary') => typeStyle === 'secondary' ? 'var(--clearneonPink)' : 'var(--clearneonBlue)';

export const ContainerController = styled.div<Props>`
    display: flex;
    align-items: center;
    width: ${({ width }) => width || '100%'};
    height: ${({ height }) => height || '20px'}
`

export const CheckboxLabel = styled.label<Props>`
    width: 100%;
    font-size: ${({ fontSize }) => fontSize || '0.9em'};
    font-weight: 500;
    display: flex;
    align-items: center;
    color: ${({ typeStyle }) => getNeon(typeStyle)};
    ${({ neon, typeStyle }) => neon === 'on'
        && `text-shadow: 0.5px 0.5px 1px ${getClearNeon(typeStyle)};`}
    cursor: pointer;
`;

export const InputCheckbox = styled.input.attrs({ type: 'checkbox' })<Props>`
    appearance: none;
    width: 20px;
    height: 20px;
    background-color: var(--mediumgrey);
    margin-right: 8px;
    border-radius: 4px;
    position: relative;
    outline: none;
    transition: background 0.2s, box-shadow 0.2s;

    &:checked {
        background-color: var(--deepgrey);
        box-shadow: inset 0px 0px 5px ${({ typeStyle }) => getNeon(typeStyle)};
    }

    &:checked::after {
        content: "";
        display: block;
        width: 5px;
        height: 10px;
        border: 3px solid ${({ typeStyle }) => getNeon(typeStyle)};
        border-width: 0 3px 3px 0;
        transform: rotate(45deg);
        margin: 2px 6px;
        position: absolute;
        left: 0;
        top: 0;
    }
`;