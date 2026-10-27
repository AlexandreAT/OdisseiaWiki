import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { ConditionBadges } from '../../../components/Gameplay/ConditionBadges/ConditionBadges';
import type { GameBattlePreview, GameBattlePreviewActor } from '../../../models/GameBattlePreview';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { GameNotice } from '../GameShared.style';
import { HolographicPreviewProvider } from '../../../components/Generic/HolographicPreview';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { Lightbox } from '../../Wiki/components/blocks/shared/Lightbox/Lightbox';
import { activeBattleActor, battleWinner, endingLabel, latestBattleImpact, visibleActorConditions, visibleActorDefense, visibleActorResource, type BattleResource } from './battlePresentation';
import { useBattleReplay } from './useBattleReplay';
import { useMotionReduced } from '../../../hooks/useMotionPreference';
import { BattleBeatText as BeatText } from './BattleBeatText';
import {
  CombatantCard,
  CombatantDefenses,
  Combatants,
  CombatantResource,
  CombatantResources,
  CurrentEvent,
  EventList,
  EnemyGroup,
  ResourceFill,
  ResourceTrack,
  ReplayActionRow,
  ReplayContent,
  ReplayControl,
  ReplayClose,
  ReplayControls,
  ReplayIntro,
  ReplayNote,
  ReplayProgress,
  ReplayResult,
  ReplayXp,
  ReplayLevel,
  ReplayPoints,
  ReplayRewards,
  ReplayToolbar,
  Versus,
} from './BattleReplay.style';

interface BattleReplayProps {
  runId: number;
  theme: 'light' | 'dark';
  neon: 'on' | 'off';
  savedBattle?: GameBattlePreview;
  playerImage?: string | null;
  onComplete?: (speed: 1 | 2) => void;
  onReturnToMap?: () => void;
  allowCloseBeforeComplete?: boolean;
  isHistoricalReplay?: boolean;
}

const actorName = (preview: GameBattlePreview, id: string | null): string => {
  if (id === preview.personagem.id) return preview.personagem.nome;
  const enemy = (preview.oponentes?.length ? preview.oponentes : [preview.oponente])
    .find((candidate) => candidate.id === id);
  if (enemy) return enemy.nome;
  return 'Combate';
};

const resourceDefinitions: { key: BattleResource; label: string; max: 'vidaMaxima' | 'manaMaxima' | 'estaminaMaxima' }[] = [
  { key: 'hitPoints', label: 'Vida', max: 'vidaMaxima' },
  { key: 'mana', label: 'Mana', max: 'manaMaxima' },
  { key: 'stamina', label: 'Estamina', max: 'estaminaMaxima' },
];

