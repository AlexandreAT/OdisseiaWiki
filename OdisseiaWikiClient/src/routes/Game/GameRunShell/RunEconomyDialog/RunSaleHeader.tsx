import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import type { RunSaleLine } from '../runEconomy';
import type { useRunEconomyDialog } from './useRunEconomyDialog';

export const SaleHeaderActions = styled.div`
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  margin-left: auto; max-width: 100%; min-width: 0;
  > :first-child:not(:last-child) { min-width: 0; max-width: calc(100% - 44px); font-size: .7rem; }
  > button.header-close {
    display: inline-grid; place-items: center; flex: 0 0 36px; width: 36px; height: 36px;
    padding: 5px 8px; border: 1px solid rgba(77, 238, 234, .25); border-radius: 4px;
    background: transparent; color: #a9c0cc; font: inherit; font-size: .76rem; cursor: pointer;
    &:hover:not(:disabled) { color: #fff; border-color: var(--clearneonBlue); }
    &:disabled { opacity: .5; cursor: not-allowed; }
    &:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  }
`;

export function RunSaleHeader({ state, active, busy, theme, neon, onSell, onClose, closeLabel, canSell }: {
  state: ReturnType<typeof useRunEconomyDialog>; active: boolean; busy: boolean; theme: 'dark' | 'light'; neon: 'on' | 'off';
  canSell: boolean; onSell: (items: RunSaleLine[], fromStash: boolean) => Promise<boolean>; onClose: () => void; closeLabel: string;
}) {
  const batch = state.bulkSale;
  return <SaleHeaderActions>
    {active && batch.count > 0 && <CyberButton text="Vender todos selecionados" height="36px" theme={theme} neon={neon}
      aria-label="Vender todos selecionados" title={`${batch.count} itens · ${batch.units} unidades · ${batch.total.toLocaleString('pt-BR')} moedas`}
      disabled={busy || !batch.valid || !canSell} loading={busy}
      onClick={() => void onSell(batch.lines, state.saleFromStash).then(done => { if (done) { state.clearSaleSelection(); state.setSelected(null); } })} />}
    <button type="button" className="header-close" aria-label={closeLabel} disabled={busy} onClick={onClose}><CloseIcon /></button>
  </SaleHeaderActions>;
}
