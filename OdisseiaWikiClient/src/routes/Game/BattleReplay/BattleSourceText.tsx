import { Fragment } from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import { GiCrossedSwords } from 'react-icons/gi';
import styled from 'styled-components';
import { FallbackImage } from '../../../components/Generic/FallbackImage/FallbackImage';
import { HolographicPreviewTrigger } from '../../../components/Generic/HolographicPreview';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { splitBattleSources, type BattleSource } from './battlePresentation';

const ImageSlot = styled(HolographicPreviewTrigger)`
  position: relative; display: inline-block; vertical-align: -.1em;
  width: 2em; height: 1em; margin: 0 .35em 0 .1em;
  min-width: 0; min-height: 0; border: 0; padding: 0; background: transparent; color: inherit;
  font: inherit; cursor: zoom-in; overflow: visible;
  &:focus-visible { outline: none; }
  &:focus-visible > span { outline: 2px solid var(--clearneonBlue); outline-offset: 2px; }
`;
const InlineImage = styled(FallbackImage)`
  position: absolute; top: 50%; left: 0; transform: translateY(-50%);
  width: 100%; height: 2em; min-width: 0; min-height: 0;
  border: 1px solid rgba(77, 238, 234, .3); border-radius: 3px;
  > svg { width: 90%; height: 90%; min-width: 0; min-height: 0; }
`;

const defaults = {
  ITEM: <Inventory2OutlinedIcon aria-hidden="true" />,
  ARMA: <GiCrossedSwords aria-hidden="true" />,
  ATAQUE: <GiCrossedSwords aria-hidden="true" />,
  MAGIA: <AutoFixHighOutlinedIcon aria-hidden="true" />,
  SKILL: <BoltOutlinedIcon aria-hidden="true" />,
  PROTESE: <MemoryOutlinedIcon aria-hidden="true" />,
  CONDICAO: <AutoAwesomeOutlinedIcon aria-hidden="true" />,
  DESCANSO: <HotelOutlinedIcon aria-hidden="true" />,
};

/** Literal text stays intact; React escapes names and the shared image handles broken URLs. */
export function BattleSourceText({ text, sources }: { text: string; sources?: BattleSource[] }) {
  return <>{splitBattleSources(text, sources).map((part, index) => <Fragment key={index}>
    {part.source && <ImageSlot media={{ name: part.source.name, src: normalizeImagePath(part.source.image ?? undefined), icon: defaults[part.source.kind] }}>
      <InlineImage src={normalizeImagePath(part.source.image ?? undefined)} alt="" aria-hidden="true"
        data-battle-source={part.source.kind} fallbackIcon={defaults[part.source.kind]} /></ImageSlot>}
    {part.text}
  </Fragment>)}</>;
}
