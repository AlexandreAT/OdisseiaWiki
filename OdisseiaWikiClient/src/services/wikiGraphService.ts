import api from '../axios/api';
import {
  WikiGraphEdge,
  WikiGraphEntityType,
  WikiGraphNode,
  WikiGraphResponse,
} from '../models/WikiGraph';
import { ServiceRequestOptions } from './serviceRequestOptions';

const entityTypes = new Set<WikiGraphEntityType>(['city', 'page', 'character', 'race']);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const parseNode = (value: unknown): WikiGraphNode | null => {
  if (!isRecord(value) || typeof value.graphId !== 'string' || typeof value.hidden !== 'boolean') {
    return null;
  }

  const hasMetadata = (
    typeof value.entityType !== 'string'
      ? false
      : entityTypes.has(value.entityType as WikiGraphEntityType)
        && typeof value.title === 'string'
        && typeof value.route === 'string'
  );

  if (!hasMetadata) {
    if (value.hidden) return { graphId: value.graphId, hidden: true };
    return null;
  }

  return {
    graphId: value.graphId,
    hidden: value.hidden,
    entityType: value.entityType as WikiGraphEntityType,
    title: value.title as string,
    image: typeof value.image === 'string' ? value.image : undefined,
    route: value.route as string,
  };
};

const parseEdge = (value: unknown): WikiGraphEdge | null => {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.source !== 'string'
    || typeof value.target !== 'string'
  ) {
    return null;
  }

  return { id: value.id, source: value.source, target: value.target };
};

const parseWikiGraph = (value: unknown): WikiGraphResponse => {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    throw new Error('A resposta da Teia de Conexões é inválida.');
  }

  const nodes = value.nodes.map(parseNode).filter((node): node is WikiGraphNode => node !== null);
  const nodeIds = new Set(nodes.map((node) => node.graphId));
  const edges = value.edges
    .map(parseEdge)
    .filter((edge): edge is WikiGraphEdge => (
      edge !== null && nodeIds.has(edge.source) && nodeIds.has(edge.target)
    ));

  const centralNodeId = typeof value.centralNodeId === 'string' && nodeIds.has(value.centralNodeId)
    ? value.centralNodeId
    : null;

  return {
    nodes,
    edges,
    centralNodeId,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
  };
};

export const getWikiGraph = async (
  options: ServiceRequestOptions = {},
): Promise<WikiGraphResponse> => {
  const response = await api.get<unknown>('/wiki/graph', options);
  return parseWikiGraph(response.data);
};
