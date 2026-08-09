import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import cytoscape, {
  Core,
  ElementDefinition,
  LayoutOptions,
  NodeSingular,
  StylesheetJson,
} from 'cytoscape';
import { Link } from 'react-router-dom';
import {
  isWikiGraphIdentifiedNode,
  WikiGraphEntityType,
  WikiGraphLayoutMode,
  WikiGraphResponse,
} from '../../../../models/WikiGraph';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import { LoadingIndicator } from '../../../../components/Generic/LoadingIndicator/LoadingIndicator';
import { GraphMinimap } from '../GraphMinimap/GraphMinimap';
import {
  AccessibleNodeNavigation,
  CanvasHost,
  CanvasShell,
  ProcessingOverlay,
} from './GraphCanvas.style';

export interface GraphCanvasHandle {
  centralize: () => void;
  focusNode: (graphId: string) => void;
}

interface GraphCanvasProps {
  graph: WikiGraphResponse;
  activeTypes: ReadonlySet<WikiGraphEntityType>;
  neon: boolean;
  layoutMode: WikiGraphLayoutMode;
  onNavigate: (route: string) => void;
}

const typeLabels: Record<WikiGraphEntityType, string> = {
  city: 'Cidade',
  page: 'Página',
  character: 'Personagem',
  race: 'Raça',
};

const edgeEntityHoverClasses = [
  'hover-city',
  'hover-page',
  'hover-character',
  'hover-race',
];

