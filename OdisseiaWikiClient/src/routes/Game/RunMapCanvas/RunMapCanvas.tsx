import { useId, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { GameRunMap, GameRunMapNode, GameRunModeConfig } from '../../../models/GameRun';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { MapDrawing, MapWrap } from './RunMapCanvas.style';
import { getVisibleRunMap } from './visibleRunMap';
import { mapConnectionRoute, mapLaserBranch, mapRoundedBorderLength } from './runMapGeometry';

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
  const routeMaskId = useId();
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
      return { x, anchorY, length: 2 * Math.PI * radius,
        outline: `A ${radius} ${radius} 0 1 1 ${x} ${oppositeY} A ${radius} ${radius} 0 1 1 ${x} ${anchorY}` };
    }
    const left = x - width / 2;
    const right = x + width / 2;
    const top = y - 34;
    const bottom = y + 34;
    const radius = 8;
    const length = mapRoundedBorderLength(width, 68, radius);
    return start === 'top'
      ? { x, anchorY: top, length, outline: `H ${right - radius} Q ${right} ${top} ${right} ${top + radius}` +
          ` V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom}` +
          ` H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius}` +
          ` V ${top + radius} Q ${left} ${top} ${left + radius} ${top} H ${x}` }
      : { x, anchorY: bottom, length, outline: `H ${left + radius} Q ${left} ${bottom} ${left} ${bottom - radius}` +
          ` V ${top + radius} Q ${left} ${top} ${left + radius} ${top}` +
          ` H ${right - radius} Q ${right} ${top} ${right} ${top + radius}` +
          ` V ${bottom - radius} Q ${right} ${bottom} ${right - radius} ${bottom} H ${x}` };
  };
  const connectionRoute = (source: GameRunMapNode, target: GameRunMapNode) =>
    mapConnectionRoute(layoutOf(source), layoutOf(target));
  const available = (node: GameRunMapNode) => active && visualState(node) === 'DISPONIVEL';
  const selectable = (node: GameRunMapNode) => available(node) && !acting;
  const needsRescue = (node: GameRunMapNode) => node.type === 'NPC' && node.payload?.npcLocked === true && !node.payload.npcRescued;
  const selectOnKeyboard = (event: KeyboardEvent<SVGGElement>, node: GameRunMapNode) => {
    if (event.key === 'Escape') { setHoveredNodeId(null); return; }
    if (needsRescue(node) && !selectable(node) && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); setHoveredNodeId(node.id); return;
    }
    if (!selectable(node) || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect(node.id);
  };

  const rescueHint = nodes.find(node => node.id === hoveredNodeId && needsRescue(node));
  return <MapWrap onPointerDownCapture={event => {
    if (!(event.target as Element).closest?.('[data-node-id]')) setHoveredNodeId(null);
  }}>
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
          d={connectionRoute(source, target).forward} />;
      }))}
      {nodes.map((node) => {
        const { x, y, width, siblings } = layoutOf(node);
        const label = shortNameOf(node, config);
        const maxLength = siblings >= 4 ? 10 : siblings === 3 ? 14 : 20;
        const portrait = isPortrait(node);
        const radius = Math.min(28, width / 2 - 5);
        const imageClipId = `${routeMaskId}-image-${node.id}`;
        return <g key={node.id} data-node-id={node.id} data-state={visualState(node)} data-type={node.type}
          data-current={node.id === currentNode?.id} data-available={available(node)}
          data-hovered={hoveredNodeId === node.id} data-linked={linkedNodeIds.has(node.id)}
          tabIndex={available(node) || needsRescue(node) ? 0 : undefined}
          role={available(node) || needsRescue(node) ? 'button' : undefined}
          aria-disabled={available(node) ? acting : undefined}
          aria-label={available(node) ? `Selecionar ${nameOf(node)}` : needsRescue(node) ? `Sobre o resgate de ${nameOf(node)}` : undefined}
          aria-describedby={rescueHint?.id === node.id ? 'npc-rescue-hint' : undefined}
          onClick={() => { if (needsRescue(node)) setHoveredNodeId(node.id); if (selectable(node)) onSelect(node.id); }}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId((id) => id === node.id ? null : id)}
          onFocus={() => setHoveredNodeId(node.id)}
          onBlur={() => setHoveredNodeId((id) => id === node.id ? null : id)}
          onKeyDown={(event) => selectOnKeyboard(event, node)}>
          <title>{`${nameOf(node)} — ${labels[visualState(node)]}${node.type === 'NPC' && node.payload?.npcLocked && !node.payload.npcRescued ? ' · Visite para libertar' : ''}`}</title>
          {portrait ? <>
            <defs><clipPath id={imageClipId}><circle cx={x} cy={y - 11} r={radius} /></clipPath></defs>
            <circle className="node-portrait" cx={x} cy={y - 11} r={radius} />
            {node.image && <image href={normalizeImagePath(node.image)} x={x - radius} y={y - 11 - radius}
              width={radius * 2} height={radius * 2} preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${imageClipId})`} pointerEvents="none" />}
            <circle className="node-portrait-border" cx={x} cy={y - 11} r={radius} />
            {node.type === 'NPC' && node.payload?.npcLocked && !node.payload.npcRescued &&
              <g className="npc-lock" transform={`translate(${x + radius - 8}, ${y + 5})`} pointerEvents="none" aria-hidden="true">
                <path className="npc-lock-frame" d="M -7 -11 H 7 L 11 -7 V 7 L 7 11 H -7 L -11 7 V -7 Z" />
                <path className="npc-lock-trace" d="M -5 -9 H 6 L 9 -6 M -9 5 V 6 L -6 9 H -2" />
                <path className="npc-lock-icon" d="M -3 -1 V -4 A 3 3 0 0 1 3 -4 V -1 M -4 -1 H 4 Q 5 -1 5 0 V 6 Q 5 7 4 7 H -4 Q -5 7 -5 6 V 0 Q -5 -1 -4 -1 M 0 2 V 4" />
              </g>}
          </> : <>
            <rect x={x - width / 2} y={y - 34} width={width} height="68" rx="8" />
            {node.image && <>
              <defs><clipPath id={imageClipId}>
                <rect x={x - width / 2 + 2} y={y - 32} width={width - 4} height="64" rx="6" />
              </clipPath></defs>
              <image href={normalizeImagePath(node.image)}
                x={x - width / 2 + 2} y={y - 32} width={width - 4} height="64"
                clipPath={`url(#${imageClipId})`} preserveAspectRatio="xMidYMid slice" opacity="0.45" pointerEvents="none" />
            </>}
          </>}
          <text x={x} y={portrait ? y + 35 : y - 4} textAnchor="middle" fontSize={siblings >= 4 ? 11 : 13}>
            {label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label}
          </text>
        </g>;
      })}
      {neon && currentNode && nextNodes.length > 0 && (() => {
        const from = borderRoute(currentNode, 'bottom');
        const branches = nextNodes.map(node => ({ id: node.id, border: borderRoute(node, 'top'), connection: connectionRoute(currentNode, node) }));
        // A mask hides the label gaps without splitting/restarting the animated path.
        const tracks = `M ${from.x} ${from.anchorY} ${from.outline}` + branches.map(({ border, connection }) =>
          ` ${connection.forward} M ${border.x} ${border.anchorY} ${border.outline}`).join('');
        return <g className="route-effects" pointerEvents="none" aria-hidden="true">
          <defs><mask id={routeMaskId} maskUnits="userSpaceOnUse" x="-20" y="-20" width="460" height={height + 40}>
            <path d={tracks} fill="none" stroke="white" strokeWidth="14" />
          </mask></defs>
          <g>
            {branches.map(branch => {
              const light = mapLaserBranch(from, branch);
              return <g key={branch.id} className="route-branch" style={{
                '--route-dash': `${light.dash} ${100 - light.dash}`,
                '--route-source-end': light.sourceEnd,
                '--route-target-start': light.targetStart,
                '--route-target-end': light.targetEnd,
              } as CSSProperties}>
                <g className="route-light-halo">
                  <path className="route-light-blur" mask={`url(#${routeMaskId})`} d={light.route} pathLength={100} />
                </g>
                <path className="route-light" mask={`url(#${routeMaskId})`} d={light.route} pathLength={100} />
              </g>;
            })}
          </g>
        </g>;
      })()}
      {rescueHint && (() => {
        const { x, y } = layoutOf(rescueHint);
        const left = Math.max(8, Math.min(420 - 276, x - 134));
        return <g id="npc-rescue-hint" role="tooltip" className="npc-rescue-hint" pointerEvents="none" transform={`translate(${left}, ${y + 45})`}>
          <rect width="268" height="43" rx="6" />
          <text x="10" y="17">Visite para libertar este NPC.</text>
          <text x="10" y="32">Serviço nas próximas visitas e runs.</text>
        </g>;
      })()}
    </MapDrawing>
  </MapWrap>;
};
