import { Modal } from '../../../components/Generic/Modal/Modal';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import type { GameRunDto, GameRunMapNode } from '../../../models/GameRun';
import { storyCannotPay, storyCostText, storyOutcomeText } from '../../../utils/gameStory';
import { GameNotice } from '../GameShared.style';
import { RunFooterActions } from './GameRunShell.style';
import { StoryBody, StoryChoiceCard } from './RunStory.style';

export function RunStoryDialog({ run, node, theme, neon, busy, error, onChoose, onClose }: {
  run: GameRunDto; node: GameRunMapNode; theme: 'dark' | 'light'; neon: 'on' | 'off';
  busy: boolean; error?: string | null; onChoose: (code: string) => Promise<boolean>; onClose: () => void;
}) {
  const mission = node.payload?.mission;
  const choices = mission ? [{ code: 'ACCEPT', label: 'Aceitar missão', description: 'Conclua a área da missão para receber estas recompensas.',
    cost: mission.cost, outcome: mission.reward }] : node.payload?.choices ?? [];
  return <Modal title={node.name} subtitle={mission ? 'Missão · escolha seu próximo objetivo' : 'Evento · decida como continuar'}
    width="960px" theme={theme} neon={neon} showFooter={false} onClose={() => { if (!busy) onClose(); }}>
    <StoryBody>
      {node.description && <p>{node.description}</p>}
      {error && <GameNotice $danger role="alert">{error}</GameNotice>}
      {choices.map(choice => {
        const reason = storyCannotPay(choice.cost, run.estadoAtual);
        return <StoryChoiceCard key={choice.code} neon={neon === 'on'}>
          <h3>{choice.label}</h3>
          {choice.description && <p>{choice.description}</p>}
          <small>Custo: {storyCostText(choice.cost)}</small>
          <ul aria-label={mission ? 'Recompensas ao concluir' : 'Efeitos da escolha'}>{storyOutcomeText(choice.outcome).map((text, index) => <li key={index}>{text}</li>)}</ul>
          {reason && <p role="status">{reason}</p>}
          <RunFooterActions>
            {mission?.canDecline && <CyberButton text="Deixar para trás" theme={theme} neon={neon} colorType="secondary"
              disabled={busy} onClick={() => void onChoose('DECLINE')} />}
            <CyberButton text={mission ? 'Aceitar missão' : 'Escolher'} theme={theme} neon={neon}
              disabled={busy || !!reason} loading={busy} onClick={() => void onChoose(choice.code)} />
          </RunFooterActions>
        </StoryChoiceCard>;
      })}
    </StoryBody>
  </Modal>;
}
