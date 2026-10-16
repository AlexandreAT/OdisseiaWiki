import { useLayoutEffect, useRef, useState } from 'react';
import type { GameRunEncounterSetup } from '../../../models/GameRun';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { TargetActions, TargetBoard, TargetCard, TargetColumn, TargetLines, TargetSelectionIntro } from './RunTargetSelection.style';

interface Props {
  setup: GameRunEncounterSetup;
  theme: 'light' | 'dark';
  neon: 'on' | 'off';
  busy: boolean;
  onStart: (targets: { actorId: string; targetId: string }[]) => void;
}

export function RunTargetSelection({ setup, theme, neon, busy, onStart }: Props) {
  const [activeAlly, setActiveAlly] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [hoveredAlly, setHoveredAlly] = useState<string | null>(null);
  const [lines, setLines] = useState<{ ally: string; color: string; x1: number; y1: number; x2: number; y2: number }[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLButtonElement>());

  useLayoutEffect(() => {
    const update = () => {
      const origin = board.current?.getBoundingClientRect();
      if (!origin) return;
      setLines(Object.entries(targets).flatMap(([ally, enemy]) => {
        const source = cards.current.get(ally)?.getBoundingClientRect();
        const destination = cards.current.get(enemy)?.getBoundingClientRect();
        return source && destination ? [{ ally,
          color: getComputedStyle(cards.current.get(ally)!).borderRightColor,
          x1: source.right - origin.left,
          y1: source.top + source.height / 2 - origin.top,
          x2: destination.left - origin.left,
          y2: destination.top + destination.height / 2 - origin.top }] : [];
      }));
    };
    update();
    const observer = new ResizeObserver(update);
    if (board.current) observer.observe(board.current);
    cards.current.forEach((card) => observer.observe(card));
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [targets, setup]);

  const renderCard = (actor: GameRunEncounterSetup['equipe'][number], enemy: boolean) => {
    const image = normalizeImagePath(actor.imagem ?? undefined);
    const linked = enemy ? Object.values(targets).includes(actor.id) : Boolean(targets[actor.id]);
    const highlighted = hoveredAlly !== null && (enemy
      ? targets[hoveredAlly] === actor.id : hoveredAlly === actor.id);
    return <TargetCard key={actor.id} type="button" $enemy={enemy}
      $chosen={linked || activeAlly === actor.id} $highlight={highlighted}
      ref={(element) => { if (element) cards.current.set(actor.id, element); else cards.current.delete(actor.id); }}
      onClick={() => {
        if (!enemy) { setActiveAlly(actor.id); return; }
        if (!activeAlly) return;
        setTargets((current) => ({ ...current, [activeAlly]: actor.id }));
        setActiveAlly(null);
      }} aria-pressed={linked}>
      {image ? <img src={image} alt="" /> : <span className="target-avatar" aria-hidden="true">{actor.nome[0]}</span>}
      <strong>{actor.nome}</strong>
    </TargetCard>;
  };

  return <>
    <TargetSelectionIntro>Selecione um aliado e depois o alvo. Se ele cair, o próximo inimigo vivo assume.</TargetSelectionIntro>
    <TargetBoard ref={board}>
      <TargetColumn><h3>Sua equipe</h3>{setup.equipe.map((actor) => renderCard(actor, false))}</TargetColumn>
      <TargetColumn><h3>Inimigos</h3>{setup.oponentes.map((actor) => renderCard(actor, true))}</TargetColumn>
      <TargetLines aria-hidden="true">
        {lines.map((line) => <g key={line.ally} onMouseEnter={() => setHoveredAlly(line.ally)}
          onMouseLeave={() => setHoveredAlly(null)}>
          <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke={line.color} strokeWidth="2" />
          <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
            stroke="transparent" strokeWidth="16" pointerEvents="stroke" />
        </g>)}
      </TargetLines>
    </TargetBoard>
    <TargetActions><CyberButton theme={theme} neon={neon} text="Iniciar combate"
      width="180px" loading={busy} disabled={busy || setup.equipe.some((actor) => !targets[actor.id])}
      onClick={() => onStart(Object.entries(targets).map(([actorId, targetId]) => ({ actorId, targetId })))} />
    </TargetActions>
  </>;
}
