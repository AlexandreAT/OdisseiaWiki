import { useState, type KeyboardEvent } from 'react';
import type { GameRunMap, GameRunMapNode, GameRunModeConfig } from '../../../models/GameRun';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { MapDrawing, MapWrap } from './RunMapCanvas.style';
import { getVisibleRunMap } from './visibleRunMap';

interface Props {
  map: GameRunMap;
  config: GameRunModeConfig;
  neon: boolean;
  active: boolean;
  acting: boolean;
  onSelect: (nodeId: string) => void;
}

const labels: Record<GameRunMapNode['state'], string> = {
  DISPONIVEL: 'Disponível',
  SELECIONADO: 'Selecionado',
  CONCLUIDO: 'Concluído',
  BLOQUEADO: 'Bloqueado',
  IGNORADO: 'Outra rota escolhida',
};

const nameOf = (node: GameRunMapNode): string =>
  node.name || (node.type === 'INICIO' ? 'Início'
    : node.id === 'treino-1' ? 'Sentinela de treino' : node.id);

const shortNameOf = (node: GameRunMapNode, config: GameRunModeConfig): string =>
  node.id === 'treino-1' ? 'Treino'
    : node.type !== 'CACADA' && node.payload?.encounterCode &&
      config.encounters?.[node.payload.encounterCode]?.mapName === node.name
      ? config.encounters[node.payload.encounterCode].enemy.name : nameOf(node);