const hashGraphId = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createFreePositions = (graph: WikiGraphResponse) => {
  const adjacency = new Map(graph.nodes.map((node) => [node.graphId, new Set<string>()]));
  graph.edges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const positions = new Map<string, { x: number; y: number }>();
  const centralId = graph.centralNodeId;
  if (centralId && (adjacency.get(centralId)?.size ?? 0) === 0) {
    positions.set(centralId, { x: 0, y: 0 });
  }
  const disconnected = graph.nodes
    .filter((node) => (
      node.graphId !== centralId && (adjacency.get(node.graphId)?.size ?? 0) === 0
    ))
    .sort((left, right) => hashGraphId(left.graphId) - hashGraphId(right.graphId));

  const connectedIds = graph.nodes
    .filter((node) => (adjacency.get(node.graphId)?.size ?? 0) > 0)
    .map((node) => node.graphId);
  const pending = new Set(connectedIds);
  const components: string[][] = [];

  while (pending.size > 0) {
    const first = pending.values().next().value as string;
    const component: string[] = [];
    const queue = [first];
    pending.delete(first);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      component.push(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (!pending.has(neighbor)) return;
        pending.delete(neighbor);
        queue.push(neighbor);
      });
    }

    components.push(component);
  }

  components.sort((left, right) => {
    const leftIsCentral = centralId ? left.includes(centralId) : false;
    const rightIsCentral = centralId ? right.includes(centralId) : false;
    if (leftIsCentral !== rightIsCentral) return leftIsCentral ? -1 : 1;
    if (left.length !== right.length) return right.length - left.length;
    return hashGraphId(left[0]) - hashGraphId(right[0]);
  });

  const placedComponents: Array<{ x: number; y: number; radius: number }> = [];

  components.forEach((component, componentIndex) => {
    const componentSet = new Set(component);
    const root = centralId && componentSet.has(centralId)
      ? centralId
      : [...component].sort((left, right) => {
        const degreeDifference = (adjacency.get(right)?.size ?? 0)
          - (adjacency.get(left)?.size ?? 0);
        return degreeDifference || hashGraphId(left) - hashGraphId(right);
      })[0];

    const depth = new Map<string, number>([[root, 0]]);
    const parent = new Map<string, string>();
    const queue = [root];
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      const neighbors = [...(adjacency.get(current) ?? [])]
        .filter((neighbor) => componentSet.has(neighbor))
        .sort((left, right) => hashGraphId(left) - hashGraphId(right));
      neighbors.forEach((neighbor) => {
        if (depth.has(neighbor)) return;
        depth.set(neighbor, (depth.get(current) ?? 0) + 1);
        parent.set(neighbor, current);
        queue.push(neighbor);
      });
    }

    const layers = new Map<number, string[]>();
    component.forEach((id) => {
      const nodeDepth = depth.get(id) ?? 0;
      const layer = layers.get(nodeDepth) ?? [];
      layer.push(id);
      layers.set(nodeDepth, layer);
    });

    const localPositions = new Map<string, { x: number; y: number }>();
    localPositions.set(root, { x: 0, y: 0 });
    let componentRadius = 110;
    [...layers.entries()]
      .filter(([nodeDepth]) => nodeDepth > 0)
      .sort(([left], [right]) => left - right)
      .forEach(([nodeDepth, ids]) => {
        ids.sort((left, right) => {
          const leftParent = parent.get(left) ?? '';
          const rightParent = parent.get(right) ?? '';
          const parentDifference = hashGraphId(leftParent) - hashGraphId(rightParent);
          return parentDifference || hashGraphId(left) - hashGraphId(right);
        });

        const layerRadius = Math.max(nodeDepth * 215, ids.length * 28);
        componentRadius = Math.max(componentRadius, layerRadius + 95);
        const phase = ((hashGraphId(root) % 360) * Math.PI) / 180 + nodeDepth * 0.23;
        ids.forEach((id, index) => {
          const jitter = ((hashGraphId(id) % 17) - 8) * 0.009;
          const angle = phase + (Math.PI * 2 * index) / ids.length + jitter;
          const radialJitter = ((hashGraphId(id) % 31) - 15) * 1.8;
          localPositions.set(id, {
            x: Math.cos(angle) * (layerRadius + radialJitter),
            y: Math.sin(angle) * (layerRadius + radialJitter),
          });
        });
      });

    let center = { x: 0, y: 0 };
    if (componentIndex > 0) {
      const goldenAngle = 2.399963229728653;
      for (let attempt = 1; attempt <= 240; attempt += 1) {
        const angle = attempt * goldenAngle + componentIndex * 0.37;
        const radius = 460 + Math.sqrt(attempt) * 245;
        const candidate = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        };
        const hasCollision = placedComponents.some((placed) => (
          Math.hypot(candidate.x - placed.x, candidate.y - placed.y)
            < componentRadius + placed.radius + 145
        ));
        if (!hasCollision) {
          center = candidate;
          break;
        }
      }
    }

    localPositions.forEach((position, id) => {
      positions.set(id, {
        x: position.x + center.x,
        y: position.y + center.y,
      });
    });
    placedComponents.push({ ...center, radius: componentRadius });
  });

  const occupiedRadius = placedComponents.reduce(
    (largest, component) => Math.max(largest, Math.hypot(component.x, component.y) + component.radius),
    620,
  );
  const outerRadius = occupiedRadius + 260;
  disconnected.forEach((node, index) => {
    const entriesPerRing = Math.max(12, Math.floor((Math.PI * 2 * outerRadius) / 205));
    const ring = Math.floor(index / entriesPerRing);
    const positionInRing = index % entriesPerRing;
    const entriesInRing = Math.min(entriesPerRing, disconnected.length - ring * entriesPerRing);
    const angle = ((Math.PI * 2) / Math.max(entriesInRing, 1)) * positionInRing
      + ring * 0.19
      + ((hashGraphId(node.graphId) % 13) - 6) * 0.006;
    const radius = outerRadius + ring * 215 + ((hashGraphId(node.graphId) % 23) - 11) * 2;
    positions.set(node.graphId, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  });

  return positions;
};

type GraphPosition = { x: number; y: number };

interface GraphComponent {
  ids: string[];
  edges: WikiGraphResponse['edges'];
}

const buildGraphTopology = (graph: WikiGraphResponse) => {
  const adjacency = new Map(graph.nodes.map((node) => [node.graphId, new Set<string>()]));

  graph.edges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const visited = new Set<string>();
  const components: GraphComponent[] = [];

  graph.nodes.forEach((node) => {
    if (visited.has(node.graphId)) return;

    const ids: string[] = [];
    const queue = [node.graphId];
    visited.add(node.graphId);

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const current = queue[cursor];
      ids.push(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (visited.has(neighbor)) return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }

    const idSet = new Set(ids);
    components.push({
      ids,
      edges: graph.edges.filter((edge) => idSet.has(edge.source) && idSet.has(edge.target)),
    });
  });

  return { adjacency, components };
};

const intersectsStrictly = (
  firstStart: GraphPosition,
  firstEnd: GraphPosition,
  secondStart: GraphPosition,
  secondEnd: GraphPosition,
) => {
  const orientation = (a: GraphPosition, b: GraphPosition, c: GraphPosition) => (
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  );
  const firstA = orientation(firstStart, firstEnd, secondStart);
  const firstB = orientation(firstStart, firstEnd, secondEnd);
  const secondA = orientation(secondStart, secondEnd, firstStart);
  const secondB = orientation(secondStart, secondEnd, firstEnd);
  const epsilon = 0.001;

  return firstA * firstB < -epsilon && secondA * secondB < -epsilon;
};