const ReplayXpGain = ({ amount, levels, points }: { amount: number; levels: number[];
  points?: GameBattlePreview['pontosConcedidos'] }) => {
  const [visible, setVisible] = useState(0);
  const reducedMotion = useMotionReduced();
  useEffect(() => {
    if (reducedMotion) {
      setVisible(amount);
      return;
    }
    let frame = 0;
    let started = 0;
    const advance = (time: number) => {
      if (!started) started = time;
      const progress = Math.min(1, (time - started) / 1250);
      setVisible(Math.round(amount * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [amount, reducedMotion]);

  const pointLabels = [
    [points?.gerais, 'gerais'], [points?.atributo, 'de atributo'],
    [points?.skill, 'de skill'], [points?.ultimate, 'de ultimate'],
  ].filter((entry): entry is [number, string] => typeof entry[0] === 'number' && entry[0] > 0)
    .map(([count, name]) => `+${count} ${count === 1 ? 'ponto' : 'pontos'} ${name}`);

  return <ReplayRewards>
    <ReplayXp aria-label={`Mais ${amount} pontos de experiência`}>
      <span aria-hidden="true">+{visible} XP</span>
    </ReplayXp>
    {levels.length > 0 && <ReplayLevel aria-label={`Alcançou o nível ${levels.at(-1)}`}>
      <span aria-hidden="true">NÍVEL {levels.at(-1)}</span>
    </ReplayLevel>}
    {pointLabels.length > 0 && <ReplayPoints>{pointLabels.join(' · ')}</ReplayPoints>}
  </ReplayRewards>;
};

const ResourceMeter = ({ label, actor, value, max, tone, enemy, speed, protectedLife }: {
  label: string;
  actor: GameBattlePreviewActor;
  value: number;
  max: number;
  tone: BattleResource | 'protection';
  enemy?: boolean;
  protectedLife?: boolean;
  speed: 1 | 2;
}) => {
  const percent = max > 0 ? Math.max(0, Math.min(100, value / max * 100)) : 0;
  const initialPercent = useRef(percent);
  const currentValue = useRef(value);
  const previousTarget = useRef({ value, max });
  const lastChangeAt = useRef(0);
  const fillRef = useRef<HTMLDivElement>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const reducedMotion = useMotionReduced();

  useLayoutEffect(() => {
    if (previousTarget.current.value === value && previousTarget.current.max === max &&
        Math.abs(currentValue.current - value) < .001) return;
    previousTarget.current = { value, max };
    const fill = fillRef.current;
    if (!fill) return;
    if (reducedMotion) {
      fill.style.transitionDuration = '0ms';
      fill.style.width = `${percent}%`;
      currentValue.current = value;
      setDisplayValue(value);
      return;
    }
    const now = performance.now();
    const rapidSequence = lastChangeAt.current > 0 && now - lastChangeAt.current < 1300;
    const duration = rapidSequence ? (speed === 1 ? 600 : 340) : (speed === 1 ? 1500 : 780);
    const fromValue = currentValue.current;
    lastChangeAt.current = now;
    fill.style.transitionDuration = `${duration}ms`;
    fill.style.width = `${percent}%`;
    let timer = 0;
    const animate = (time: number) => {
      const progress = Math.min(1, (time - now) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      currentValue.current = fromValue + (value - fromValue) * eased;
      setDisplayValue(Math.round(currentValue.current));
      if (progress >= 1) window.clearInterval(timer);
    };
    timer = window.setInterval(() => animate(performance.now()), 16);
    return () => window.clearInterval(timer);
  }, [percent, value, max, speed, reducedMotion]);

  return <CombatantResource>
    <div><span>{label}</span><strong>{displayValue} / {max}</strong></div>
    <ResourceTrack $protected={protectedLife} role="progressbar" aria-label={`${label} de ${actor.nome}`}
      aria-valuemin={0} aria-valuemax={Math.max(1, max)}
      aria-valuenow={Math.max(0, Math.min(displayValue, Math.max(1, max)))}
      aria-valuetext={`${displayValue} de ${max}`}>
      <ResourceFill ref={fillRef} $tone={tone} $enemy={enemy} $initialPercent={initialPercent.current} />
    </ResourceTrack>
  </CombatantResource>;
};

const AnimatedShield = ({ value, speed }: { value: number; speed: 1 | 2 }) => {
  const [display, setDisplay] = useState(value);
  const reducedMotion = useMotionReduced();
  const current = useRef(value);
  useEffect(() => {
    if (reducedMotion) {
      current.current = value;
      setDisplay(value);
      return;
    }
    const from = current.current;
    const started = performance.now();
    const duration = speed === 1 ? 650 : 340;
    let frame = 0;
    const advance = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      current.current = from + (value - from) * progress;
      setDisplay(Math.round(current.current));
      if (progress < 1) frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [value, speed, reducedMotion]);
  return <>{display}</>;
};

const Combatant = ({ preview, actor, eventCount, active, enemy, result, neon, fallbackImage, speed, onInspect }: {
  onInspect: (image: string, name: string) => void;
  preview: GameBattlePreview;
  actor: GameBattlePreviewActor;
  eventCount: number;
  active?: boolean;
  enemy?: boolean;
  result?: 'win' | 'loss';
  neon?: boolean;
  fallbackImage?: string | null;
  speed: 1 | 2;
}) => {
  const imageUrl = normalizeImagePath(actor.imagem ?? fallbackImage ?? undefined);
  const [imageFailed, setImageFailed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMotionReduced();
  const lastImpact = useRef<number | null>(null);
  const impactSequence = latestBattleImpact(preview, actor.id, eventCount);
  const protection = visibleActorDefense(preview, actor, 'protection', eventCount);
  const shield = visibleActorDefense(preview, actor, 'shield', eventCount);
  const initialShield = actor.defesas.shield ?? actor.defesas.shieldCharges ?? 0;
  const visibleImpactSequence = eventCount === 0 ? null : impactSequence;
  useEffect(() => setImageFailed(false), [imageUrl]);
  useEffect(() => {
    if (visibleImpactSequence === null) { lastImpact.current = null; return; }
    if (visibleImpactSequence === lastImpact.current) return;
    lastImpact.current = visibleImpactSequence;
    if (reducedMotion) return;
    const animation = cardRef.current?.animate?.([
      { transform: 'translateX(0)' }, { transform: 'translateX(-5px)', offset: .18 },
      { transform: 'translateX(4px)', offset: .42 }, { transform: 'translateX(-2px)', offset: .68 },
      { transform: 'translateX(0)' },
    ], { duration: speed === 2 ? 260 : 390, easing: 'ease-out' });
    return () => animation?.cancel();
  }, [visibleImpactSequence, speed, reducedMotion]);
  return <CombatantCard ref={cardRef} $enemy={enemy} $result={result} $neon={neon} $active={active}>
  <header><button type="button" disabled={!imageUrl || imageFailed} aria-label={`Ampliar imagem de ${actor.nome}`}
    onClick={() => { if (imageUrl && !imageFailed) onInspect(imageUrl, actor.nome); }}><span aria-hidden="true">
    {actor.nome.slice(0, 1).toUpperCase()}
    {imageUrl && !imageFailed && <img src={imageUrl} alt="" onError={() => setImageFailed(true)} />}
  </span><strong>{actor.nome}</strong></button></header>
  <CombatantResources>
    {actor.defesas.protection > 0 && <ResourceMeter label="Proteção" actor={actor}
      value={protection} max={actor.defesas.protection} tone="protection" enemy={enemy} speed={speed} />}
    {resourceDefinitions.map(({ key, label, max: maxField }) => {
      const value = visibleActorResource(preview, actor, key, eventCount);
      const max = actor[maxField];
      return <ResourceMeter key={key} label={label} actor={actor} value={value} max={max}
        tone={key} enemy={enemy} speed={speed} protectedLife={key === 'hitPoints' && protection > 0} />;
    })}
  </CombatantResources>
  <ConditionBadges conditions={visibleActorConditions(preview, actor, eventCount)} neon={neon} />
  {(actor.defesas.armor > 0 || initialShield > 0) && <CombatantDefenses aria-label="Defesas">
    {actor.defesas.armor > 0 && <span className="armor" title="Defesa fixa">
      <SecurityOutlinedIcon aria-hidden="true" />{actor.defesas.armor}</span>}
    {initialShield > 0 && <span className="shield" title="Escudo: consumido no primeiro impacto">
      <ShieldOutlinedIcon aria-hidden="true" /><AnimatedShield value={shield} speed={speed} /></span>}
  </CombatantDefenses>}
</CombatantCard>;
};

export const BattleReplay = ({ runId, theme, neon, savedBattle, playerImage, onComplete, onReturnToMap,
  allowCloseBeforeComplete = false, isHistoricalReplay = false }: BattleReplayProps) => {
  const state = useBattleReplay(runId, savedBattle);
  const { preview } = state;
  const completionNotified = useRef(false);
  const [portrait, setPortrait] = useState<{ image: string; name: string } | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const resumeAfterMedia = useRef(false);
  const resumeAfterPortrait = useRef(false);
  const { playing, setPlaying } = state;
  const onMediaOpenChange = useCallback((open: boolean) => {
    setMediaOpen(open);
    if (open) { resumeAfterMedia.current = playing; setPlaying(false); }
    else if (resumeAfterMedia.current) {
      resumeAfterMedia.current = false;
      if (portrait) resumeAfterPortrait.current = true;
      else setPlaying(true);
    }
  }, [playing, setPlaying, portrait]);
  const inspect = (image: string, name: string) => {
    resumeAfterPortrait.current = state.playing;
    state.setPlaying(false);
    setPortrait({ image, name });
  };

  useEffect(() => { completionNotified.current = false; }, [savedBattle]);

  const complete = !!preview && state.eventCount === preview.resultado.events.length &&
    state.rollingSequence === null && state.revealHold === null;
  useEffect(() => {
    if (savedBattle && complete && !portrait && !mediaOpen && !completionNotified.current) {
      completionNotified.current = true;
      onComplete?.(state.speed);
    }
  }, [complete, onComplete, savedBattle, state.speed, portrait, mediaOpen]);

  if (!preview) {
    return (
      <ReplayContent>
        <ReplayIntro>
          Teste a primeira batalha automática com a cópia da sua ficha. O oponente e o balanceamento
          deste treino vêm da versão do modo; a simulação não consome recursos nem avança a run.
        </ReplayIntro>
        {state.error && <GameNotice $danger role="alert">{state.error}</GameNotice>}
        <ReplayActionRow>
          <CyberButton theme={theme} neon={neon} width="190px" text="Simular treino" loading={state.loading} onClick={() => void state.load()} />
        </ReplayActionRow>
      </ReplayContent>
    );
  }

  const visibleBeats = state.beats.filter((beat) => beat.throughIndex <= state.eventCount);
  const currentBeat = visibleBeats[visibleBeats.length - 1];
  const recentBeats = visibleBeats.slice(-2);
  const winner = battleWinner(preview);
  const activeActorId = activeBattleActor(preview, state.eventCount);
  const winnerText = winner
    ? `${actorName(preview, winner)} venceu o combate`
    : `Combate inconclusivo: ${endingLabel(preview.resultado.endReason)}`;

  return (
    <HolographicPreviewProvider neon={neon === 'on'} onOpenChange={onMediaOpenChange}>
    <ReplayContent>
      <ReplayToolbar>
        <ReplayControls aria-label="Controles da batalha">
          <ReplayControl type="button" onClick={() => state.setPlaying(!state.playing)} disabled={complete}>
            {state.playing ? 'Pausar' : 'Reproduzir'}
          </ReplayControl>
          <ReplayControl type="button" onClick={state.step} disabled={!isHistoricalReplay || complete}>Próxima</ReplayControl>
          <ReplayControl type="button" onClick={() => {
            completionNotified.current = false;
            state.restart();
          }} disabled={!isHistoricalReplay}>Rever</ReplayControl>
          <ReplayControl type="button" onClick={state.skip} disabled={complete}>Pular</ReplayControl>
          <ReplayControl type="button" $selected={state.speed === 1} onClick={() => state.setSpeed(1)} aria-pressed={state.speed === 1}>1×</ReplayControl>
          <ReplayControl type="button" $selected={state.speed === 2} onClick={() => state.setSpeed(2)} aria-pressed={state.speed === 2}>2×</ReplayControl>
          <ReplayProgress>{visibleBeats.length} ações</ReplayProgress>
        </ReplayControls>
        {onReturnToMap && (complete || allowCloseBeforeComplete) &&
          <ReplayClose type="button" onClick={onReturnToMap} aria-label="Fechar combate" title="Fechar combate">
            <CloseIcon fontSize="small" />
          </ReplayClose>}
      </ReplayToolbar>
      <Combatants>
        <Combatant preview={preview} actor={preview.personagem} eventCount={state.resolvedEventCount}
          active={!complete && activeActorId === preview.personagem.id}
          result={complete && winner ? winner === preview.personagem.id ? 'win' : 'loss' : undefined}
          neon={neon === 'on'} fallbackImage={playerImage} speed={state.speed} onInspect={inspect} />
        <Versus aria-hidden="true">VS</Versus>
        <EnemyGroup>{(preview.oponentes?.length ? preview.oponentes : [preview.oponente]).map((enemy) =>
          <Combatant key={enemy.id} preview={preview} actor={enemy}
            eventCount={state.resolvedEventCount} active={!complete && activeActorId === enemy.id}
            enemy speed={state.speed} onInspect={inspect} />)}</EnemyGroup>
      </Combatants>
      {portrait && <Lightbox variant="portrait" isOpen images={[{ url: portrait.image, caption: portrait.name, backgroundUrl: portrait.image }]}
        onClose={() => { setPortrait(null); if (resumeAfterPortrait.current && !complete) state.setPlaying(true); }} />}
      {!complete && <CurrentEvent aria-live="polite"
        $criticalTone={state.rollingSequence === null && currentBeat?.action?.critical ? currentBeat.action.tone : undefined}>
        {recentBeats.length > 0 ? recentBeats.map((beat, index) => {
          const isCurrent = index === recentBeats.length - 1;
          const label = beat.phase === 'action' ? 'Ação'
            : beat.phase === 'initiative' ? 'Iniciativa'
              : beat.phase === 'end' ? 'Resultado' : 'Início';
          return <div key={beat.sequence} data-current={isCurrent}>
            <strong>{isCurrent ? label : `Anterior · ${label}`}</strong>
            <span><BeatText beat={beat} rolling={isCurrent && beat.sequence === state.rollingSequence}
              speed={state.speed} /></span>
          </div>;
        }) : 'Aguardando o primeiro movimento.'}
      </CurrentEvent>}
      {complete && <ReplayResult $win={winner === preview.personagem.id} $inconclusive={!winner} role="status">
        <span>{winnerText}</span>
        {!winner && savedBattle && !isHistoricalReplay && <small>
          Seus recursos foram preservados. Ajuste suas ações no mapa e tente novamente.
        </small>}
        {savedBattle && winner === preview.personagem.id && (preview.xpConcedido ?? 0) > 0 &&
          <ReplayXpGain amount={preview.xpConcedido ?? 0} levels={preview.niveisAlcancados ?? []}
            points={preview.pontosConcedidos} />}
        {savedBattle && winner === preview.personagem.id && (preview.moedaConcedida ?? 0) > 0 &&
          <span>+{preview.moedaConcedida} moedas</span>}
      </ReplayResult>}
      {complete && <EventList aria-label="Histórico completo da batalha">
        {visibleBeats.map((beat) => (
          <li key={beat.sequence} data-critical={beat.action?.critical ? beat.action.tone : undefined}>
            <span aria-hidden="true">•</span><BeatText beat={beat} />
          </li>
        ))}
      </EventList>}
      {state.error && <GameNotice $danger role="alert">{state.error}</GameNotice>}
      {!savedBattle && <ReplayActionRow>
        <CyberButton theme={theme} neon={neon} colorType="secondary" width="190px" text="Refazer treino" loading={state.loading} onClick={() => void state.load()} />
        <ReplayNote>O resultado é reproduzível pela seed desta run e não altera o personagem original.</ReplayNote>
      </ReplayActionRow>}
    </ReplayContent>
    </HolographicPreviewProvider>
  );
};
