import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useEffect, useState } from 'react';
import { Modal } from '../../../components/Generic/Modal/Modal';
import type { MesaNpcCatalogo } from '../../../models/Mesa';
import { NpcPickerEmpty, NpcPickerInput, NpcPickerItem, NpcPickerList } from './MesaNpcPicker.style';

interface Props {
  open: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  search: (term: string) => Promise<MesaNpcCatalogo[]>;
  onAdd: (npc: MesaNpcCatalogo, variantId?: string | null) => Promise<void>;
  onClose: () => void;
}

export const MesaNpcPicker = ({ open, theme, neon, search, onAdd, onClose }: Props) => {
  const [term, setTerm] = useState('');
  const [items, setItems] = useState<MesaNpcCatalogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void search(term).then((result) => {
        if (active) setItems(result);
      }).catch(() => {
        if (active) setItems([]);
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, term ? 220 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, search, term]);

  if (!open) return null;
  return (
    <Modal title="Adicionar NPC à Mesa" theme={theme} neon={neon} onClose={onClose} showFooter={false} width="680px" mobileInset>
      <NpcPickerInput>
        <SearchOutlinedIcon />
        <input autoFocus value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Pesquisar personagem ou variante" />
      </NpcPickerInput>
      <NpcPickerList>
        {loading && <NpcPickerEmpty>Buscando NPCs…</NpcPickerEmpty>}
        {!loading && items.length === 0 && <NpcPickerEmpty>Nenhum NPC encontrado.</NpcPickerEmpty>}
        {!loading && items.flatMap((npc) => {
          const options = npc.generico ? npc.variantes : [{ id: '', nome: npc.nome }];
          return options.map((variant) => {
            const key = `${npc.idPersonagem}:${variant.id}`;
            return (
              <NpcPickerItem key={key}>
                {npc.imagem ? <img src={npc.imagem} alt="" /> : <span>N</span>}
                <div><strong>{npc.nome}</strong>{npc.generico && <small>Variante: {variant.nome}</small>}</div>
                <button
                  type="button"
                  disabled={adding !== null}
                  onClick={() => {
                    setAdding(key);
                    void onAdd(npc, variant.id || null).finally(() => setAdding(null));
                  }}
                ><PersonAddAltOutlinedIcon /> {adding === key ? 'Adicionando' : 'Adicionar'}</button>
              </NpcPickerItem>
            );
          });
        })}
      </NpcPickerList>
    </Modal>
  );
};
