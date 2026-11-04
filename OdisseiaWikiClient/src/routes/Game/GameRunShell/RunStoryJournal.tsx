import type { GameStoryRecord } from '../../../models/GameStory';
import { StoryJournal } from './RunStory.style';

export function RunStoryJournal({ records, ended = false }: { records: GameStoryRecord[]; ended?: boolean }) {
  if (!records.length) return null;
  return <StoryJournal><summary>Registros da jornada · {records.length}</summary>
    <ol>{records.map((record, index) => <li key={`${record.nodeId}:${record.type}:${index}`}>
      <strong>{record.name} · {record.choice}</strong>
      {record.type === 'MISSAO_ACEITA' && !records.some(other => other.nodeId === record.nodeId && other.type === 'MISSAO_CONCLUIDA') &&
        <p>{ended ? 'Missão não concluída nesta jornada.' : 'Missão em andamento.'}</p>}
      {record.resultText && <p>{record.resultText}</p>}
      <small>{([
        [record.currency, 'moedas'], [record.xp, 'XP'], [record.life, 'vida'], [record.mana, 'mana'], [record.stamina, 'estamina'],
      ] as const).filter(([value]) => value !== 0).map(([value, label]) => `${value > 0 ? '+' : ''}${value} ${label}`)
        .concat(record.items.map(item => `${item.quantidade ?? 1}× ${item.nome ?? 'Item'}`), record.conditions).join(' · ')}</small>
    </li>)}</ol>
  </StoryJournal>;
}
