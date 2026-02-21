import React, { memo } from 'react';
import { Item, ItemTipo } from '../../../../models/Itens';
import { Skills, SkillTipoString } from '../../../../models/Skills';
import { Magia, MagiaTipoString } from '../../../../models/Magias';
import { JSONContent } from '../../../../models/Characters';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { Modal } from '../../../../components/Generic/Modal/Modal';
import RichTextModal from '../../../../components/Generic/RichTextModal';
import { atributosFormMap, atributosMagiaFormMap, atributosSkillFormMap } from '../../../Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/MapItensForm';
import { getTextPreview } from '../../../../utils/richTextHelpers';

const RichTextCellEditor = memo(({ 
  value, 
  onChange, 
  theme, 
  neon,
  title,
  placeholder,
  emptyLabel,
  previewLength = 40,
}: { 
  value: any; 
  onChange: (v: any) => void; 
  theme: 'dark' | 'light'; 
  neon: 'on' | 'off';
  title: string;
  placeholder: string;
  emptyLabel: string;
  previewLength?: number;
}) => {
  const [open, setOpen] = React.useState(false);
  const preview = getTextPreview(value, previewLength);

  const handleSave = (content: JSONContent | string) => {
    const nextValue = typeof content === 'string'
      ? content
      : JSON.parse(JSON.stringify(content));

    onChange(nextValue);
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
          background: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
          color: theme === 'dark' ? '#ccc' : '#333',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = neon === 'on' ? '#00ff00' : '#666';
          e.currentTarget.style.background = theme === 'dark' ? '#333' : '#e8e8e8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme === 'dark' ? '#444' : '#ccc';
          e.currentTarget.style.background = theme === 'dark' ? '#2a2a2a' : '#f5f5f5';
        }}
      >
        {preview ? (
          <span
            style={{
              display: 'block',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={preview}
          >
            {preview}
          </span>
        ) : (
          <span
            style={{
              opacity: 0.5,
              display: 'block',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {emptyLabel}
          </span>
        )}
      </div>
      <RichTextModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        initialContent={value || ''}
        title={title}
        placeholder={placeholder}
        theme={theme}
        neon={neon}
      />
    </>
  );
});

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

const baseItemColumns = [
  { key: "nome", label: "Nome", inputType: "text", width: 200 },
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
  ...baseItemColumns.slice(0, 1), // nome
  {
    key: "descricao",
    label: "Descrição",
    width: 300,
    customRender: (value: any, row: Item, onChange: (v: any) => void) => (
      <RichTextCellEditor
        value={value}
        onChange={onChange}
        theme={theme}
        neon={neon}
        title={`Editar descrição de ${row.nome || 'item'}`}
        placeholder="Digite a descrição do item..."
        emptyLabel="Clique para adicionar descrição..."
      />
    )
  } as any,
  ...baseItemColumns.slice(1), // quantidade, peso, tipo
  {
    key: "atributos",
    label: "Atributos",
    customRender: (value: any, row: Item, onChange: (v: any) => void) => (
      <ItemAtributosEditor row={row} value={value} onChange={onChange} theme={theme} neon={neon} />
    )
  } as any,
];

export const createSkillsColumns = (theme: 'dark' | 'light', neon: 'on' | 'off') => [
  ...baseSkillsColumns.map((column) =>
    column.key === 'efeito'
      ? {
          ...column,
          customRender: (value: any, row: Skills, onChange: (v: any) => void) => (
            <RichTextCellEditor
              value={value}
              onChange={onChange}
              theme={theme}
              neon={neon}
              title={`Editar efeito de ${row.nome || 'skill'}`}
              placeholder="Digite o efeito da skill..."
              emptyLabel="Clique para adicionar efeito..."
              previewLength={50}
            />
          ),
        }
      : column
  ),
  {
    key: "atributos",
    label: "Atributos",
    customRender: (value: any, row: Skills, onChange: (v: any) => void) => (
      <SkillAtributosEditor row={row} value={value} onChange={onChange} theme={theme} neon={neon} />
    )
  } as any,
];

export const createMagiasColumns = (theme: 'dark' | 'light', neon: 'on' | 'off') => [
  ...baseMagiasColumns.map((column) =>
    column.key === 'efeito'
      ? {
          ...column,
          customRender: (value: any, row: Magia, onChange: (v: any) => void) => (
            <RichTextCellEditor
              value={value}
              onChange={onChange}
              theme={theme}
              neon={neon}
              title={`Editar efeito de ${row.nome || 'magia'}`}
              placeholder="Digite o efeito da magia..."
              emptyLabel="Clique para adicionar efeito..."
              previewLength={50}
            />
          ),
        }
      : column
  ),
  {
    key: "atributos",
    label: "Atributos",
    customRender: (value: any, row: Magia, onChange: (v: any) => void) => (
      <MagiaAtributosEditor row={row} value={value} onChange={onChange} theme={theme} neon={neon} />
    )
  } as any,
];
