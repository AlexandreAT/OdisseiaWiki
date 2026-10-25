import { useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Search } from '../../../../components/Generic/Search/Search';
import { InputText } from '../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../components/Generic/Select/Select';
import { Modal } from '../../../../components/Generic/Modal/Modal';
import type { GameLootOption } from '../../../../services/gameModeManagementService';
import type { GameModeVendorOffer } from '../../../../models/GameModeManagement';
import { GameAdminHint } from '../ManagementGame.style';
import { useGameItemCatalog } from '../useGameItemCatalog';
import { normalizeImagePath } from '../../../Wiki/utils/imagePathHelper';
import { Offers, OfferFields, OfferRow, OfferRowHeader, OfferExpansion, VendorCatalogTrigger } from './ManagementGameVendorOffers.style';

export function ManagementGameVendorOffers({ offers, offerCount, onOfferCountChange, onChange, theme, neon, editable, mesaId, systemVersionId }: {
  offers: GameModeVendorOffer[]; onChange: (offers: GameModeVendorOffer[]) => void;
  offerCount: number; onOfferCountChange: (count: number) => void;
  theme: 'dark' | 'light'; neon: 'on' | 'off'; editable: boolean; mesaId?: number; systemVersionId: number;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { items, error, loading } = useGameItemCatalog(mesaId, systemVersionId, open);
  const available = items.filter((item) => !offers.some((offer) => offer.itemId === item.id));
  const label = (item: GameLootOption) => `${item.name} · ${item.type} · #${item.id}`;
  return <>
    <VendorCatalogTrigger type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
      aria-label="Configurar catálogo do mercador" $neon={neon === 'on'}>
      <StorefrontOutlinedIcon aria-hidden="true" />
      <span><strong>Catálogo do mercador</strong><small>{offers.length} itens elegíveis · até {offerCount} ofertas por visita</small></span>
      <ExpandMoreIcon aria-hidden="true" />
    </VendorCatalogTrigger>
    {open && <Modal title="Catálogo do mercador" theme={theme} neon={neon} width="760px"
      showFooter={false} onClose={() => setOpen(false)}>
    <Offers>
    <GameAdminHint>O mercador desta rota usa apenas os itens cadastrados aqui, nesta área. A cada visita, as ofertas são sorteadas pelo peso, sem repetir um item. Clique em um item para ajustar.</GameAdminHint>
    <Select theme={theme} neon={neon} label="Ofertas por visita" width="100%" portal allowEmptyOption={false}
      value={offerCount} disabled={!editable} error={![3, 6, 9].includes(offerCount)}
      errorMessage="Escolha 3, 6 ou 9 ofertas."
      options={[3, 6, 9].map((count) => ({ value: count, label: `${count} itens` }))}
      onChange={(event) => onOfferCountChange(Number(event.target.value))} />
    {offers.length < offerCount && <GameAdminHint>Com {offers.length} itens cadastrados, aparecerão apenas {offers.length}. Adicione mais para sortear {offerCount} ofertas.</GameAdminHint>}
    {error && <p role="alert">{error}</p>}
    <Search theme={theme} neon={neon} label="Adicionar item à loja" width="100%" portal
      disabled={!editable || loading || offers.length >= 30} value={query} suggestions={available.map(label)} maxSuggestions={12}
      onChange={(event) => setQuery(event.target.value)} onSelectSuggestion={(value) => {
        const item = available.find((candidate) => label(candidate) === value);
        if (!item) return;
        onChange([...offers, { itemId: item.id, price: Math.max(0, Math.trunc(item.value ?? 0)), stock: 1, weight: 1,
          snapshot: { nome: item.name, tipo: item.type, imagem: item.image, valor: item.value } }]);
        setQuery(''); setExpanded(item.id);
      }} />
    {offers.map((offer, index) => {
      const item = items.find((candidate) => candidate.id === offer.itemId);
      const name = item?.name ?? offer.snapshot?.nome ?? offer.itemId;
      const image = normalizeImagePath(item?.image ?? offer.snapshot?.imagem ?? undefined);
      const isExpanded = expanded === offer.itemId;
      return <OfferRow key={offer.itemId}>
        <OfferRowHeader>
          <button type="button" aria-expanded={isExpanded} aria-label={`Configurar ${name}`}
            onClick={() => setExpanded(isExpanded ? null : offer.itemId)}>
            {image ? <img src={image} alt="" /> : <StorefrontOutlinedIcon aria-hidden="true" />}
            <span><strong>{name}</strong><small>{offer.price} moedas · {offer.stock} un. · peso {offer.weight ?? 1}</small></span>
            <ExpandMoreIcon aria-hidden="true" />
          </button>
          <button type="button" aria-label={`Remover ${name} do mercador`} disabled={!editable}
            onClick={() => onChange(offers.filter((_, i) => i !== index))}><DeleteOutlineIcon /></button>
        </OfferRowHeader>
        <OfferExpansion $expanded={isExpanded} aria-hidden={!isExpanded}>
          <div><fieldset disabled={!isExpanded || !editable}><OfferFields>
          <InputText theme={theme} neon={neon} label="Preço" width="100%" type="number"
            value={offer.price} disabled={!editable}
            error={!Number.isInteger(offer.price) || offer.price < 0 || offer.price > 1_000_000_000}
            errorMessage="Use um preço inteiro de 0 a 1.000.000.000."
            onChange={(event) => onChange(offers.map((entry, i) =>
              i === index ? { ...entry, price: Number(event.target.value) } : entry))} />
          <InputText theme={theme} neon={neon} label="Estoque por vendedor" width="100%" type="number"
            value={offer.stock} disabled={!editable}
            error={!Number.isInteger(offer.stock) || offer.stock < 1 || offer.stock > 999}
            errorMessage="Use de 1 a 999 unidades."
            onChange={(event) => onChange(offers.map((entry, i) =>
              i === index ? { ...entry, stock: Number(event.target.value) } : entry))} />
          <InputText theme={theme} neon={neon} label="Peso no sorteio" width="100%" type="number"
            value={offer.weight ?? 1} disabled={!editable}
            error={!Number.isInteger(offer.weight ?? 1) || (offer.weight ?? 1) < 1 || (offer.weight ?? 1) > 1_000_000}
            errorMessage="Use um peso inteiro de 1 a 1.000.000."
            onChange={(event) => onChange(offers.map((entry, i) =>
              i === index ? { ...entry, weight: Number(event.target.value) } : entry))} />
          </OfferFields></fieldset></div>
        </OfferExpansion>
      </OfferRow>;
    })}
    </Offers>
    </Modal>}
  </>;
}
