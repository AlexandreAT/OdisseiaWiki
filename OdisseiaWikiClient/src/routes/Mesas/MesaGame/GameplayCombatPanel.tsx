import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import SkipNextOutlinedIcon from '@mui/icons-material/SkipNextOutlined';
import SortOutlinedIcon from '@mui/icons-material/SortOutlined';
import DragIndicatorOutlinedIcon from '@mui/icons-material/DragIndicatorOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { GameplayCombatParticipant, GameplayCombatSnapshot, GameplayRestCatalogItem } from '../../../models/GameplayCombat';
import type { MesaNpcCatalogo, MesaPersonagemResumo } from '../../../models/Mesa';
import type { AdicionarNpcCombatePayload } from '../../../services/gameplayCombatService';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import {
  CombatActions,
  CombatButton,
  CombatContent,
  CombatForm,
  CombatHeader,
  CombatList,
  CombatMessage,
  CombatPanel,
  CombatParticipant,
  ConditionChips,
  InitiativeValue,
  SelectionRow,
  RestSection,
} from './GameplayCombatPanel.style';

interface Props {
  combat: GameplayCombatSnapshot | null;
  characters: MesaPersonagemResumo[];
  isMaster: boolean;
  loading: boolean;
  submitting: boolean;
  error?: string | null;
  currentUserId: number;
  rests: GameplayRestCatalogItem[];
  neon: boolean;
  onStart: (ids: number[]) => Promise<unknown>;
  onAddNpc: (npc: AdicionarNpcCombatePayload) => Promise<unknown>;
  npcSearch: (term: string) => Promise<MesaNpcCatalogo[]>;
  onRemoveParticipant: (id: number) => Promise<unknown>;
  onRequestInitiative: (participant: GameplayCombatParticipant) => void;
  onActivate: (participantIds: number[]) => Promise<unknown>;
  onAdvance: () => Promise<unknown>;
  onEnd: () => Promise<unknown>;
  onApplyCondition: (participantId: number, conditionId: number, duration?: number, value?: number) => Promise<unknown>;
  onRemoveCondition: (conditionId: number) => Promise<unknown>;
  onRequestSurvival: (participant: GameplayCombatParticipant) => void;
  onApplyRest: (characterId: number, restId: number, revision: number, guardConfirmed: boolean) => Promise<unknown>;
}

const SortableParticipant = ({ id, disabled, children }: { id: number; disabled: boolean; children: (handle: ReactNode) => ReactNode }) => {
  const sortable = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };
  const handle = disabled ? null : (
    <CombatButton type="button" ref={sortable.setActivatorNodeRef} {...sortable.attributes} {...sortable.listeners} title="Arrastar para reordenar"><DragIndicatorOutlinedIcon /></CombatButton>
  );
  return <div ref={sortable.setNodeRef} style={style}>{children(handle)}</div>;
};

