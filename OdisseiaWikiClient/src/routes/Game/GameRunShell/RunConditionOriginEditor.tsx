import { useEffect, useState } from 'react';
import { getSystemOptionDescription } from '../../../content/systemOptionHelp';
import type { GameRunConditionOriginRequest } from '../../../models/GameRun';
import type { SistemaCondicao } from '../../../models/SistemaRpg';
import { obterConfiguracaoCriacaoSistemaRpg, obterConfiguracaoSobrevivenciaSistemaRpg } from '../../../services/sistemasRpgService';
import { editableConditionEffects } from '../../../utils/conditionEffectOverrides';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { GameHint } from '../GameShared.style';
import type { RunConditionOrigin, RunInventoryEntry } from './runInventoryEntries';
import { ConditionOriginCard, ConditionOriginFields } from './RunLoadout.style';

type OriginChange = Omit<GameRunConditionOriginRequest, 'revisaoEsperada' | 'chaveIdempotencia'>;

export function RunConditionOriginEditor({ entry, condition, systemVersionId, disabled, busy, theme, neon, onSave, results = [] }: {
  entry: RunInventoryEntry;
  condition: RunConditionOrigin;
  systemVersionId: number;
  disabled: boolean;
  busy: boolean;
  theme: 'light' | 'dark';
  neon: 'on' | 'off';
  onSave: (origin: OriginChange) => Promise<boolean>;
  results?: { value: string; label: string }[];
}) {
  const [draft, setDraft] = useState(condition);
  const [naturalText, setNaturalText] = useState((condition.resultadosNaturais ?? []).join(', '));
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rule, setRule] = useState<SistemaCondicao | undefined>();
  const [attributes, setAttributes] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    let active = true;
    void Promise.all([obterConfiguracaoSobrevivenciaSistemaRpg(systemVersionId),
      obterConfiguracaoCriacaoSistemaRpg(systemVersionId)]).then(([survival, creation]) => {
      if (!active) return;
      setRule(survival.condicoes.find((entry) => entry.codigo === condition.codigo));
      setAttributes(creation.atributos.filter((attribute) => attribute.ativo).map((attribute) => ({
        value: attribute.codigo, label: attribute.nome || attribute.codigo,
      })));
    }).catch(() => { if (active) { setRule(undefined); setAttributes([]); } });
    return () => { active = false; };
  }, [condition.codigo, systemVersionId]);
  const natural = draft.gatilho === 'RESULTADO_NATURAL';
  const defaultTarget = entry.subtype === 'consumiveis' ||
    entry.subtype === 'outro' && entry.damageByRange.base === 0 ? 'USUARIO' : 'ALVO';
  const naturalTokens = naturalText.split(',').map((part) => part.trim()).filter(Boolean);
  const naturalResults = naturalTokens.map(Number);
  const update = (change: Partial<RunConditionOrigin>) => setDraft((current) => ({ ...current, ...change }));
  const number = (value: string) => value === '' ? undefined : Number(value);
  const save = async () => {
    if (natural && naturalResults.some((value) => !Number.isInteger(value) || value < 1 || value > 20)) {
      setMessage('Use apenas resultados inteiros de 1 a 20.'); return;
    }
    if (draft.gatilho === 'RESULTADO_CLASSIFICADO' && !draft.codigoResultado?.trim()) {
      setMessage('Escolha o código de um resultado publicado pelo Sistema.'); return;
    }
    if (natural && !draft.resultadoNaturalMinimo && !draft.resultadoNaturalMaximo &&
      naturalResults.length === 0) {
      setMessage('Informe um resultado natural ou um intervalo do D20.'); return;
    }
    if (draft.resultadoNaturalMinimo && draft.resultadoNaturalMaximo &&
      draft.resultadoNaturalMinimo > draft.resultadoNaturalMaximo) {
      setMessage('O início do intervalo deve ser menor que o fim.'); return;
    }
    if (draft.testeResistencia && (draft.testeResistencia.dados < 1 ||
      draft.testeResistencia.faces < 2 || !attributes.some((attribute) =>
        attribute.value.toUpperCase() === draft.testeResistencia?.atributo.toUpperCase()))) {
      setMessage('Escolha dados e um atributo válido do Sistema para o teste de reação.'); return;
    }
    const ok = await onSave({
      tipo: entry.tipo, idInstancia: entry.idInstancia, indice: condition.index,
      codigo: condition.codigo, gatilho: draft.gatilho ?? 'ACERTO',
      codigoResultado: draft.gatilho === 'RESULTADO_CLASSIFICADO' ? draft.codigoResultado?.trim() : null,
      alvo: draft.alvo ?? defaultTarget,
      valor: draft.valor ?? null, duracao: draft.duracao ?? null,
      valoresEfeitos: draft.valoresEfeitos ?? {},
      testeResistencia: draft.testeResistencia ?? null,
      unidadeDuracao: draft.unidadeDuracao ?? null,
      resultadoNaturalMinimo: natural ? draft.resultadoNaturalMinimo ?? null : null,
      resultadoNaturalMaximo: natural ? draft.resultadoNaturalMaximo ?? null : null,
      resultadosNaturais: natural ? naturalResults : [],
    });
    if (ok) { setMessage('Condição salva nesta cópia da run.'); setOpen(false); }
  };
  return <ConditionOriginCard>
    <button type="button" aria-expanded={open} onClick={() => { setOpen(!open); setMessage(''); }}>
      <span>Condição · {condition.name}</span><strong>{open ? 'Fechar' : 'Configurar'}</strong>
    </button>
    {open && <ConditionOriginFields>
      <GameHint>Estes ajustes pertencem só a esta cópia da run. A regra do Sistema continua a definir os efeitos.</GameHint>
      <label>Aplicar quando
        <select value={draft.gatilho ?? 'ACERTO'} disabled={disabled} onChange={(event) => update({
          gatilho: event.target.value as RunConditionOrigin['gatilho'],
        })}>
          <option value="ACERTO" title={getSystemOptionDescription('conditionTrigger', 'ACERTO')}>Acertar</option>
          <option value="RESULTADO_NATURAL" title={getSystemOptionDescription('conditionTrigger', 'RESULTADO_NATURAL')}>Resultado natural do D20</option>
          <option value="RESULTADO_CLASSIFICADO" title={getSystemOptionDescription('conditionTrigger', 'RESULTADO_CLASSIFICADO')}>Resultado classificado pelo Sistema</option>
          <option value="AO_USAR" title={getSystemOptionDescription('conditionTrigger', 'AO_USAR')}>Usar ação ou item</option>
          {entry.tipo === 'ITEM' && (entry.subtype === 'traje' || entry.subtype === 'outro') &&
            <option value="AO_EQUIPAR" title={getSystemOptionDescription('conditionTrigger', 'AO_EQUIPAR')}>Equipar</option>}
        </select>
      </label>
      {draft.gatilho === 'RESULTADO_CLASSIFICADO' && <label>Resultado publicado
        {results.length ? <select value={draft.codigoResultado ?? ''} disabled={disabled}
          onChange={(event) => update({ codigoResultado: event.target.value })}>
          <option value="">Selecione</option>{results.map((result) => <option key={result.value}
            value={result.value}>{result.label}</option>)}
        </select> : <input type="text" value={draft.codigoResultado ?? ''} disabled={disabled}
          placeholder="Código do resultado" onChange={(event) => update({ codigoResultado: event.target.value })} />}
      </label>}
      <label>Quem recebe
        <select value={draft.alvo ?? defaultTarget} disabled={disabled}
          onChange={(event) => update({ alvo: event.target.value as RunConditionOrigin['alvo'] })}>
          <option value="ALVO" title={getSystemOptionDescription('conditionTarget', 'ALVO')}>Alvo da ação</option>
          <option value="USUARIO" title={getSystemOptionDescription('conditionTarget', 'USUARIO')}>Quem usa</option>
          <option value="TODOS_INIMIGOS" title={getSystemOptionDescription('conditionTarget', 'TODOS_INIMIGOS')}>Todos os inimigos</option>
        </select>
      </label>
      <CyberButton theme={theme} neon={neon} colorType="secondary" width="100%" height="38px"
        disabled={disabled} text={draft.testeResistencia ? 'Remover teste de reação' : 'Exigir teste de reação'}
        onClick={() => update({ testeResistencia: draft.testeResistencia ? undefined : {
          dados: 1, faces: 6, atributo: attributes[0]?.value ?? '', dificuldade: 4,
        } })} />
      {draft.testeResistencia && <>
        <GameHint>Quem alcançar a dificuldade evita a condição, sem gastar o próprio turno.</GameHint>
        <ConditionOriginFields $columns={2}>
          <label>Dados <input type="number" min={1} max={10} value={draft.testeResistencia.dados}
            disabled={disabled} onChange={(event) => update({ testeResistencia: {
              ...draft.testeResistencia!, dados: Number(event.target.value),
            } })} /></label>
          <label>Faces <input type="number" min={2} max={1000} value={draft.testeResistencia.faces}
            disabled={disabled} onChange={(event) => update({ testeResistencia: {
              ...draft.testeResistencia!, faces: Number(event.target.value),
            } })} /></label>
          <label>Atributo do afetado <select value={draft.testeResistencia.atributo}
            disabled={disabled} onChange={(event) => update({ testeResistencia: {
              ...draft.testeResistencia!, atributo: event.target.value,
            } })}>
            <option value="">Selecione</option>{attributes.map((attribute) => <option key={attribute.value}
              value={attribute.value}>{attribute.label}</option>)}
          </select></label>
          <label>Passa com total ≥ <input type="number" value={draft.testeResistencia.dificuldade}
            disabled={disabled} onChange={(event) => update({ testeResistencia: {
              ...draft.testeResistencia!, dificuldade: Number(event.target.value),
            } })} /></label>
        </ConditionOriginFields>
      </>}
      {natural && <ConditionOriginFields $columns={2}>
        <label>D20 de <input type="number" min={1} max={20} value={draft.resultadoNaturalMinimo ?? ''}
          disabled={disabled} onChange={(event) => update({ resultadoNaturalMinimo: number(event.target.value) })} /></label>
        <label>Até <input type="number" min={1} max={20} value={draft.resultadoNaturalMaximo ?? ''}
          disabled={disabled} onChange={(event) => update({ resultadoNaturalMaximo: number(event.target.value) })} /></label>
        <label style={{ gridColumn: '1 / -1' }}>Resultados isolados (opcional, separados por vírgula)
          <input type="text" value={naturalText} disabled={disabled}
            placeholder="Ex.: 19, 20"
            onChange={(event) => setNaturalText(event.target.value)} />
        </label>
      </ConditionOriginFields>}
      <ConditionOriginFields $columns={2}>
        {(draft.valor !== undefined || editableConditionEffects(rule).length === 0) &&
        <label>Valor do primeiro efeito <input type="number" min={-1000000} max={1000000} value={draft.valor ?? ''}
          placeholder="Padrão do Sistema" disabled={disabled} onChange={(event) => update({ valor: number(event.target.value) })} /></label>
        }
        <label>Duração <input type="number" min={1} max={1000000} value={draft.duracao ?? ''}
          placeholder="Padrão do Sistema" disabled={disabled} onChange={(event) => update({ duracao: number(event.target.value) })} /></label>
      </ConditionOriginFields>
      {editableConditionEffects(rule).map((effect) => <label key={effect.index}>
        {effect.label} · padrão {effect.value}{effect.percentage ? '%' : ''}
        <input type="number" min={effect.minimum ?? (effect.signed ? effect.percentage ? -100 : -1000000 : 0)}
          max={effect.maximum ?? (effect.percentage ? effect.signed ? 1000 : 100 : 1000000)}
          value={draft.valoresEfeitos?.[effect.index] ?? ''} disabled={disabled}
          placeholder="Padrão do Sistema" onChange={(event) => {
            const values = { ...draft.valoresEfeitos };
            if (event.target.value === '') delete values[effect.index];
            else values[effect.index] = Number(event.target.value);
            update({ valoresEfeitos: values });
          }} />
      </label>)}
      <label>Unidade da duração
        <select value={draft.unidadeDuracao ?? ''} disabled={disabled}
          onChange={(event) => update({ unidadeDuracao: event.target.value as RunConditionOrigin['unidadeDuracao'] || undefined })}>
          <option value="">Padrão do Sistema</option>
          <option value="Turno" title={getSystemOptionDescription('durationUnit', 'Turno')}>Turnos</option>
          <option value="Hora" title={getSystemOptionDescription('durationUnit', 'Hora')}>Horas de jogo</option>
        </select>
      </label>
      {message && <GameHint role="status">{message}</GameHint>}
      <CyberButton theme={theme} neon={neon} width="100%" height="38px" text="Salvar condição"
        loading={busy} disabled={disabled || busy} onClick={() => void save()} />
    </ConditionOriginFields>}
  </ConditionOriginCard>;
}
