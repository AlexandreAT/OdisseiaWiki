import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import type { GameplayEvent, GameplaySession } from '../../../models/Gameplay';
import type { MesaPersonagemResumo } from '../../../models/Mesa';
import { getGameplayEventOutcome } from '../../../utils/gameplayOutcome';
import { GameplayOutcomeValue } from '../../../components/Gameplay/GameplayOutcomeValue.style';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import {
  MesaGameActivityHeader,
  MesaGameActivityItem,
  MesaGameActivityList,
  MesaGameActivityMessage,
  MesaGameActivityMore,
  MesaGameActivityPanel,
} from './GameplayLiveHistory.style';

interface GameplayLiveHistoryProps {
  session: GameplaySession | null;
  mesaAoVivo: boolean;
  events: GameplayEvent[];
  characters: MesaPersonagemResumo[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  neon: boolean;
  onRefresh: () => void | Promise<unknown>;
  onLoadMore: () => void | Promise<unknown>;
}

const eventTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const eventTitle = (event: GameplayEvent) => {
  if (event.oculto) return 'Resultado oculto';
  return event.titulo || (event.manual ? 'Registro manual' : event.rolagem ? 'Rolagem de dado' : 'Evento da Mesa');
};

/** O servidor já remove dados privados dos eventos ocultos para cada participante. */
export const GameplayLiveHistory = ({
  session,
  mesaAoVivo,
  events,
  characters,
  loading,
  loadingMore,
  error,
  hasMore,
  neon,
  onRefresh,
  onLoadMore,
}: GameplayLiveHistoryProps) => {
  const names = new Map(characters.map((entry) => [
    entry.personagem.idpersonagemJogador,
    entry.personagem.nome,
  ]));

  return (
    <MesaGameActivityPanel $neon={neon} aria-label="Histórico da Mesa" as="aside">
      <MesaHudDecor neon={neon} />
      <MesaGameActivityHeader>
        <h2><HistoryOutlinedIcon aria-hidden="true" /> Histórico da Mesa</h2>
        <button
          type="button"
          aria-label="Atualizar histórico da Mesa"
          title="Atualizar histórico"
          disabled={loading}
          onClick={() => void onRefresh()}
        >
          <RefreshOutlinedIcon aria-hidden="true" />
        </button>
      </MesaGameActivityHeader>
      <MesaGameActivityList role="log" aria-live="polite" aria-relevant="additions">
        {loading && events.length === 0 && <MesaGameActivityMessage>Carregando histórico…</MesaGameActivityMessage>}
        {!loading && error && events.length === 0 && (
          <MesaGameActivityMessage $error>Não foi possível carregar o histórico. Tente atualizar.</MesaGameActivityMessage>
        )}
        {!loading && !error && !session && (
          <MesaGameActivityMessage>
            {mesaAoVivo
              ? 'A sessão de ações ainda não sincronizou.'
              : 'O histórico aparece quando a Mesa estiver ao vivo. Testes offline não são salvos.'}
          </MesaGameActivityMessage>
        )}
        {!loading && session && events.length === 0 && (
          <MesaGameActivityMessage>Nenhuma ação registrada nesta sessão.</MesaGameActivityMessage>
        )}
        {[...events].reverse().map((event) => {
          const values = event.oculto ? [] : event.rolagem?.grupos.flatMap((group) => group.valores) ?? [];
          const characterName = event.oculto || !event.idPersonagemJogador
            ? null
            : names.get(event.idPersonagemJogador);
          return (
            <MesaGameActivityItem key={event.idEvento} $hidden={event.oculto}>
              <header>
                <h3>{eventTitle(event)}</h3>
                <time dateTime={event.ocorreuEmUtc}>{eventTime(event.ocorreuEmUtc)}</time>
              </header>
              {event.oculto ? (
                <p>Detalhes reservados.</p>
              ) : (
                <>
                  {characterName && <small>{characterName}</small>}
                  {event.rolagem && (
                    <p>
                      {event.rolagem.expressao}
                      {values.length > 0 && ` · ${values.join(', ')}`}
                      {' → '}<GameplayOutcomeValue $tone={getGameplayEventOutcome(event)}>{event.rolagem.total}</GameplayOutcomeValue>
                    </p>
                  )}
                  {event.resultadoSemantico && <p>{event.resultadoSemantico}</p>}
                  {event.descricao && <p>{event.descricao}</p>}
                  {event.observacao && <p>{event.observacao}</p>}
                </>
              )}
            </MesaGameActivityItem>
          );
        })}
        {session && hasMore && (
          <MesaGameActivityMore type="button" disabled={loadingMore} onClick={() => void onLoadMore()}>
            {loadingMore ? 'Carregando…' : 'Carregar mais registros'}
          </MesaGameActivityMore>
        )}
      </MesaGameActivityList>
    </MesaGameActivityPanel>
  );
};
