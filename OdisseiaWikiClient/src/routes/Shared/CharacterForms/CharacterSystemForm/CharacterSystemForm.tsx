import React from 'react';
import { DataTable } from '../../../../components/Generic/DataTable/DataTable';
import { Item } from '../../../../models/Itens';
import { Magia } from '../../../../models/Magias';
import { Skills } from '../../../../models/Skills';
import { BottomContentController, SectionTable, TableTitle } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { StatusForm } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/StatusForm/StatusForm';
import { CharacterSystemFormProps } from './CharacterSystemForm.type';
import { getInventarioItems, getProtesesItems, getProtesesTableItems, replaceItemSection } from '../../../../utils/itemInventorySections';

export const CharacterSystemForm: React.FC<CharacterSystemFormProps> = ({
  theme,
  neon,
  allowMaxStatusEditing = false,
  userName,
  selectedRace,
  raceImageUrl,
  avatarUrl,
  xp,
  setXp,
  level,
  setLevel,
  statusBasico,
  setStatusBasico,
  atributosPrincipais,
  setAtributosPrincipais,
  atributosSecundarios,
  setAtributosSecundarios,
  defesas,
  setDefesas,
  itens,
  setItens,
  skills,
  setSkills,
  magias,
  setMagias,
  listItens,
  handleSelectItem,
  itemColumns,
  skillsColumns,
  magiasColumns,
}) => {
  const inventario = getInventarioItems(itens);
  const updateInventario = (updatedItems: Item[]) => setItens(replaceItemSection(itens, 'inventario', updatedItems));
  const updateProteses = (updatedItems: Item[]) => setItens(
    replaceItemSection(itens, 'proteses', updatedItems.map((item) => ({ ...item, tipo: 'implante' }))),
  );
  const adicionarItem = (item: Item) => {
    if (item.tipo !== 'implante') handleSelectItem(item);
  };
  const adicionarProtese = (item: Item) => {
    if (item.tipo === 'implante') handleSelectItem(item);
  };

  return (
    <>
      <StatusForm
        theme={theme}
        neon={neon}
        allowMaxStatusEditing={allowMaxStatusEditing}
        userName={userName}
        selectedRace={selectedRace}
        xp={xp}
        setXp={setXp}
        level={level}
        setLevel={setLevel}
        statusBasico={statusBasico}
        setStatusBasico={setStatusBasico}
        atributosPrincipais={atributosPrincipais}
        setAtributosPrincipais={setAtributosPrincipais}
        atributosSecundarios={atributosSecundarios}
        setAtributosSecundarios={setAtributosSecundarios}
        defesas={defesas}
        setDefesas={setDefesas}
        avatarUrl={avatarUrl}
        setAvatarUrl={() => undefined}
        raceImageUrl={raceImageUrl}
      />

      <BottomContentController>
        <SectionTable>
          <TableTitle>Inventário</TableTitle>
          <DataTable<Item>
            data={inventario}
            onChange={updateInventario}
            columns={itemColumns}
            searchable
            searchPlaceholder="Pesquisar item..."
            searchData={getInventarioItems(listItens)}
            searchKeys={['nome', 'tipo', 'descricao']}
            onSelectSearch={adicionarItem}
            theme={theme}
            neon={neon}
          />
        </SectionTable>

        <SectionTable>
          <TableTitle>Próteses</TableTitle>
          <DataTable<Item>
            data={getProtesesTableItems(itens)}
            onChange={updateProteses}
            columns={itemColumns}
            searchable
            searchPlaceholder="Pesquisar implante..."
            searchData={getProtesesItems(listItens)}
            searchKeys={['nome', 'tipo', 'descricao']}
            onSelectSearch={adicionarProtese}
            theme={theme}
            neon={neon}
          />
        </SectionTable>

        <SectionTable>
          <TableTitle>Magias</TableTitle>
          <DataTable<Magia>
            data={magias}
            onChange={setMagias}
            columns={magiasColumns}
            showEmptyRow
            theme={theme}
            neon={neon}
          />
        </SectionTable>

        <SectionTable>
          <TableTitle>Skills</TableTitle>
          <DataTable<Skills>
            data={skills}
            onChange={setSkills}
            columns={skillsColumns}
            showEmptyRow
            theme={theme}
            neon={neon}
          />
        </SectionTable>
      </BottomContentController>
    </>
  );
};