const countEdgeCrossings = (
  positions: ReadonlyMap<string, GraphPosition>,
  edges: WikiGraphResponse['edges'],
) => {
  let crossings = 0;

  for (let firstIndex = 0; firstIndex < edges.length; firstIndex += 1) {
    const first = edges[firstIndex];
    const firstStart = positions.get(first.source);
    const firstEnd = positions.get(first.target);
    if (!firstStart || !firstEnd) continue;

    for (let secondIndex = firstIndex + 1; secondIndex < edges.length; secondIndex += 1) {
      const second = edges[secondIndex];
      if (
        first.source === second.source
        || first.source === second.target
        || first.target === second.source
        || first.target === second.target
      ) continue;

      const secondStart = positions.get(second.source);
      const secondEnd = positions.get(second.target);
      if (
        secondStart
        && secondEnd
        && intersectsStrictly(firstStart, firstEnd, secondStart, secondEnd)
      ) crossings += 1;
    }
  }

  return crossings;
};

const createRadialComponentPositions = (
  component: GraphComponent,
  adjacency: ReadonlyMap<string, Set<string>>,
  preferredRoot?: string,
) => {
  const componentIds = new Set(component.ids);
  const degree = (id: string) => (
    [...(adjacency.get(id) ?? [])].filter((neighbor) => componentIds.has(neighbor)).length
  );
  const root = preferredRoot && componentIds.has(preferredRoot)
    ? preferredRoot
    : [...component.ids].sort((left, right) => (
      degree(right) - degree(left) || hashGraphId(left) - hashGraphId(right)
    ))[0];

  const depth = new Map<string, number>([[root, 0]]);
  const parent = new Map<string, string>();
  const children = new Map(component.ids.map((id) => [id, [] as string[]]));
  const queue = [root];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const neighbors = [...(adjacency.get(current) ?? [])]
      .filter((neighbor) => componentIds.has(neighbor))
      .sort((left, right) => (
        degree(right) - degree(left) || hashGraphId(left) - hashGraphId(right)
      ));

    neighbors.forEach((neighbor) => {
      if (depth.has(neighbor)) return;
      depth.set(neighbor, (depth.get(current) ?? 0) + 1);
      parent.set(neighbor, current);
      children.get(current)?.push(neighbor);
      queue.push(neighbor);
    });
  }

  const subtreeWeight = new Map<string, number>();
  const calculateWeight = (id: string): number => {
    const descendants = children.get(id) ?? [];
    const weight = descendants.length === 0
      ? 1
      : descendants.reduce((total, child) => total + calculateWeight(child), 0);
    subtreeWeight.set(id, weight);
    return weight;
  };
  calculateWeight(root);

  const rawAngles = new Map<string, number>([[root, -Math.PI / 2]]);
  const assignAngles = (id: string, start: number, end: number) => {
    const descendants = children.get(id) ?? [];
    const totalWeight = descendants.reduce(
      (total, child) => total + (subtreeWeight.get(child) ?? 1),
      0,
    );
    let cursor = start;

    descendants.forEach((child) => {
      const span = (end - start) * ((subtreeWeight.get(child) ?? 1) / totalWeight);
      rawAngles.set(child, cursor + span / 2);
      assignAngles(child, cursor, cursor + span);
      cursor += span;
    });
  };
  assignAngles(root, -Math.PI / 2, Math.PI * 1.5);

  const nodesByDepth = new Map<number, string[]>();
  component.ids.forEach((id) => {
    const nodeDepth = depth.get(id) ?? 0;
    const entries = nodesByDepth.get(nodeDepth) ?? [];
    entries.push(id);
    nodesByDepth.set(nodeDepth, entries);
  });

  const positions = new Map<string, GraphPosition>([[root, { x: 0, y: 0 }]]);
  nodesByDepth.forEach((ids, nodeDepth) => {
    if (nodeDepth === 0) return;
    ids.sort((left, right) => (
      (rawAngles.get(left) ?? 0) - (rawAngles.get(right) ?? 0)
      || hashGraphId(left) - hashGraphId(right)
    ));

    const radius = Math.max(nodeDepth * 285, (ids.length * 190) / (Math.PI * 2));
    ids.forEach((id, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / ids.length;
      positions.set(id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
  });

  // Trocas determinÃ­sticas dentro de um mesmo anel nunca aproximam os nÃ³s,
  // mas mantÃªm apenas as que reduzem cruzamentos reais das conexÃµes.
  let crossingCount = countEdgeCrossings(positions, component.edges);
  for (let pass = 0; pass < 5; pass += 1) {
    let improved = false;
    const orderedDepths = [...nodesByDepth.keys()].filter((value) => value > 0).sort((a, b) => a - b);

    orderedDepths.forEach((nodeDepth) => {
      const ids = nodesByDepth.get(nodeDepth) ?? [];
      for (let first = 0; first < ids.length; first += 1) {
        for (let second = first + 1; second < ids.length; second += 1) {
          const firstPosition = positions.get(ids[first]);
          const secondPosition = positions.get(ids[second]);
          if (!firstPosition || !secondPosition) continue;

          positions.set(ids[first], secondPosition);
          positions.set(ids[second], firstPosition);
          const candidate = countEdgeCrossings(positions, component.edges);

          if (candidate < crossingCount) {
            crossingCount = candidate;
            improved = true;
          } else {
            positions.set(ids[first], firstPosition);
            positions.set(ids[second], secondPosition);
          }
        }
      }
    });

    if (!improved) break;
  }

  return positions;
};

const getPositionBounds = (positions: ReadonlyMap<string, GraphPosition>) => {
  const values = [...positions.values()];
  if (values.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  return values.reduce((bounds, position) => ({
    minX: Math.min(bounds.minX, position.x),
    minY: Math.min(bounds.minY, position.y),
    maxX: Math.max(bounds.maxX, position.x),
    maxY: Math.max(bounds.maxY, position.y),
  }), {
    minX: values[0].x,
    minY: values[0].y,
    maxX: values[0].x,
    maxY: values[0].y,
  });
};

const createOrganizedPositions = (graph: WikiGraphResponse) => {
  const { adjacency, components } = buildGraphTopology(graph);
  const orderedComponents = [...components].sort((left, right) => {
    const leftIsCentral = Boolean(graph.centralNodeId && left.ids.includes(graph.centralNodeId));
    const rightIsCentral = Boolean(graph.centralNodeId && right.ids.includes(graph.centralNodeId));
    if (leftIsCentral !== rightIsCentral) return leftIsCentral ? -1 : 1;
    return right.ids.length - left.ids.length
      || hashGraphId(left.ids[0]) - hashGraphId(right.ids[0]);
  });
  const mainComponent = orderedComponents[0];
  if (!mainComponent) return new Map<string, GraphPosition>();

  const organized = createRadialComponentPositions(
    mainComponent,
    adjacency,
    graph.centralNodeId ?? undefined,
  );
  const mainBounds = getPositionBounds(organized);
  const rowStartX = mainBounds.minX;
  const rowLimit = Math.max(mainBounds.maxX - mainBounds.minX, 1_900);
  let cursorX = rowStartX;
  let cursorY = mainBounds.maxY + 430;
  let rowHeight = 0;

  orderedComponents.slice(1).forEach((component) => {
    const local = createRadialComponentPositions(component, adjacency);
    const bounds = getPositionBounds(local);
    const width = Math.max(bounds.maxX - bounds.minX + 220, 220);
    const height = Math.max(bounds.maxY - bounds.minY + 180, 180);

    if (cursorX > rowStartX && cursorX + width > rowStartX + rowLimit) {
      cursorX = rowStartX;
      cursorY += rowHeight + 190;
      rowHeight = 0;
    }

    local.forEach((position, id) => {
      organized.set(id, {
        x: cursorX + 110 + position.x - bounds.minX,
        y: cursorY + 90 + position.y - bounds.minY,
      });
    });
    cursorX += width + 150;
    rowHeight = Math.max(rowHeight, height);
  });

  return organized;
};

const runLayout = (
  cy: Core,
  graph: WikiGraphResponse,
  layoutMode: WikiGraphLayoutMode,
) => {
  if (layoutMode === 'free') {
    const positions = createFreePositions(graph);
    cy.layout({
      name: 'preset',
      fit: false,
      animate: false,
      positions: (node: NodeSingular) => positions.get(node.id()) ?? { x: 0, y: 0 },
    } as unknown as LayoutOptions).run();
    return;
  }

  const positions = createOrganizedPositions(graph);
  cy.layout({
    name: 'preset',
    animate: false,
    fit: false,
    positions: (node: NodeSingular) => positions.get(node.id()) ?? { x: 0, y: 0 },
  } as unknown as LayoutOptions).run();
};

const createStylesheet = (neon: boolean): StylesheetJson => ([
  {
    selector: 'node',
    style: {
      width: 72,
      height: 72,
      shape: 'ellipse',
      'background-color': '#061321',
      'background-fit': 'cover',
      'background-clip': 'node',
      'background-image': 'none',
      'border-width': 1.5,
      'border-color': '#47dbff',
      label: 'data(label)',
      color: '#f3f7fb',
      'font-family': 'Orbitron, sans-serif',
      'font-size': 11,
      'font-weight': 600,
      'text-wrap': 'wrap',
      'text-max-width': '150px',
      'text-valign': 'bottom',
      'text-margin-y': 14,
      'text-background-color': '#020916',
      'text-background-opacity': 0.82,
      'text-background-padding': '4px',
      'min-zoomed-font-size': 8,
      'overlay-opacity': 0,
      'underlay-shape': 'ellipse',
      'transition-property': 'width, height, opacity, border-width, border-color, underlay-color, underlay-opacity, underlay-padding',
      'transition-duration': 180,
    },
  },
  {
    selector: 'node.has-image',
    style: {
      'background-image': 'data(image)',
      'background-image-crossorigin': 'anonymous',
    },
  },
  {
    selector: 'node.entity-city',
    style: {
      width: 150,
      height: 86,
      shape: 'round-rectangle',
      'border-color': '#ffe45e',
      'underlay-shape': 'round-rectangle',
    },
  },
  {
    selector: 'node.entity-page',
    style: {
      width: 138,
      height: 78,
      shape: 'round-rectangle',
      'border-color': '#4edbff',
      'underlay-shape': 'round-rectangle',
    },
  },
  {
    selector: 'node.entity-character',
    style: {
      width: 74,
      height: 74,
      shape: 'ellipse',
      'border-color': '#ff4fd8',
      'border-width': 2,
      'underlay-shape': 'ellipse',
    },
  },
  {
    selector: 'node.entity-race',
    style: {
      width: 82,
      height: 82,
      shape: 'round-rectangle',
      'border-color': '#68ffad',
      'underlay-shape': 'round-rectangle',
    },
  },
  {
    selector: 'node.is-hidden',
    style: {
      width: 28,
      height: 28,
      shape: 'ellipse',
      label: '',
      'background-image': 'none',
      'background-color': '#01040a',
      'border-color': '#243244',
      'border-width': 1,
      'underlay-shape': 'ellipse',
      opacity: 0.72,
    },
  },
  {
    selector: 'node.is-admin-hidden',
    style: {
      'border-color': '#ffcf45',
      'border-width': 2,
      'border-style': 'dashed',
      opacity: 0.92,
      'underlay-color': '#ffcf45',
      'underlay-opacity': neon ? 0.13 : 0.05,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.is-central',
    style: {
      width: 190,
      height: 112,
      'border-width': 3,
      'border-color': '#56e6ff',
      'underlay-color': '#00cfff',
      'underlay-opacity': neon ? 0.22 : 0.09,
      'underlay-padding': 13,
      'underlay-shape': 'round-rectangle',
      'font-size': 13,
      'text-margin-y': 17,
    },
  },
  {
    selector: 'node.is-search-hit',
    style: {
      'border-width': 4,
      'border-color': '#ffffff',
      'underlay-color': '#47dbff',
      'underlay-opacity': neon ? 0.48 : 0.26,
      'underlay-padding': 18,
    },
  },
  {
    selector: 'node.is-hovered',
    style: {
      'border-width': 3,
      'underlay-color': '#47dbff',
      'underlay-opacity': neon ? 0.42 : 0.2,
      'underlay-padding': 12,
    },
  },
  {
    selector: 'node.is-hover-neighbor',
    style: {
      'border-width': 2.5,
      'underlay-opacity': neon ? 0.22 : 0.1,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.entity-city',
    style: {
      'underlay-color': '#ffe45e',
      'underlay-opacity': neon ? 0.09 : 0,
      'underlay-padding': 6,
    },
  },
  {
    selector: 'node.entity-page',
    style: {
      'underlay-color': '#4edbff',
      'underlay-opacity': neon ? 0.09 : 0,
      'underlay-padding': 6,
    },
  },
  {
    selector: 'node.entity-character',
    style: {
      'underlay-color': '#ff4fd8',
      'underlay-opacity': neon ? 0.11 : 0,
      'underlay-padding': 6,
    },
  },
  {
    selector: 'node.entity-race',
    style: {
      'underlay-color': '#68ffad',
      'underlay-opacity': neon ? 0.1 : 0,
      'underlay-padding': 6,
    },
  },
  {
    selector: 'node.is-admin-hidden',
    style: {
      'underlay-color': '#ffcf45',
      'underlay-opacity': neon ? 0.13 : 0.05,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.is-central',
    style: {
      'underlay-color': '#00cfff',
      'underlay-opacity': neon ? 0.22 : 0.09,
      'underlay-padding': 13,
    },
  },
  {
    selector: 'node.is-search-hit',
    style: {
      'border-width': 4,
      'border-color': '#ffffff',
      'underlay-color': '#47dbff',
      'underlay-opacity': neon ? 0.48 : 0.26,
      'underlay-padding': 18,
    },
  },
  {
    selector: 'node.entity-city.is-hovered',
    style: {
      width: 162,
      height: 93,
      'underlay-color': '#ffe45e',
      'underlay-opacity': neon ? 0.42 : 0.2,
      'underlay-padding': 12,
    },
  },
  {
    selector: 'node.entity-page.is-hovered',
    style: {
      width: 149,
      height: 84,
      'underlay-color': '#4edbff',
      'underlay-opacity': neon ? 0.42 : 0.2,
      'underlay-padding': 12,
    },
  },
  {
    selector: 'node.entity-character.is-hovered',
    style: {
      width: 82,
      height: 82,
      'underlay-color': '#ff4fd8',
      'underlay-opacity': neon ? 0.42 : 0.2,
      'underlay-padding': 12,
    },
  },
  {
    selector: 'node.entity-race.is-hovered',
    style: {
      width: 90,
      height: 90,
      'underlay-color': '#68ffad',
      'underlay-opacity': neon ? 0.42 : 0.2,
      'underlay-padding': 12,
    },
  },
  {
    selector: 'node.entity-city.is-hover-neighbor',
    style: {
      width: 158,
      height: 91,
      'underlay-opacity': neon ? 0.22 : 0.1,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.entity-page.is-hover-neighbor',
    style: {
      width: 146,
      height: 83,
      'underlay-opacity': neon ? 0.22 : 0.1,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.entity-character.is-hover-neighbor',
    style: {
      width: 79,
      height: 79,
      'underlay-opacity': neon ? 0.22 : 0.1,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.entity-race.is-hover-neighbor',
    style: {
      width: 87,
      height: 87,
      'underlay-opacity': neon ? 0.22 : 0.1,
      'underlay-padding': 7,
    },
  },
  {
    selector: 'node.is-central.is-hovered',
    style: {
      width: 207,
      height: 122,
      'underlay-opacity': neon ? 0.46 : 0.24,
      'underlay-padding': 16,
    },
  },
  {
    selector: 'node.is-central.is-hover-neighbor',
    style: { width: 201, height: 119 },
  },
  {
    selector: 'node.is-hidden.is-hovered',
    style: { width: 32, height: 32 },
  },
  {
    selector: 'node.is-hidden.is-hover-neighbor',
    style: { width: 30, height: 30 },
  },
  {
    selector: 'node.is-dimmed',
    style: { opacity: 0.2 },
  },
  {
    selector: 'edge',
    style: {
      width: 1.25,
      'line-color': '#28cfff',
      opacity: neon ? 0.54 : 0.34,
      'curve-style': 'bezier',
      'line-cap': 'round',
      'overlay-opacity': 0,
      'underlay-color': '#28cfff',
      'underlay-opacity': neon ? 0.08 : 0,
      'underlay-padding': neon ? 2.4 : 1,
      'transition-property': 'opacity, width, line-color, underlay-color, underlay-opacity, underlay-padding',
      'transition-duration': 180,
    },
  },
  {
    selector: 'edge.touches-central',
    style: {
      width: 1.8,
      'line-color': '#45dcff',
      opacity: neon ? 0.82 : 0.56,
    },
  },
  {
    selector: 'edge.is-node-hovered',
    style: {
      width: 2.6,
      opacity: 0.96,
      'underlay-opacity': neon ? 0.3 : 0.16,
      'underlay-padding': neon ? 5 : 3.5,
    },
  },
  {
    selector: 'edge.hover-city',
    style: { 'line-color': '#ffe45e', 'underlay-color': '#ffe45e' },
  },
  {
    selector: 'edge.hover-page',
    style: { 'line-color': '#4edbff', 'underlay-color': '#4edbff' },
  },
  {
    selector: 'edge.hover-character',
    style: { 'line-color': '#ff4fd8', 'underlay-color': '#ff4fd8' },
  },
  {
    selector: 'edge.hover-race',
    style: { 'line-color': '#68ffad', 'underlay-color': '#68ffad' },
  },
  {
    selector: 'edge.is-hovered',
    style: {
      width: 3,
      opacity: 1,
      'line-color': '#b8f5ff',
      'underlay-color': '#28cfff',
      'underlay-opacity': neon ? 0.4 : 0.22,
      'underlay-padding': neon ? 6 : 4,
    },
  },
  {
    selector: 'edge.is-dimmed',
    style: { opacity: 0.08 },
  },
]);

const toElements = (graph: WikiGraphResponse): ElementDefinition[] => {
  const elements: ElementDefinition[] = graph.nodes.map((node) => {
    if (!isWikiGraphIdentifiedNode(node)) {
      return {
        group: 'nodes',
        data: { id: node.graphId, hidden: true },
        classes: 'is-hidden',
      };
    }

    const image = normalizeImagePath(node.image);
    const classes = [
      `entity-${node.entityType}`,
      image ? 'has-image' : '',
      node.hidden ? 'is-admin-hidden' : '',
      node.graphId === graph.centralNodeId ? 'is-central' : '',
    ].filter(Boolean).join(' ');

    return {
      group: 'nodes',
      data: {
        id: node.graphId,
        entityType: node.entityType,
        title: node.title,
        label: `${node.title}\n· ${typeLabels[node.entityType].toUpperCase()} ·${node.hidden ? '\n⚠ NÃO VISÍVEL' : ''}`,
        ...(image ? { image } : {}),
        route: node.route,
        hidden: node.hidden,
        identified: true,
      },
      classes,
    };
  });

  for (const edge of graph.edges) {
    elements.push({
      group: 'edges',
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        touchesCentral: edge.source === graph.centralNodeId || edge.target === graph.centralNodeId,
      },
      classes: edge.source === graph.centralNodeId || edge.target === graph.centralNodeId
        ? 'touches-central'
        : undefined,
    });
  }

  return elements;
};

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(({ 
  graph,
  activeTypes,
  neon,
  layoutMode,
  onNavigate,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const processingTimer = useRef<number | null>(null);
  const [cyInstance, setCyInstance] = useState<Core | null>(null);
  const [processing, setProcessing] = useState(true);

  const centralize = useCallback(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    const central = cy.$('node.is-central');

    if (central.length === 0) {
      cy.animate({ fit: { eles: cy.elements(), padding: 55 } }, { duration: 360, queue: false });
      return;
    }

    const targetZoom = window.innerWidth <= 768 ? 0.8 : window.innerWidth <= 1100 ? 0.88 : 1.02;
    cy.animate(
      { center: { eles: central }, zoom: Math.min(targetZoom, cy.maxZoom()) },
      { duration: 420, queue: false },
    );
  }, []);

  const focusNode = useCallback((graphId: string) => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    const node = cy.getElementById(graphId);
    if (node.empty() || !node.data('identified')) return;

    cy.nodes().removeClass('is-search-hit');
    node.addClass('is-search-hit');
    cy.animate(
      { center: { eles: node }, zoom: Math.min(window.innerWidth <= 768 ? 1.15 : 1.35, cy.maxZoom()) },
      { duration: 430, queue: false },
    );

    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => {
      if (!cy.destroyed()) node.removeClass('is-search-hit');
    }, 1900);
  }, []);

  useImperativeHandle(ref, () => ({ centralize, focusNode }), [centralize, focusNode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    setProcessing(true);
    const cy = cytoscape({
      container,
      elements: toElements(graph),
      style: createStylesheet(false),
      minZoom: 0.13,
      maxZoom: 2.8,
      boxSelectionEnabled: false,
      autoungrabify: false,
      selectionType: 'single',
    });
    cyRef.current = cy;
    setCyInstance(cy);

    const handleTap = (event: cytoscape.EventObject) => {
      const node = event.target as NodeSingular;
      if (!node.isNode() || !node.data('identified')) return;
      const route = node.data('route');
      if (typeof route === 'string' && route) onNavigate(route);
    };
    const clearNodeHover = () => {
      cy.nodes().removeClass('is-hovered is-hover-neighbor');
      cy.edges().removeClass(`is-node-hovered ${edgeEntityHoverClasses.join(' ')}`);
    };
    const clearAllHover = () => {
      clearNodeHover();
      cy.edges().removeClass('is-hovered');
      container.style.cursor = 'grab';
    };
    const handleMouseOver = (event: cytoscape.EventObject) => {
      const target = event.target;
      if (target.isNode()) {
        const node = target as NodeSingular;
        const entityType = node.data('entityType') as WikiGraphEntityType | undefined;

        cy.batch(() => {
          clearNodeHover();
          node.addClass('is-hovered');
          node.neighborhood('node').addClass('is-hover-neighbor');
          const connectedEdges = node.connectedEdges();
          connectedEdges.addClass('is-node-hovered');
          if (entityType) connectedEdges.addClass(`hover-${entityType}`);
        });
        container.style.cursor = node.data('identified') ? 'pointer' : 'grab';
        return;
      }

      if (target.isEdge()) {
        target.addClass('is-hovered');
        container.style.cursor = 'crosshair';
      }
    };
    const handleMouseOut = (event: cytoscape.EventObject) => {
      const target = event.target;
      if (target.isNode()) clearNodeHover();
      if (target.isEdge()) target.removeClass('is-hovered');
      container.style.cursor = 'grab';
    };

    cy.on('tap', 'node', handleTap);
    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node', handleMouseOut);
    cy.on('mouseover', 'edge', handleMouseOver);
    cy.on('mouseout', 'edge', handleMouseOut);
    container.addEventListener('mouseleave', clearAllHover);

    let layoutFinished = false;
    const finishLayout = () => {
      if (layoutFinished) return;
      layoutFinished = true;
      if (processingTimer.current !== null) {
        window.clearTimeout(processingTimer.current);
        processingTimer.current = null;
      }
      setProcessing(false);
      window.requestAnimationFrame(centralize);
    };
    cy.one('layoutstop', finishLayout);

    processingTimer.current = window.setTimeout(() => {
      if (!cy.destroyed()) finishLayout();
    }, 12_000);
    runLayout(cy, graph, layoutMode);

    const resizeObserver = new ResizeObserver(() => {
      if (!cy.destroyed()) cy.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (processingTimer.current !== null) window.clearTimeout(processingTimer.current);
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
      cy.off('tap', 'node', handleTap);
      cy.off('mouseover', 'node', handleMouseOver);
      cy.off('mouseout', 'node', handleMouseOut);
      cy.off('mouseover', 'edge', handleMouseOver);
      cy.off('mouseout', 'edge', handleMouseOut);
      container.removeEventListener('mouseleave', clearAllHover);
      cy.destroy();
      cyRef.current = null;
    };
  }, [centralize, graph, layoutMode, onNavigate]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.style(createStylesheet(neon));
  }, [neon]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    cy.batch(() => {
      cy.nodes().forEach((node) => {
        if (activeTypes.size === 0) {
          node.removeClass('is-dimmed');
          return;
        }

        if (!node.data('identified')) {
          node.addClass('is-dimmed');
          return;
        }

        const type = node.data('entityType') as WikiGraphEntityType | undefined;
        node.toggleClass('is-dimmed', !type || !activeTypes.has(type));
      });

      cy.edges().forEach((edge) => {
        if (activeTypes.size === 0) {
          edge.removeClass('is-dimmed');
          return;
        }

        const endpoints = [edge.source(), edge.target()];
        const touchesFocus = endpoints.some((node) => {
          if (!node.data('identified')) return false;
          const type = node.data('entityType') as WikiGraphEntityType | undefined;
          return Boolean(type && activeTypes.has(type));
        });
        edge.toggleClass('is-dimmed', !touchesFocus);
      });
    });
  }, [activeTypes, graph, layoutMode]);

  return (
    <CanvasShell $neon={neon} aria-label="Teia interativa de conexões da Wiki">
      <CanvasHost ref={containerRef} />
      <AccessibleNodeNavigation aria-label="Entidades visíveis da Teia de Conexões">
        <details>
          <summary>Navegação alternativa pela teia</summary>
          <ul>
            {graph.nodes.filter(isWikiGraphIdentifiedNode).map((node) => (
              <li key={node.graphId}>
                <Link to={node.route}>
                  {typeLabels[node.entityType]}: {node.title}{node.hidden ? ' (não visível)' : ''}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      </AccessibleNodeNavigation>
      {processing && (
        <ProcessingOverlay>
          <LoadingIndicator label="Organizando conexões" />
        </ProcessingOverlay>
      )}
      {cyInstance && (
        <GraphMinimap cy={cyInstance} neon={neon} onCentralize={centralize} />
      )}
    </CanvasShell>
  );
});

GraphCanvas.displayName = 'GraphCanvas';
