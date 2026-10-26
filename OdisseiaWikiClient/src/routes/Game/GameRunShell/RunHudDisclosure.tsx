import { useId, useState, type ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { HudDisclosure, HudDisclosureBody, HudDisclosureInner, HudDisclosureToolbar, HudDisclosureToggle } from './RunHudDisclosure.style';

/** Keeps the live resource components mounted; folding must not reset their animations or state. */
export function RunHudDisclosure({ name, image, neon, navigation, children }: {
  name: string; image?: string | null; neon: boolean; children: ReactNode;
  navigation?: (expanded: boolean) => ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const regionId = useId();
  const label = open ? 'Recolher dados do personagem' : 'Expandir dados do personagem';
  return <HudDisclosure>
    {navigation?.(open)}
    <HudDisclosureToolbar>
      {!open && <span title={name}>{image && <img src={image} alt="" />}<span>{name}</span></span>}
      <HudDisclosureToggle type="button" $neon={neon} aria-label={label} title={label}
        aria-controls={regionId} aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <ExpandMoreIcon aria-hidden="true" />
      </HudDisclosureToggle>
    </HudDisclosureToolbar>
    <HudDisclosureBody id={regionId} $open={open} aria-hidden={!open} {...(!open ? { inert: '' } : {})}>
      <HudDisclosureInner>{children}</HudDisclosureInner>
    </HudDisclosureBody>
  </HudDisclosure>;
}
