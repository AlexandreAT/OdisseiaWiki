import styled from 'styled-components';
import { HudFrame } from '../../../components/Generic/HudFrame/HudFrame';

export const StoryBody = styled.div`
  display: grid; gap: 18px; min-width: 0;
  > p { margin: 0; color: var(--lightGrey); line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; }
`;
export const StoryChoiceCard = styled(HudFrame)`
  padding: 20px; min-width: 0; display: grid; gap: 12px;
  h3 { margin: 0; color: var(--clearneonBlue); font: 500 1rem 'Orbitron', sans-serif; line-height: 1.5; overflow-wrap: anywhere; }
  p { margin: 0; color: var(--lightGrey); line-height: 1.6; white-space: pre-line; }
  small { color: var(--clearneonYellow); line-height: 1.5; }
  ul { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 0; }
  li { padding: 5px 9px; font-size: .8rem; border: 1px solid color-mix(in srgb, var(--clearneonBlue) 25%, transparent);
    background: color-mix(in srgb, var(--neonBlue) 7%, transparent); color: var(--lightGrey); overflow-wrap: anywhere; }
  @media (max-width: 520px) { padding: 16px 12px; }
`;
export const StoryJournal = styled.details`
  margin-top: 18px; min-width: 0; border-top: 1px solid color-mix(in srgb, var(--clearneonPurple) 30%, transparent); padding-top: 14px;
  summary { cursor: pointer; color: var(--clearneonPurple); font: 500 .85rem 'Orbitron', sans-serif; line-height: 1.6; }
  summary:focus-visible { outline: 2px solid var(--clearneonPurple); outline-offset: 4px; }
  ol { display: grid; gap: 14px; padding: 0; list-style: none; margin: 16px 0 0; }
  li { padding: 12px 16px; border-left: 2px solid var(--clearneonPurple);
    background: color-mix(in srgb, var(--neonPurple) 7%, transparent); min-width: 0; }
  strong { display: block; color: var(--clearneonPurple); overflow-wrap: anywhere; line-height: 1.6; }
  p { margin: 5px 0; color: var(--lightGrey); white-space: pre-line; line-height: 1.5; }
  small { color: var(--lightGrey); line-height: 1.5; overflow-wrap: anywhere; }
`;
