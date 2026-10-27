import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import type { GameAttributeOptions, GameRunDto } from '../../../models/GameRun';
import { getGameRun, getGameRunAttributes, upgradeGameRunAttribute } from '../../../services/gameRunService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { AttributeGrid, AttributePopover, RewardsBody } from './RunRewards.style';
import { GameHint } from '../GameShared.style';
import { HolographicPreviewProvider, HolographicPreviewTrigger } from '../../../components/Generic/HolographicPreview';
import { RunAttributeInfluences } from './RunAttributeInfluences';
import { attributeAbbreviation, signedAttributeValue } from './runAttributePresentation';

const resourceName: Record<string, string> = { vida: 'Vida', mana: 'Mana', estamina: 'Estamina' };

export function RunAttributeModal({ run, theme, neon, onUpdate, onClose }: {
  run: GameRunDto; theme: 'dark' | 'light'; neon: 'on' | 'off';
  onUpdate: (run: GameRunDto) => void; onClose: () => void;
}) {
  const [options, setOptions] = useState<GameAttributeOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<{ code: string; top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const pending = useRef<{ codigo: string; revisaoEsperada: number; chaveIdempotencia: string } | null>(null);
  useEffect(() => {
    let active = true;
    void getGameRunAttributes(run.idGameRun).then((value) => { if (active) setOptions(value); })
      .catch((reason: unknown) => { if (active) setError(getApiErrorMessage(reason, 'Não foi possível carregar a evolução.')); });
    return () => { active = false; };
  }, [run.idGameRun, run.revisao]);
  useEffect(() => {
    if (!info) return;
    const dismiss = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node) &&
          !(event.target as Element).closest?.('.attribute-info')) setInfo(null);
    };
    const close = () => setInfo(null);
    document.addEventListener('pointerdown', dismiss);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [info]);
  const upgrade = async (codigo: string) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(null);
    const request = pending.current?.codigo === codigo && pending.current.revisaoEsperada === run.revisao
      ? pending.current : { codigo, revisaoEsperada: run.revisao, chaveIdempotencia: crypto.randomUUID() };
    pending.current = request;
    try { const updated = await upgradeGameRunAttribute(run.idGameRun, request); onUpdate(updated); setInfo(null);
      setOptions(await getGameRunAttributes(run.idGameRun)); pending.current = null;
    } catch (reason: unknown) {
      setError(getApiErrorMessage(reason, 'Não foi possível evoluir o atributo.'));
      try { onUpdate(await getGameRun(run.idGameRun)); } catch { /* Preserve the current screen for retry. */ }
    } finally { inFlight.current = false; setBusy(false); }
  };
  return <Modal title="Evoluir atributos" theme={theme} neon={neon} width="720px" showFooter={false}
    onClose={() => { if (!busy) onClose(); }}>
    <HolographicPreviewProvider key={run.revisao} neon={neon === 'on'}><RewardsBody>
      {error && <p role="alert">{error}</p>}
      {!options ? <LoadingIndicator label="Consultando atributos" /> : <>
        <p className="points" aria-live="polite">{options.pontos} {options.pontos === 1 ? 'ponto disponível' : 'pontos disponíveis'} · +1 por escolha</p>
        {options.atributos.filter((attribute) => attribute.grupo === 'principais')
          .every((attribute) => attribute.recursos.length === 0) &&
          <GameHint role="status">A versão #{run.idSistemaVersao} desta run não configura aumento de vida, mana ou estamina por atributo. Os pontos ainda alteram os testes que usam o atributo. Para habilitar esses bônus, configure as influências em Sistema &gt; Progressão e publique uma nova versão; runs existentes permanecem na versão original.</GameHint>}
        {['principais', 'secundarios'].map((group) => <section key={group}>
          <h3>{group === 'principais' ? 'Principais' : 'Secundários'}</h3>
          <AttributeGrid>{options.atributos.filter((attribute) => attribute.grupo === group).map((attribute) =>
            <div className="attribute-tile" key={attribute.codigo}>
              <div className="attribute-hex" aria-label={`${attribute.nome}: ${attribute.valor}`}>
                <span className="attribute-code">{attributeAbbreviation(attribute.nome)}</span>
                <span className="attribute-value" style={{ '--attribute-number-units': String(attribute.valor).length * .5 +
                  Math.max(1.6, signedAttributeValue(attribute.modificador ?? 0).length * .5 + .4) } as CSSProperties}>
                  <span className="attribute-natural">{attribute.valor}</span>
                  {(attribute.influencias?.length ?? 0) > 0 && <HolographicPreviewTrigger className="attribute-modifier"
                    data-negative={(attribute.modificador ?? 0) < 0}
                    aria-label={`Modificadores de ${attribute.nome}: ${signedAttributeValue(attribute.modificador ?? 0)}`}
                    media={{ name: attribute.nome, content: <RunAttributeInfluences sources={attribute.influencias ?? []} code={attribute.codigo} group={attribute.grupo} /> }}
                    appearance={{ size: 420 }}>
                    {signedAttributeValue(attribute.modificador ?? 0)}
                  </HolographicPreviewTrigger>}
                  {options.pontos > 0 && attribute.valor < attribute.limite &&
                    <button className="attribute-up" type="button" disabled={busy}
                      aria-label={`Aumentar ${attribute.nome}`} onClick={() => void upgrade(attribute.codigo)}>
                      <UpgradeIcon fontSize="small" />
                    </button>}
                </span>
              </div>
              <button className="attribute-info" type="button" aria-label={`Informações de ${attribute.nome}`}
                aria-expanded={info?.code === attribute.codigo}
                onClick={(event) => {
                  if (info?.code === attribute.codigo) { setInfo(null); return; }
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setInfo({ code: attribute.codigo, top: Math.min(bounds.bottom + 5, window.innerHeight - 305),
                    left: Math.max(12, Math.min(bounds.left - 135, window.innerWidth - 322)) });
                }}><InfoOutlinedIcon fontSize="small" /></button>
            </div>)}</AttributeGrid>
        </section>)}
        {info && createPortal((() => {
          const attribute = options.atributos.find((item) => item.codigo === info.code);
          if (!attribute) return null;
          return <AttributePopover ref={popoverRef} role="dialog" aria-label={`Informações de ${attribute.nome}`}
            $top={Math.max(12, info.top)} $left={info.left}>
            <h4>{attribute.nome}</h4>
            <p>Limite do Sistema: {attribute.limite}</p>
            {attribute.descricao && <p>{attribute.descricao}</p>}
            <p>O novo valor entra nos testes que usam este atributo pela regra publicada.</p>
            {attribute.recursos.length === 0 ? <p>Nenhuma influência em recursos configurada nesta versão do Sistema.</p>
              : attribute.recursos.map((resource) => <p key={resource.recurso}>
                {resourceName[resource.recurso] ?? resource.recurso} máxima atual: {resource.antes} + {resource.percentual}% = <strong>{resource.depois}</strong>. O valor corrente não é recuperado.
              </p>)}
          </AttributePopover>;
        })(), document.body)}
      </>}
    </RewardsBody></HolographicPreviewProvider>
  </Modal>;
}
