import React from 'react';
import { DataTable } from '../../../../components/Generic/DataTable/DataTable';
import { Item } from '../../../../models/Itens';
import { Magia } from '../../../../models/Magias';
import { Skills } from '../../../../models/Skills';
import { BottomContentController, SectionTable, TableTitle } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { StatusForm } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/StatusForm/StatusForm';
import { CharacterSystemFormProps } from './CharacterSystemForm.type';

export const CharacterSystemForm: React.FC<CharacterSystemFormProps> = ({
  theme,
  neon,
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
  return (
    <>
      <StatusForm
        theme={theme}
        neon={neon}
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
            data={itens}
            onChange={setItens}
            columns={itemColumns}
            searchable
            searchPlaceholder="Pesquisar item..."
            searchData={listItens}
            searchKeys={['nome', 'tipo', 'descricao']}
            onSelectSearch={handleSelectItem}
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
            theme={theme}
            neon={neon}
          />
        </SectionTable>
      </BottomContentController>
    </>
  );
};
