import { useEffect, useRef, useState } from 'react';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { Select } from '../../../components/Generic/Select/Select';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { HelpHeading } from '../../../components/Generic/HelpHeading/HelpHeading';
import { gameConfigurationHelp as help } from '../../../content/gameConfigurationHelp';
import type { GameModeAreaOption, GameModeVendorOffer } from '../../../models/GameModeManagement';
import type { GameplayConditionEffectConfig } from '../../../models/Itens';
import type { GameplayTestSpec } from '../../../models/Gameplay';
import { obterConfiguracaoCombateSistemaRpg, obterConfiguracaoSobrevivenciaSistemaRpg, obterConfiguracaoCriacaoSistemaRpg } from '../../../services/sistemasRpgService';
import { buildSistemaItemFormCatalog, type SistemaItemFormCatalog } from '../../../utils/systemItemFormCatalog';
import { saveAsset } from '../../../services/assetsService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { ConditionEffectFields, TestSpecificationFields } from '../ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/MapItensForm';
import { ManagementGameVendorOffers } from './ManagementGameVendorOffers';
import { GameAdminActions, GameAdminFields, GameAdminHint } from './ManagementGame.style';
import { Offers, OfferRow, OfferRowHeader, OfferExpansion, VendorCatalogTrigger } from './ManagementGameVendorOffers/ManagementGameVendorOffers.style';

interface Props {
  option: GameModeAreaOption; onChange: (value: GameModeAreaOption) => void;
  theme: 'dark' | 'light'; neon: 'on' | 'off'; editable: boolean; mesaId?: number; systemVersionId: number;
}