export const GameplayCombatPanel = ({
  combat, characters, isMaster, loading, submitting, error, currentUserId, rests, neon,
  onStart, onAddNpc, npcSearch, onRemoveParticipant, onRequestInitiative, onActivate, onAdvance, onEnd,
  onApplyCondition, onRemoveCondition, onRequestSurvival, onApplyRest,
}: Props) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [npcTerm, setNpcTerm] = useState('');
  const [npcOptions, setNpcOptions] = useState<MesaNpcCatalogo[]>([]);
  const [npcSelection, setNpcSelection] = useState('');
  const [npcModifier, setNpcModifier] = useState(0);
  const [conditionParticipant, setConditionParticipant] = useState<number | ''>('');
  const [conditionId, setConditionId] = useState<number | ''>('');
  const [conditionDuration, setConditionDuration] = useState('');
  const [conditionValue, setConditionValue] = useState('');
  const [restCharacterId, setRestCharacterId] = useState<number | ''>('');
  const [restId, setRestId] = useState<number | ''>('');
  const [guardConfirmed, setGuardConfirmed] = useState(false);
  const initiativeSignature = combat?.participantes
    .filter((participant) => participant.status !== 'Removido')
    .map((participant) => `${participant.idParticipante}:${participant.iniciativa ?? ''}`)
    .join('|') ?? '';
  const previousInitiativeSignature = useRef('');
  const knownCharacterIds = useRef<Set<number>>(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (combat) return;
    const currentIds = characters.map((entry) => entry.personagem.idpersonagemJogador);
    const addedIds = currentIds.filter((id) => !knownCharacterIds.current.has(id));
    knownCharacterIds.current = new Set(currentIds);
    if (addedIds.length > 0) {
      setSelected((current) => [...new Set([...current, ...addedIds])]);
    }
  }, [characters, combat]);

  const suggestedOrder = useMemo(() => combat?.participantes
    .filter((participant) => participant.status !== 'Removido')
    .sort((left, right) => (right.iniciativa ?? -9999) - (left.iniciativa ?? -9999) || left.nome.localeCompare(right.nome))
    .map((participant) => participant.idParticipante) ?? [], [combat?.participantes]);

  useEffect(() => {
    if (!combat || combat.status !== 'Preparacao') return;
    if (previousInitiativeSignature.current === initiativeSignature) return;
    previousInitiativeSignature.current = initiativeSignature;
    setOrder(suggestedOrder);
  }, [combat, initiativeSignature, suggestedOrder]);

  useEffect(() => {
    if (!combat || combat.status !== 'Preparacao') return;
    let active = true;
    const timer = window.setTimeout(() => {
      void npcSearch(npcTerm).then((items) => { if (active) setNpcOptions(items); }).catch(() => { if (active) setNpcOptions([]); });
    }, npcTerm ? 220 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [combat, npcSearch, npcTerm]);

  const orderedParticipants = combat
    ? order.map((id) => combat.participantes.find((participant) => participant.idParticipante === id)).filter(Boolean)
    : [];
  const restCharacters = characters.filter((entry) => isMaster || Number(entry.idUsuarioDono ?? entry.personagem.idusuario ?? 0) === currentUserId);
  const selectedRest = rests.find((rest) => rest.idSistemaDescansoConfig === Number(restId));
  const selectedRestCharacter = restCharacters.find((entry) => entry.personagem.idpersonagemJogador === Number(restCharacterId));
  const parsedConditionDuration = conditionDuration === '' ? undefined : Number(conditionDuration);
  const parsedConditionValue = conditionValue === '' ? undefined : Number(conditionValue);
  const invalidConditionOverride = (parsedConditionDuration !== undefined &&
    (!Number.isInteger(parsedConditionDuration) || parsedConditionDuration < 0)) ||
    (parsedConditionValue !== undefined && !Number.isFinite(parsedConditionValue));

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const from = current.indexOf(Number(active.id));
      const to = current.indexOf(Number(over.id));
      return from < 0 || to < 0 ? current : arrayMove(current, from, to);
    });
  };

  const selectedNpc = useMemo(() => {
    const [sourceId, variantId = ''] = npcSelection.split(':');
    const npc = npcOptions.find((item) => item.idPersonagem === Number(sourceId));
    return npc ? { npc, variantId: variantId || null } : null;
  }, [npcOptions, npcSelection]);

  return (
    <CombatPanel $neon={neon}>
      <MesaHudDecor neon={neon} />
      <CombatHeader>
        <div><h2><GroupsOutlinedIcon /> Turnos</h2><small>{combat?.status === 'Ativo' ? `Rodada ${combat.rodadaAtual}` : 'Iniciativa e condições'}</small></div>
      </CombatHeader>
      <CombatContent>
        {loading && !combat && <CombatMessage>Carregando combate…</CombatMessage>}
        {error && <CombatMessage $error>{error}</CombatMessage>}
        {rests.length > 0 && restCharacters.length > 0 && (
          <RestSection>
            <strong>Descanso</strong>
            <CombatForm>
              <select aria-label="Personagem do descanso" value={restCharacterId} onChange={(event) => setRestCharacterId(Number(event.target.value) || '')}>
                <option value="">Personagem</option>
                {restCharacters.map((entry) => <option key={entry.personagem.idpersonagemJogador} value={entry.personagem.idpersonagemJogador}>{entry.personagem.nome}</option>)}
              </select>
              <select aria-label="Tipo de descanso" value={restId} onChange={(event) => { setRestId(Number(event.target.value) || ''); setGuardConfirmed(false); }}>
                <option value="">Descanso</option>
                {rests.map((rest) => <option key={rest.idSistemaDescansoConfig} value={rest.idSistemaDescansoConfig}>{rest.nome}</option>)}
              </select>
              <CombatButton
                disabled={submitting || !selectedRestCharacter || !selectedRest || (selectedRest.exigeGuarda && !guardConfirmed)}
                onClick={() => selectedRestCharacter && selectedRest && void onApplyRest(
                  selectedRestCharacter.personagem.idpersonagemJogador,
                  selectedRest.idSistemaDescansoConfig,
                  selectedRestCharacter.personagem.revisaoRuntime ?? 0,
                  guardConfirmed,
                )}
              >Aplicar</CombatButton>
            </CombatForm>
            {selectedRest?.exigeGuarda && (
              <SelectionRow><input type="checkbox" checked={guardConfirmed} onChange={(event) => setGuardConfirmed(event.target.checked)} />Guarda confirmada pelo grupo</SelectionRow>
            )}
          </RestSection>
        )}
        {!combat && !loading && (
          isMaster ? (
            <>
              <CombatMessage>Escolha quem participará. Cada jogador receberá sua solicitação de iniciativa.</CombatMessage>
              {characters.map((entry) => {
                const id = entry.personagem.idpersonagemJogador;
                return <SelectionRow key={id}><input type="checkbox" checked={selected.includes(id)} onChange={() => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} />{entry.personagem.nome}</SelectionRow>;
              })}
              <CombatActions><CombatButton disabled={submitting || selected.length === 0} onClick={() => void onStart(selected)}>Preparar combate</CombatButton></CombatActions>
            </>
          ) : <CombatMessage>O mestre ainda não preparou um combate.</CombatMessage>
        )}

        {combat && (
          <>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <CombatList>
              {(combat.status === 'Preparacao' ? orderedParticipants : combat.participantes).map((participant) => participant && (
                <SortableParticipant key={participant.idParticipante} id={participant.idParticipante} disabled={!isMaster || combat.status !== 'Preparacao'}>
                  {(dragHandle) => <CombatParticipant $active={participant.idParticipante === combat.idParticipanteAtual}>
                  {participant.imagem ? <img src={participant.imagem} alt="" /> : <span className="combat-avatar">{participant.tipo === 'Npc' ? 'N' : 'P'}</span>}
                  <div>
                    <strong>{participant.nome}</strong>
                    <small>{participant.status === 'AguardandoIniciativa' ? 'Aguardando iniciativa' : participant.status}</small>
                    {combat.condicoes.some((condition) => condition.idParticipante === participant.idParticipante) && (
                      <ConditionChips>
                        {combat.condicoes.filter((condition) => condition.idParticipante === participant.idParticipante).map((condition) => (
                          isMaster
                            ? <button key={condition.idCondicaoAtiva} title={condition.regraRemocao ?? 'Remover condição'} onClick={() => void onRemoveCondition(condition.idCondicaoAtiva)}>{condition.nome}{condition.acumulos > 1 ? ` ×${condition.acumulos}` : ''}{condition.turnosRestantes != null ? ` · ${condition.turnosRestantes}t` : ''}</button>
                            : <span key={condition.idCondicaoAtiva}>{condition.nome}{condition.turnosRestantes != null ? ` · ${condition.turnosRestantes}t` : ''}</span>
                        ))}
                      </ConditionChips>
                    )}
                    {combat.cooldowns.some((cooldown) => cooldown.idParticipante === participant.idParticipante) && (
                      <ConditionChips>
                        {combat.cooldowns.filter((cooldown) => cooldown.idParticipante === participant.idParticipante).map((cooldown) => (
                          <span key={cooldown.idCooldown}>{cooldown.nome} · {cooldown.turnosRestantes}t</span>
                        ))}
                      </ConditionChips>
                    )}
                  </div>
                  <div>
                    {participant.podeRolarIniciativa ? <CombatButton disabled={submitting} onClick={() => onRequestInitiative(participant)}><CasinoOutlinedIcon /> Rolar</CombatButton> : <InitiativeValue>{participant.iniciativa ?? '—'}</InitiativeValue>}
                    {isMaster && combat.status === 'Preparacao' && <CombatActions>{dragHandle}<CombatButton $danger disabled={submitting} onClick={() => void onRemoveParticipant(participant.idParticipante)} title="Remover da ordem"><DeleteOutlineIcon /></CombatButton></CombatActions>}
                    {participant.status === 'ABeiraDaMorte' && participant.podeControlar && <CombatButton disabled={submitting} onClick={() => onRequestSurvival(participant)}>Sobrevivência</CombatButton>}
                  </div>
                  </CombatParticipant>}
                </SortableParticipant>
              ))}
                </CombatList>
              </SortableContext>
            </DndContext>

            {isMaster && combat.status === 'Preparacao' && (
              <>
                <CombatForm>
                  <input aria-label="Buscar NPC" placeholder="Buscar NPC" value={npcTerm} onChange={(event) => setNpcTerm(event.target.value)} />
                  <select aria-label="NPC encontrado" value={npcSelection} onChange={(event) => setNpcSelection(event.target.value)}>
                    <option value="">Selecione o NPC</option>
                    {npcOptions.flatMap((npc) => (npc.generico ? npc.variantes : [{ id: '', nome: npc.nome }]).map((variant) => (
                      <option key={`${npc.idPersonagem}:${variant.id}`} value={`${npc.idPersonagem}:${variant.id}`}>
                        {npc.nome}{npc.generico ? ` — ${variant.nome}` : ''}
                      </option>
                    )))}
                  </select>
                  <input aria-label="Modificador de iniciativa" type="number" value={npcModifier} onChange={(event) => setNpcModifier(Number(event.target.value))} />
                  <CombatButton disabled={submitting || !selectedNpc} onClick={() => selectedNpc && void onAddNpc({
                    nome: selectedNpc.variantId
                      ? `${selectedNpc.npc.nome} — ${selectedNpc.npc.variantes.find((item) => item.id === selectedNpc.variantId)?.nome ?? ''}`
                      : selectedNpc.npc.nome,
                    imagem: selectedNpc.npc.imagem,
                    modificadorIniciativa: npcModifier,
                    idPersonagemOrigem: selectedNpc.npc.idPersonagem,
                    idVarianteOrigem: selectedNpc.variantId,
                  }).then(() => { setNpcSelection(''); setNpcModifier(0); })}><PersonAddAltOutlinedIcon /> NPC</CombatButton>
                </CombatForm>
                <CombatActions>
                  <CombatButton disabled={submitting || order.length === 0} onClick={() => setOrder(suggestedOrder)}><SortOutlinedIcon /> Ordenar pela iniciativa</CombatButton>
                  <CombatButton disabled={submitting || order.length === 0} onClick={() => void onActivate(order)}>Confirmar ordem</CombatButton>
                </CombatActions>
              </>
            )}

            {isMaster && combat.status === 'Ativo' && (
              <>
                {combat.catalogoCondicoes.length > 0 && (
                  <CombatForm>
                    <select aria-label="Participante da condição" value={conditionParticipant} onChange={(event) => setConditionParticipant(Number(event.target.value) || '')}>
                      <option value="">Participante</option>
                      {combat.participantes.map((participant) => <option key={participant.idParticipante} value={participant.idParticipante}>{participant.nome}</option>)}
                    </select>
                    <select
                      aria-label="Condição"
                      value={conditionId}
                      onChange={(event) => {
                        const nextId = Number(event.target.value) || '';
                        const condition = combat.catalogoCondicoes.find((entry) => entry.idSistemaCondicao === Number(nextId));
                        setConditionId(nextId);
                        setConditionDuration(condition?.duracaoPadrao == null ? '' : String(condition.duracaoPadrao));
                        setConditionValue(condition?.valorPadrao == null ? '' : String(condition.valorPadrao));
                      }}
                    >
                      <option value="">Condição</option>
                      {combat.catalogoCondicoes.map((condition) => <option key={condition.idSistemaCondicao} value={condition.idSistemaCondicao}>{condition.nome}</option>)}
                    </select>
                    <input
                      aria-label="Duração da condição"
                      title="Duração da condição"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Duração padrão"
                      value={conditionDuration}
                      onChange={(event) => setConditionDuration(event.target.value)}
                    />
                    <input
                      aria-label="Valor da condição"
                      title="Valor da condição"
                      type="number"
                      step="any"
                      placeholder="Valor padrão"
                      value={conditionValue}
                      onChange={(event) => setConditionValue(event.target.value)}
                    />
                    <CombatButton
                      disabled={submitting || !conditionParticipant || !conditionId || invalidConditionOverride}
                      onClick={() => void onApplyCondition(
                        Number(conditionParticipant),
                        Number(conditionId),
                        parsedConditionDuration,
                        parsedConditionValue,
                      )}
                    >Aplicar</CombatButton>
                  </CombatForm>
                )}
                <CombatActions>
                  <CombatButton disabled={submitting} onClick={() => void onAdvance()}><SkipNextOutlinedIcon /> Próximo turno</CombatButton>
                  <CombatButton $danger disabled={submitting} onClick={() => void onEnd()}>Encerrar</CombatButton>
                </CombatActions>
              </>
            )}
          </>
        )}
      </CombatContent>
    </CombatPanel>
  );
};
