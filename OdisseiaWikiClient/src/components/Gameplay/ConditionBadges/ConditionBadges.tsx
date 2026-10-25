import { useEffect, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import styled from 'styled-components';
import { normalizeImagePath } from '../../../routes/Wiki/utils/imagePathHelper';
import type { ActiveConditionDisplay } from './conditionBadgeState';

const ConditionsRow = styled.div`
  display: flex; align-items: center; justify-content: flex-start; flex-wrap: wrap; gap: 6px; min-width: 0;
  margin-top: 5px;
  button {
    display: inline-grid; place-items: center; position: relative; width: 28px; height: 28px;
    padding: 2px; flex: 0 0 28px; overflow: hidden; border-radius: 5px;
    border: 1px solid var(--grey); background: rgba(1, 14, 27, .9); color: var(--clearneonBlue);
    cursor: pointer; transition: border-color 150ms ease, box-shadow 150ms ease;
    &:hover, &:focus-visible { border-color: var(--clearneonBlue); box-shadow: 0 0 7px rgba(77,238,234,.3); }
    img { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 1; }
    svg { font-size: 19px; }
  }
`;

function ConditionBadge({ condition, count, neon }: { condition: ActiveConditionDisplay; count: number; neon: boolean }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const image = normalizeImagePath(condition.image ?? undefined);
  useEffect(() => setFailed(false), [image]);
  const label = `${condition.name}${count > 1 ? ` ×${count}` : ''}`;
  const border = `1px solid var(--${neon ? 'clearneonBlue' : 'grey'})`;
  return <ClickAwayListener onClickAway={() => setOpen(false)}>
    <span><Tooltip title={label} arrow open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
      disableTouchListener TransitionProps={{ timeout: 140 }} PopperProps={{ sx: { zIndex: 110000 } }}
      componentsProps={{ tooltip: { sx: { background: 'rgba(1,10,24,.98)', color: 'var(--clearneonBlue)',
        border, borderRadius: '6px',
        fontFamily: 'Lato, sans-serif', fontSize: '12px', boxShadow: neon ? '0 0 12px rgba(77,238,234,.2)' : 'none' } },
        arrow: { sx: { color: 'rgba(1,10,24,.98)',
          '&::before': { border, boxSizing: 'border-box' } } } }}>
      <button type="button" aria-label={label} aria-expanded={open}
        onClick={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } }}>
        {image && !failed ? <img src={image} alt="" onError={() => setFailed(true)} /> : <AutoAwesomeOutlinedIcon aria-hidden="true" />}
      </button>
    </Tooltip></span>
  </ClickAwayListener>;
}

export function ConditionBadges({ conditions, neon = false }: { conditions: ActiveConditionDisplay[]; neon?: boolean }) {
  if (!conditions.length) return null;
  const grouped = new Map<string, { condition: ActiveConditionDisplay; count: number }>();
  for (const condition of conditions) {
    const key = condition.code.toUpperCase();
    const previous = grouped.get(key);
    grouped.set(key, { condition, count: (previous?.count ?? 0) + 1 });
  }
  return <ConditionsRow aria-label="Condições ativas">{[...grouped.entries()].map(([key, value]) =>
    <ConditionBadge key={key} {...value} neon={neon} />)}</ConditionsRow>;
}
