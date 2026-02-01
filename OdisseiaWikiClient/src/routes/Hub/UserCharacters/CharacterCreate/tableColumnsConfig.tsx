import React, { memo } from 'react';
import { Item, ItemTipo } from '../../../../models/Itens';
import { Skills, SkillTipoString } from '../../../../models/Skills';
import { Magia, MagiaTipoString } from '../../../../models/Magias';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { Modal } from '../../../../components/Generic/Modal/Modal';
import { atributosFormMap, atributosMagiaFormMap, atributosSkillFormMap } from '../../../Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/MapItensForm';

// Componentes memoizados para evitar re-renders desnecessários
const ItemAtributosEditor = memo(({ 
  row, 
  value, 
  onChange, 
  theme, 
  neon 
}: { 
  row: Item; 
  value: any; 
  onChange: (v: any) => void; 
  theme: 'dark' | 'light'; 
  neon: 'on' | 'off';
}) => {
  const [open, setOpen] = React.useState(false);
  const FormComponent = atributosFormMap[row.tipo as ItemTipo];

  if (!FormComponent) return <label>Selecione o tipo</label>;

  return (
    <>
      <CyberButton type="button" width="90%" height="30px" onClick={() => setOpen(true)}>
        Editar
      </CyberButton>
      {open && (
        <Modal
          title={`Editar atributos de ${row.nome}`}
          onClose={() => setOpen(false)}
          onSubmit={() => setOpen(false)}
          theme={theme}
          neon={neon}
        >
          <FormComponent value={value} onChange={onChange} theme={theme} neon={neon} />
        </Modal>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: apenas re-renderiza se os valores importantes mudarem
  return prevProps.value === nextProps.value && 
         prevProps.row.tipo === nextProps.row.tipo &&
         prevProps.row.nome === nextProps.row.nome;
});

const SkillAtributosEditor = memo(({ 
  row, 
  value, 
  onChange, 
  theme, 
  neon 
}: { 
  row: Skills; 
  value: any; 
  onChange: (v: any) => void; 
  theme: 'dark' | 'light'; 
  neon: 'on' | 'off';
}) => {
  const [open, setOpen] = React.useState(false);
  const FormComponent = atributosSkillFormMap[row.tipo as SkillTipoString];

  if (!FormComponent) return <label>Selecione o tipo</label>;

  return (
    <>
      <CyberButton type="button" width="90%" height="30px" onClick={() => setOpen(true)}>
        Editar
      </CyberButton>
      {open && (
        <Modal
          title={`Editar atributos de ${row.nome}`}
          onClose={() => setOpen(false)}
          onSubmit={() => setOpen(false)}
          theme={theme}
          neon={neon}
        >
          <FormComponent value={value} onChange={onChange} theme={theme} neon={neon} />
        </Modal>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.row.tipo === nextProps.row.tipo &&
         prevProps.row.nome === nextProps.row.nome;
});

const MagiaAtributosEditor = memo(({ 
  row, 
  value, 
  onChange, 
  theme, 
  neon 
}: { 
  row: Magia; 
  value: any; 
  onChange: (v: any) => void; 
  theme: 'dark' | 'light'; 
  neon: 'on' | 'off';
}) => {
  const [open, setOpen] = React.useState(false);
  const FormComponent = atributosMagiaFormMap[row.tipo as MagiaTipoString];

  if (!FormComponent) return <label>Selecione o tipo</label>;

  return (
    <>
      <CyberButton type="button" width="90%" height="30px" onClick={() => setOpen(true)}>
        Editar
      </CyberButton>
      {open && (
        <Modal
          title={`Editar atributos de ${row.nome}`}
          onClose={() => setOpen(false)}
          onSubmit={() => setOpen(false)}
          theme={theme}
          neon={neon}
        >
          <FormComponent value={value} onChange={onChange} theme={theme} neon={neon} />
        </Modal>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && 
         prevProps.row.tipo === nextProps.row.tipo &&
         prevProps.row.nome === nextProps.row.nome;
});

// Definições de colunas base (sem customRender)
const baseItemColumns = [
  { key: "nome", label: "Nome", inputType: "text", width: 200 },
  { key: "descricao", label: "Descrição", inputType: "text", width: 300 },
  { key: "quantidade", label: "Qtd", inputType: "number", width: 80 },
  { key: "peso", label: "Peso", inputType: "number", width: 80 },
  {
    key: "tipo",
    label: "Tipo",
    inputType: "select",
    options: [
      { label: "Arma", value: "arma" },
      { label: "Traje", value: "traje" },
      { label: "Consumiveis", value: "consumiveis" },
      { label: "Acessório", value: "acessorio" },
      { label: "Outro", value: "outro" },
    ],
  },
];

const baseSkillsColumns = [
  { key: "nome", label: "Nome", inputType: "text", width: 200 },
  { key: "efeito", label: "Efeito", inputType: "text", width: 300 },
  { key: "custo", label: "Custo", inputType: "string", width: 100 },
  { key: "nivel", label: "Nível", inputType: "number", width: 80 },
  {
    key: "elemento",
    label: "Elemento",
    inputType: "checkselect",
    options: [
      { label: "Normal", value: "normal" },
      { label: "Fogo", value: "fogo" },
      { label: "Água", value: "agua" },
      { label: "Ar", value: "ar" },
      { label: "Terra", value: "terra" },
      { label: "Luz", value: "luz" },
      { label: "Escuridão", value: "escuridao" },
      { label: "Espacial", value: "espacial" },
      { label: "Transfiguração", value: "transfiguracao" },
      { label: "Invocação", value: "invocacao" },
    ],
  },
  {
    key: "tipo",
    label: "Tipo",
    inputType: "select",
    options: [
      { label: "Ataque", value: "ataque" },
      { label: "Suporte", value: "suporte" },
      { label: "Buff", value: "buff" },
      { label: "Debuff", value: "debuff" },
    ],
  },
];

const baseMagiasColumns = [
  { key: "nome", label: "Nome", inputType: "text", width: 200 },
  { key: "efeito", label: "Efeito", inputType: "text", width: 300 },
  { key: "custo", label: "Custo", inputType: "string", width: 100 },
  {
    key: "elemento",
    label: "Elemento",
    inputType: "checkselect",
    options: [
      { label: "Fogo", value: "fogo" },
      { label: "Água", value: "agua" },
      { label: "Ar", value: "ar" },
      { label: "Terra", value: "terra" },
      { label: "Luz", value: "luz" },
      { label: "Escuridão", value: "escuridao" },
      { label: "Espacial", value: "espacial" },
      { label: "Transfiguração", value: "transfiguracao" },
      { label: "Invocação", value: "invocacao" },
    ],
  },
  {
    key: "tipo",
    label: "Tipo",
    inputType: "select",
    options: [
      { label: "Ataque", value: "ataque" },
      { label: "Suporte", value: "suporte" },
      { label: "Buff", value: "buff" },
      { label: "Debuff", value: "debuff" },
    ],
  },
];

export const createItemColumns = (theme: 'dark' | 'light', neon: 'on' | 'off') => [
  ...baseItemColumns,
  {
    key: "atributos",
    label: "Atributos",
    customRender: (value: any, row: Item, onChange: (v: any) => void) => (
      <ItemAtributosEditor row={row} value={value} onChange={onChange} theme={theme} neon={neon} />
    )
  } as any,
];

export const createSkillsColumns = (theme: 'dark' | 'light', neon: 'on' | 'off') => [
  ...baseSkillsColumns,
  {
    key: "atributos",
    label: "Atributos",
    customRender: (value: any, row: Skills, onChange: (v: any) => void) => (
      <SkillAtributosEditor row={row} value={value} onChange={onChange} theme={theme} neon={neon} />
    )
  } as any,
];

export const createMagiasColumns = (theme: 'dark' | 'light', neon: 'on' | 'off') => [
  ...baseMagiasColumns,
  {
    key: "atributos",
    label: "Atributos",
    customRender: (value: any, row: Magia, onChange: (v: any) => void) => (
      <MagiaAtributosEditor row={row} value={value} onChange={onChange} theme={theme} neon={neon} />
    )
  } as any,
];