export function ManagementGameNpcServices({ option, onChange, theme, neon, editable, mesaId, systemVersionId }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<SistemaItemFormCatalog>();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const latest = useRef({ option, onChange });
  latest.current = { option, onChange };
  const sage = option.npcType === 'SABIO';
  useEffect(() => {
    if (!open || !sage) return;
    const controller = new AbortController();
    setLoading(true); setError(null); setCatalog(undefined);
    Promise.all([obterConfiguracaoCombateSistemaRpg(systemVersionId, { signal: controller.signal }),
      obterConfiguracaoSobrevivenciaSistemaRpg(systemVersionId, { signal: controller.signal }),
      obterConfiguracaoCriacaoSistemaRpg(systemVersionId, { signal: controller.signal })])
      .then(([combat, survival, creation]) => {
        if (!controller.signal.aborted) setCatalog(buildSistemaItemFormCatalog('outro', {}, [],
          combat.resultadosDado, survival.condicoes, creation.atributos));
      }).catch(reason => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason, 'Não foi possível carregar as regras do Sistema.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, sage, systemVersionId]);
  const offers = option.offers ?? [];
  const update = (id: string, patch: Partial<GameModeVendorOffer>) => onChange({ ...option,
    offers: offers.map(offer => offer.itemId === id ? { ...offer, ...patch } : offer) });
  const upgrade = option.upgrade ?? { damage: 0, price: 0, maxUpgrades: 0 };
  return <>
    <VendorCatalogTrigger type="button" onClick={() => setOpen(true)} $neon={neon === 'on'} aria-haspopup="dialog">
      <AutoFixHighIcon aria-hidden /><span><strong>{sage ? 'Magias para ensinar' : 'Oficina do Engenheiro'}</strong>
        <small>{sage ? `${offers.length} magias · até ${option.offerCount ?? 3} por visita` : `+${upgrade.damage} dano · ${offers.length} próteses elegíveis`}</small></span><ExpandMoreIcon aria-hidden />
    </VendorCatalogTrigger>
    {open && <Modal title={sage ? 'Magias do Sábio' : 'Oficina do Engenheiro'} width="900px" theme={theme} neon={neon}
      showFooter={false} onClose={() => { if (!uploading) setOpen(false); }}>
      <Offers>
      {error && <p role="alert">{error}</p>}
      {(loading || uploading) && <LoadingIndicator compact label={uploading ? 'Enviando imagem' : 'Carregando regras'} />}
      {sage ? <>
        <Select label="Ofertas por visita" theme={theme} neon={neon} width="100%" value={option.offerCount ?? 3}
          help={help.offerCount} options={[3, 6, 9].map(value => ({ value, label: `${value} magias` }))}
          disabled={!editable} onChange={event => onChange({ ...option, offerCount: Number(event.target.value) })} />
        <GameAdminHint>Ensina uma cópia para esta jornada, sem equipar automaticamente. O limite de magias vem do Sistema.</GameAdminHint>
        <CyberButton text="Criar magia" theme={theme} neon={neon} width="200px" disabled={!editable || loading || !catalog || offers.length >= 30}
          onClick={() => { const id = crypto.randomUUID(); onChange({ ...option, offers: [...offers, {
            itemId: id, price: 0, stock: 1, weight: 1, minLevel: 1,
            snapshot: { nome: 'Nova magia', tipo: 'ataque', atributos: { dano: 0, custoMana: 0, custoEstamina: 0,
              limiteAtaquesPorTurno: 1, teste: { codigoTeste: 'ATAQUE_COMUM', usaTotalParaFaixas: true } } },
          }] }); setExpanded(id); }} />
        {offers.map(offer => {
          const spell = offer.snapshot ?? { nome: '', tipo: 'ataque' };
          const attributes = spell.atributos ?? {};
          const setAttributes = (patch: Record<string, unknown>) => update(offer.itemId, { snapshot: { ...spell, atributos: { ...attributes, ...patch } } });
          return <OfferRow key={offer.itemId}>
            <OfferRowHeader><button type="button" aria-expanded={expanded === offer.itemId}
              onClick={() => setExpanded(expanded === offer.itemId ? null : offer.itemId)}>
              <AutoFixHighIcon aria-hidden /><span><strong>{spell.nome}</strong><small>{offer.price} moedas · peso {offer.weight ?? 1}</small></span><ExpandMoreIcon aria-hidden />
            </button><button type="button" disabled={!editable || uploading} aria-label={`Remover ${spell.nome}`}
              onClick={() => onChange({ ...option, offers: offers.filter(entry => entry.itemId !== offer.itemId) })}>×</button></OfferRowHeader>
            <OfferExpansion $expanded={expanded === offer.itemId}><div><fieldset disabled={!editable || expanded !== offer.itemId || uploading || !catalog}>
              <Offers><GameAdminFields>
                <InputText label="Nome" width="100%" theme={theme} neon={neon} value={spell.nome}
                  onChange={event => update(offer.itemId, { snapshot: { ...spell, nome: event.target.value } })} />
                <Select label="Tipo" width="100%" theme={theme} neon={neon} value={spell.tipo}
                  options={[{ value: 'ataque', label: 'Ataque' }, { value: 'suporte', label: 'Suporte' }]}
                  onChange={event => update(offer.itemId, { snapshot: { ...spell, tipo: event.target.value,
                    atributos: { ...attributes, ...(event.target.value === 'suporte' ? { dano: 0, teste: undefined, acerto: undefined }
                      : { recuperacaoVida: 0, recuperacaoMana: 0, recuperacaoEstamina: 0,
                        teste: { codigoTeste: 'ATAQUE_COMUM', usaTotalParaFaixas: true } }) } } })} />
                <InputText label="Preço para ensinar" width="100%" type="number" theme={theme} neon={neon} value={offer.price}
                  help={help.offerPrice} onChange={event => update(offer.itemId, { price: Number(event.target.value) })} />
                <InputText label="Peso no sorteio" width="100%" type="number" theme={theme} neon={neon} value={offer.weight ?? 1}
                  help={help.offerWeight} onChange={event => update(offer.itemId, { weight: Number(event.target.value) })} />
                <InputText label="Nível mínimo" width="100%" type="number" theme={theme} neon={neon} value={offer.minLevel ?? 1}
                  help={help.spellLevel} onChange={event => update(offer.itemId, { minLevel: Number(event.target.value) })} />
                {(['dano', 'custoMana', 'custoEstamina', 'limiteAtaquesPorTurno'] as const).map((key, index) =>
                  <InputText key={key} label={['Dano', 'Custo de mana', 'Custo de estamina', 'Ataques por turno', 'Cooldown (turnos)'][index]}
                    theme={theme} neon={neon} width="100%" type="number" value={Number(attributes[key] ?? (key === 'limiteAtaquesPorTurno' ? 1 : 0))}
                    onChange={event => setAttributes({ [key]: Number(event.target.value) })} />)}
                <InputText label="Cooldown (turnos)" width="100%" type="number" theme={theme} neon={neon}
                  help={help.spellCooldown} value={Number(attributes.cooldownTurnos ?? 0)} onChange={event => setAttributes({ cooldownTurnos: Number(event.target.value) })} />
              </GameAdminFields>
              {spell.tipo === 'suporte' && <HelpHeading label="Recuperação direta" theme={theme} neon={neon} level="h4" help={help.spellRecovery} />}
              <GameAdminFields>
                {spell.tipo === 'suporte' && ['Vida', 'Mana', 'Estamina'].map(resource => <InputText key={resource}
                  label={`Recuperar ${resource.toLowerCase()}`} width="100%" type="number" theme={theme} neon={neon}
                  value={Number(attributes[`recuperacao${resource}`] ?? 0)} onChange={event => setAttributes({ [`recuperacao${resource}`]: Number(event.target.value) })} />)}
              </GameAdminFields>
              <TestSpecificationFields theme={theme} neon={neon} value={attributes.teste as GameplayTestSpec | undefined}
                onChange={teste => setAttributes({ teste })} testOptions={catalog?.testOptions} attributeOptions={catalog?.attributeOptions} />
              <ConditionEffectFields theme={theme} neon={neon} value={attributes.condicoes as GameplayConditionEffectConfig[] | undefined}
                onChange={condicoes => setAttributes({ condicoes })} options={catalog?.conditionOptions} resultOptions={catalog?.resultOptions} />
              <ImageUploader label="Imagem da magia" theme={theme} neon={neon} initialImage={normalizeImagePath(spell.imagem ?? undefined)}
                cropPreset={{ mode: 'single', aspectRatio: 1, shape: 'rectangle', displayShape: 'rectangle', label: 'Magia' }}
                onRemove={() => update(offer.itemId, { snapshot: { ...spell, imagem: null } })}
                onImageCropped={result => {
                  setUploading(true); setError(null);
                  void saveAsset({ imageFile: result.file, type: 'jogo', entityName: offer.itemId, mesaId })
                    .then(asset => {
                      const current = latest.current;
                      if (current.option.npcType !== 'SABIO') return;
                      current.onChange({ ...current.option, offers: current.option.offers?.map(entry =>
                        entry.itemId === offer.itemId && entry.snapshot ? { ...entry, snapshot: { ...entry.snapshot, imagem: asset.path } } : entry) });
                    })
                    .catch(reason => setError(getApiErrorMessage(reason, 'Não foi possível enviar a imagem.'))).finally(() => setUploading(false));
                }} />
              </Offers>
            </fieldset></div></OfferExpansion>
          </OfferRow>;
        })}
      </> : <>
        <GameAdminFields>{(['damage', 'price'] as const).map((key, index) =>
          <InputText key={key} label={['Dano por melhoria', 'Preço por melhoria', 'Melhorias por arma'][index]} width="100%" type="number"
            theme={theme} neon={neon} value={upgrade[key]} disabled={!editable}
            onChange={event => onChange({ ...option, upgrade: { ...upgrade, [key]: Number(event.target.value) } })} />)}
          <InputText label="Melhorias por arma" width="100%" type="number" theme={theme} neon={neon}
            value={upgrade.maxUpgrades} disabled={!editable} help={help.weaponUpgrades}
            onChange={event => onChange({ ...option, upgrade: { ...upgrade, maxUpgrades: Number(event.target.value) } })} />
        </GameAdminFields>
        <ManagementGameVendorOffers offers={offers} onChange={value => onChange({ ...option, offers: value })}
          offerCount={option.offerCount ?? 3} onOfferCountChange={value => onChange({ ...option, offerCount: value })}
          theme={theme} neon={neon} editable={editable} mesaId={mesaId} systemVersionId={systemVersionId} prosthesesOnly />
      </>}
      <GameAdminActions><CyberButton text="Concluir" theme={theme} neon={neon} width="180px" disabled={uploading} onClick={() => setOpen(false)} /></GameAdminActions>
      </Offers>
    </Modal>}
  </>;
}