export const RunMapCanvas = ({ map, config, neon, active, acting, onSelect }: Props) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { nodes, height, areas } = getVisibleRunMap(map, config);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const currentNode = nodes.filter((node) => node.state === 'CONCLUIDO' || node.state === 'SELECIONADO')
    .sort((left, right) => right.layer - left.layer)[0];
  const nextNodes = (active ? currentNode?.connections : undefined)?.map((id) => byId.get(id))
    .filter((node): node is GameRunMapNode => node?.state === 'DISPONIVEL') ?? [];
  const nextNodeIds = new Set(nextNodes.map((node) => node.id));
  const visualState = (node: GameRunMapNode): GameRunMapNode['state'] =>
    currentNode && node.id !== currentNode.id && node.layer <= currentNode.layer &&
      node.state !== 'CONCLUIDO' ? 'IGNORADO' : node.state;
  const linkedNodeIds = hoveredNodeId === currentNode?.id ? nextNodeIds
    : hoveredNodeId && nextNodeIds.has(hoveredNodeId) && currentNode
      ? new Set([currentNode.id]) : new Set<string>();
  const layers = new Map<number, GameRunMapNode[]>();
  nodes.forEach((node) => layers.set(node.layer, [...(layers.get(node.layer) ?? []), node]));
  layers.forEach((layerNodes) => layerNodes.sort((a, b) => a.position - b.position));
  const layoutOf = (node: GameRunMapNode) => {
    const siblings = layers.get(node.layer) ?? [node];
    const index = siblings.findIndex((entry) => entry.id === node.id);
    return {
      x: (index + .5) * 420 / siblings.length,
      y: 72 + node.layer * 130,
      width: Math.min(130, 420 / siblings.length - 16),
      siblings: siblings.length,
    };
  };
  const isPortrait = (node: GameRunMapNode) => map.schemaVersion >= 5
    ? !['INICIO', 'BASE', 'AREA_SECRETA'].includes(node.type)
    : ['COMBATE', 'ELITE', 'BOSS'].includes(node.type);
  const borderRoute = (node: GameRunMapNode, start: 'top' | 'bottom') => {
    const { x, y, width } = layoutOf(node);
    if (isPortrait(node)) {
      const radius = Math.min(28, width / 2 - 5);
      const centerY = y - 11;
      const anchorY = start === 'top' ? centerY - radius : centerY + radius;
      const oppositeY = start === 'top' ? centerY + radius : centerY - radius;
      return { x, anchorY,
        outline: `A ${radius} ${radius} 0 1 1 ${x} ${oppositeY} A ${radius} ${radius} 0 1 1 ${x} ${anchorY}` };
    }
    const left = x - width / 2;
    const right = x + width / 2;
    const top = y - 34;
    const bottom = y + 34;
    const radius = 8;
    return start === 'top'
      ? { x, anchorY: top, outline: `H ${right - radius} Q ${right} ${top} ${right} ${top + radius}` +
          ` V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom}` +
          ` H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius}` +
          ` V ${top + radius} Q ${left} ${top} ${left + radius} ${top} H ${x}` }
      : { x, anchorY: bottom, outline: `H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius}` +
          ` V ${top + radius} Q ${left} ${top} ${left + radius} ${top}` +
          ` H ${right - radius} Q ${right} ${top} ${right} ${top + radius}` +
          ` V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom} H ${x}` };
  };
  const connectionPath = (source: GameRunMapNode, target: GameRunMapNode) => {
    const from = layoutOf(source);
    const to = layoutOf(target);
    const startY = from.y + 35;
    const endY = to.y - 35;
    const controlY = (endY - startY) * .42;
    return `M ${from.x} ${startY} C ${from.x} ${startY + controlY}` +
      ` ${to.x} ${endY - controlY} ${to.x} ${endY}`;
  };
  const available = (node: GameRunMapNode) => active && visualState(node) === 'DISPONIVEL';
  const selectable = (node: GameRunMapNode) => available(node) && !acting;
  const selectOnKeyboard = (event: KeyboardEvent<SVGGElement>, node: GameRunMapNode) => {
    if (!selectable(node) || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect(node.id);
  };

  return <MapWrap>
    <MapDrawing $neon={neon} viewBox={`0 0 420 ${height}`} role="group" aria-label="Mapa vertical da jornada; cada conexão desce para a próxima etapa">
      {areas.map((area) => <g key={`area-${area.fase}`} pointerEvents="none">
        <text className="area-name" x="210" y={area.start + 31} textAnchor="middle">
          {area.name}
        </text>
      </g>)}
      {nodes.flatMap((source) => source.connections.map((targetId) => {
        const target = byId.get(targetId);
        if (!target || target.layer <= source.layer) return null;
        const sourceState = visualState(source);
        const targetState = visualState(target);
        const possible = source.id === currentNode?.id && nextNodeIds.has(target.id);
        const routeState = sourceState === 'IGNORADO' || targetState === 'IGNORADO' ? 'ignored'
          : possible ? 'possible'
            : sourceState === 'CONCLUIDO' && (targetState === 'CONCLUIDO' || targetState === 'SELECIONADO')
              ? 'completed' : 'blocked';
        const highlighted = (hoveredNodeId === source.id || hoveredNodeId === target.id) && possible;
        return <path key={`${source.id}-${target.id}`} className="map-edge"
          data-route-state={routeState} data-highlighted={highlighted}
          d={connectionPath(source, target)} />;
      }))}
      {nodes.map((node) => {
        const { x, y, width, siblings } = layoutOf(node);
        const label = shortNameOf(node, config);
        const maxLength = siblings >= 4 ? 10 : siblings === 3 ? 14 : 20;
        const portrait = isPortrait(node);
        const radius = Math.min(28, width / 2 - 5);
        return <g key={node.id} data-node-id={node.id} data-state={visualState(node)} data-type={node.type}
          data-current={node.id === currentNode?.id} data-available={available(node)}
          data-hovered={hoveredNodeId === node.id} data-linked={linkedNodeIds.has(node.id)}
          tabIndex={available(node) ? 0 : undefined}
          role={available(node) ? 'button' : undefined}
          aria-disabled={available(node) ? acting : undefined}
          aria-label={available(node) ? `Selecionar ${nameOf(node)}` : undefined}
          onClick={() => { if (selectable(node)) onSelect(node.id); }}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId((id) => id === node.id ? null : id)}
          onFocus={() => setHoveredNodeId(node.id)}
          onBlur={() => setHoveredNodeId((id) => id === node.id ? null : id)}
          onKeyDown={(event) => selectOnKeyboard(event, node)}>
          <title>{nameOf(node)} — {labels[visualState(node)]}</title>
          {portrait ? <>
            <defs><clipPath id={`portrait-${node.id}`}><circle cx={x} cy={y - 11} r={radius} /></clipPath></defs>
            <circle className="node-portrait" cx={x} cy={y - 11} r={radius} />
            {node.image && <image href={normalizeImagePath(node.image)} x={x - radius} y={y - 11 - radius}
              width={radius * 2} height={radius * 2} preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#portrait-${node.id})`} pointerEvents="none" />}
            <circle className="node-portrait-border" cx={x} cy={y - 11} r={radius} />
          </> : <>
            <rect x={x - width / 2} y={y - 34} width={width} height="68" rx="8" />
            {node.image && <image href={normalizeImagePath(node.image)}
              x={x - width / 2 + 2} y={y - 32} width={width - 4} height="64"
              preserveAspectRatio="xMidYMid slice" opacity="0.45" pointerEvents="none" />}
          </>}
          <text x={x} y={portrait ? y + 35 : y - 4} textAnchor="middle" fontSize={siblings >= 4 ? 11 : 13}>
            {label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label}
          </text>
        </g>;
      })}
      {neon && currentNode && <g className="route-effects" pointerEvents="none" aria-hidden="true">
        {nextNodes.map((node) => {
          const from = borderRoute(currentNode, 'bottom');
          const to = borderRoute(node, 'top');
          const connectionHeight = to.anchorY - from.anchorY;
          const route = `M ${from.x} ${from.anchorY} ${from.outline}` +
            ` C ${from.x} ${from.anchorY + connectionHeight * .42}` +
            ` ${to.x} ${to.anchorY - connectionHeight * .42} ${to.x} ${to.anchorY}` +
            ` ${to.outline}` +
            ` C ${to.x} ${to.anchorY - connectionHeight * .42}` +
            ` ${from.x} ${from.anchorY + connectionHeight * .42} ${from.x} ${from.anchorY}`;
          return <g key={`${currentNode.id}-${node.id}`} className="route-branch">
            <path className="route-light-blur" d={route} pathLength={100} />
            <path className="route-light" d={route} pathLength={100} />
          </g>;
        })}
      </g>}
    </MapDrawing>
  </MapWrap>;
};
