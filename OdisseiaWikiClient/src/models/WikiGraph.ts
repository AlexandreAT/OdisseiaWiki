export type WikiGraphEntityType = 'city' | 'page' | 'character' | 'race';

export type WikiGraphLayoutMode = 'free' | 'organized';

export interface WikiGraphAnonymousHiddenNode {
  graphId: string;
  hidden: true;
  entityType?: never;
  title?: never;
  image?: never;
  route?: never;
}

export interface WikiGraphAdminHiddenNode {
  graphId: string;
  hidden: true;
  entityType: WikiGraphEntityType;
  title: string;
  image?: string;
  route: string;
}

export interface WikiGraphVisibleNode {
  graphId: string;
  hidden: false;
  entityType: WikiGraphEntityType;
  title: string;
  image?: string;
  route: string;
}

export type WikiGraphIdentifiedNode = WikiGraphVisibleNode | WikiGraphAdminHiddenNode;

export type WikiGraphNode = WikiGraphAnonymousHiddenNode | WikiGraphIdentifiedNode;

export interface WikiGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface WikiGraphStats {
  totalNodes: number;
  totalEdges: number;
}

export interface WikiGraphResponse {
  nodes: WikiGraphNode[];
  edges: WikiGraphEdge[];
  centralNodeId: string | null;
  stats: WikiGraphStats;
}

export const isWikiGraphVisibleNode = (
  node: WikiGraphNode,
): node is WikiGraphVisibleNode => !node.hidden;

export const isWikiGraphIdentifiedNode = (
  node: WikiGraphNode,
): node is WikiGraphIdentifiedNode => (
  typeof node.entityType === 'string'
  && typeof node.title === 'string'
  && typeof node.route === 'string'
);
