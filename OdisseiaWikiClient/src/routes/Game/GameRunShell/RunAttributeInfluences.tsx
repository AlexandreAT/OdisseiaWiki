import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import styled from 'styled-components';
import { FallbackImage } from '../../../components/Generic/FallbackImage/FallbackImage';
import type { GameAttributeInfluence } from '../../../models/GameRun';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { normalizeSystemItemCode } from '../../../utils/systemItemFormCatalog';
import { attributeAbbreviation, signedAttributeValue } from './runAttributePresentation';


const SourceList = styled.ul`
  display: grid; gap: 12px; padding: 0; margin: 0; list-style: none;
  li { display: grid; grid-template-columns: 32px minmax(0, 1fr); gap: 8px 10px;
    align-items: center; min-width: 0; padding-bottom: 12px; border-bottom: 1px solid color-mix(in srgb, var(--hologram-accent, var(--clearneonBlue)) 20%, transparent); }
  li:last-child { padding-bottom: 0; border-bottom: 0; }
  .influence-image { width: 32px; height: 32px; border: 1px solid color-mix(in srgb, var(--hologram-accent, var(--clearneonBlue)) 30%, transparent); border-radius: 3px; }
  .influence-source { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 6px 10px; min-width: 0; }
  .influence-name { min-width: 0; flex: 1 1 90px; font: 400 13px/1.35 'Lato', sans-serif; }
  .influence-name small { display: block; color: var(--lightGrey); font-size: 11px; opacity: .7; }
  .influence-effects { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: baseline; gap: 4px 9px;
    margin-left: auto; font: 400 10px/1.45 'Orbitron', sans-serif; font-variant-numeric: tabular-nums; }
  .influence-other { color: var(--lightGrey); opacity: .6; }
  strong { color: var(--hologram-accent, var(--clearneonBlue)); font-size: 12px; font-weight: 600; }
  strong[data-negative='true'] { color: var(--clearneonPink); }
`;
const icon = (type: string) => type === 'PROTESE' ? <MemoryOutlinedIcon />
  : type === 'ITEM' || type === 'ARMA' ? <Inventory2OutlinedIcon />
    : type === 'AJUSTE' ? <TuneOutlinedIcon /> : type === 'MAGIA' ? <AutoFixHighOutlinedIcon />
      : type === 'SKILL' ? <BoltOutlinedIcon /> : <AutoAwesomeOutlinedIcon />;

export function RunAttributeInfluences({ sources, code, group }: { sources: GameAttributeInfluence[]; code: string; group: string }) {
  const selected = (effect: GameAttributeInfluence['efeitos'][number]) => effect.grupo === group && normalizeSystemItemCode(effect.codigo) === normalizeSystemItemCode(code);
  return <SourceList aria-label="Origens dos modificadores">
    {sources.map(source => <li key={source.id}>
      <FallbackImage className="influence-image" src={normalizeImagePath(source.imagem ?? undefined)} alt=""
        aria-hidden="true" fallbackIcon={icon(source.tipo)} />
      <div className="influence-source"><span className="influence-name">{source.nome}
        {source.condicao && <small>{source.condicao}</small>}</span>
        <span className="influence-effects">{source.efeitos.filter(effect => effect.valor !== 0)
          .slice().sort((a, b) => Number(selected(b)) - Number(selected(a))).map((effect, index) => selected(effect)
            ? <strong key={index} data-negative={effect.valor < 0}>{signedAttributeValue(effect.valor)} {effect.nome}</strong>
            : <span key={index} className="influence-other" title={effect.nome}>{signedAttributeValue(effect.valor)} {attributeAbbreviation(effect.nome).toLowerCase()}</span>)}</span>
      </div>
    </li>)}
  </SourceList>;
}
