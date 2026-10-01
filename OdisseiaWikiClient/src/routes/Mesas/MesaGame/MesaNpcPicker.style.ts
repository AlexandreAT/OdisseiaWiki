import styled from 'styled-components';

export const NpcPickerInput = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border: 1px solid rgba(57, 211, 255, .55);
  background: rgba(0, 9, 20, .9);
  color: var(--clearneonBlue);
  input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--whitesmoke); font: inherit; }
`;

export const NpcPickerList = styled.div`
  display: grid;
  gap: 8px;
  margin-top: 12px;
`;

export const NpcPickerItem = styled.article`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 9px;
  border: 1px solid rgba(57, 211, 255, .3);
  background: rgba(0, 12, 27, .72);
  img, > span { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; display: grid; place-items: center; color: var(--clearneonBlue); background: rgba(57, 211, 255, .1); }
  strong, small { display: block; overflow-wrap: anywhere; }
  strong { color: var(--whitesmoke); }
  small { color: var(--lightGrey); margin-top: 3px; }
  button { display: inline-flex; align-items: center; gap: 5px; padding: 8px 10px; border: 1px solid var(--clearneonBlue); background: rgba(0, 22, 38, .8); color: var(--clearneonBlue); cursor: pointer; }
  button:hover:not(:disabled) { border-color: var(--clearneonPink); color: var(--clearneonPink); }
  button:disabled { opacity: .5; cursor: wait; }
  @media (max-width: 500px) { grid-template-columns: 38px minmax(0, 1fr); img, > span { width: 38px; height: 38px; } button { grid-column: 1 / -1; justify-content: center; } }
`;

export const NpcPickerEmpty = styled.p`
  margin: 0;
  padding: 18px;
  color: var(--lightGrey);
  text-align: center;
`;
