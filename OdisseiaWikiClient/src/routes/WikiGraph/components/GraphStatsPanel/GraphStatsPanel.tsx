import { BiLink, BiNetworkChart, BiTargetLock } from 'react-icons/bi';
import { WikiGraphStats, WikiGraphVisibleNode } from '../../../../models/WikiGraph';
import { HudFrame } from '../../../../components/Generic/HudFrame';
import {
  CentralType,
  StatList,
  StatsContent,
  StatsPositioner,
  StatsTitle,
} from './GraphStatsPanel.style';

interface GraphStatsPanelProps {
  stats: WikiGraphStats;
  centralNode: WikiGraphVisibleNode | null;
  neon: boolean;
}

const typeLabels: Record<WikiGraphVisibleNode['entityType'], string> = {
  city: 'Cidade',
  page: 'Página',
  character: 'Personagem',
  race: 'Raça',
};

export const GraphStatsPanel = ({ stats, centralNode, neon }: GraphStatsPanelProps) => (
  <StatsPositioner>
    <HudFrame neon={neon} aria-label="Resumo da Teia de Conexões">
      <StatsContent>
        <StatsTitle>Teia de Conexões</StatsTitle>
        <StatList $neon={neon}>
          <div>
            <BiNetworkChart aria-hidden="true" />
            <dt>Nós totais</dt>
            <dd>{stats.totalNodes}</dd>
          </div>
          <div>
            <BiLink aria-hidden="true" />
            <dt>Conexões totais</dt>
            <dd>{stats.totalEdges}</dd>
          </div>
          <div>
            <BiTargetLock aria-hidden="true" />
            <dt>Nó central</dt>
            <dd>
              {centralNode?.title ?? 'Nenhum'}
              {centralNode && <CentralType>{typeLabels[centralNode.entityType]}</CentralType>}
            </dd>
          </div>
        </StatList>
      </StatsContent>
    </HudFrame>
  </StatsPositioner>
);
