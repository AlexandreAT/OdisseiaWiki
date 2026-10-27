import { Fragment } from 'react';
import type { BattleBeat } from './battlePresentation';
import { BattleSourceText } from './BattleSourceText';
import { InlineBattleDie } from './InlineBattleDie/InlineBattleDie';
import { ActionName, ActorName, AmmoRemaining, DamageText, OutcomeNumber, OutcomeText } from './BattleReplay.style';

export function BattleBeatText({ beat, rolling = false, speed = 1 }: {
  beat: BattleBeat; rolling?: boolean; speed?: 1 | 2;
}) {
  const action = beat.action;
  if (!action) return beat.actorName
    ? <><ActorName $enemy={!beat.playerActor}>{beat.actorName}</ActorName>
      <BattleSourceText text={beat.text.slice(beat.actorName.length)} sources={beat.sources} /></>
    : <BattleSourceText text={beat.text} sources={beat.sources} />;
  const conditions = beat.sources?.filter(source => source.kind === 'CONDICAO');
  return <>
    <ActorName $enemy={!action.playerActor}>{action.actor}</ActorName> {'— '}
    <ActionName><BattleSourceText text={action.name} sources={[action.source ?? { name: action.name, kind: 'ATAQUE' }]} /></ActionName>{': '}
    {action.advantageDice?.length ? <span aria-label="Rolagem com vantagem: dois dados, maior resultado">
      {action.advantageDice.map((die, index) => <InlineBattleDie key={index}
        value={die.value} rolling={rolling} speed={speed} selected={die.selected} />)}
    </span> : <InlineBattleDie value={action.die} rolling={rolling} speed={speed} />}
    {!rolling && <>
      <OutcomeText $tone={action.tone} $critical={action.critical}>{action.result}</OutcomeText>
      {' (D20 '}<OutcomeNumber $tone={action.tone} $critical={action.critical}>{action.die}</OutcomeNumber>
      {action.advantageDice?.length ? ', vantagem' : ''}{')'}
      {action.damage > 0 && <>
        {', '}<DamageText $tone={action.tone}>{action.damage} de dano</DamageText>
        {action.absorbed > 0 && ` (${action.absorbed} absorvido)`}
      </>}
      {action.blocked && `, dano bloqueado (${action.absorbed} absorvido)`}
      {action.resourceEffects.length > 0 && <> · {action.resourceEffects.map((effect, index) => <Fragment key={index}>
        {index > 0 && ', '}<BattleSourceText text={effect} sources={conditions} />
      </Fragment>)}</>}
      {action.conditions.length > 0 && <> · aplicou {action.conditions.map((condition, index) => <Fragment key={index}>
        {index > 0 && ', '}<BattleSourceText text={condition} sources={conditions} />
      </Fragment>)}</>}
      {action.ammoRemaining !== null && <AmmoRemaining> · Munição {action.ammoRemaining}</AmmoRemaining>}
      {'.'}
    </>}
  </>;
}
