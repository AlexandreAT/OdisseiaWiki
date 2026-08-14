import { useEffect, useState } from 'react';
import { MdOutlineBackpack } from 'react-icons/md';
import { ExplodedViewTab } from './CharacterExplodedView.types';
import { LauncherButton } from './CharacterExplodedView.style';

interface Props {
  tab: ExplodedViewTab;
  label: string;
  onOpen: (tab: ExplodedViewTab) => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const CharacterExplodedViewLauncher = ({ tab, label, onOpen, theme, neon }: Props) => {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => {
      onOpen(tab);
      setOpening(false);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [opening, onOpen, tab]);

  return (
    <LauncherButton
      type="button"
      onClick={() => setOpening(true)}
      disabled={opening}
      $opening={opening}
      $theme={theme}
      $neon={neon}
      title={`Abrir vista explodida de ${label}`}
      aria-label={`Abrir vista explodida de ${label}`}
    >
      <span className="backpack-flap" />
      <MdOutlineBackpack />
    </LauncherButton>
  );
};
