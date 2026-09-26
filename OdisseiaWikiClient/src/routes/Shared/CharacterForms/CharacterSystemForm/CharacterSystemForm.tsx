import React from 'react';
import { DataTable } from '../../../../components/Generic/DataTable/DataTable';
import { Item } from '../../../../models/Itens';
import { Magia } from '../../../../models/Magias';
import { Skills } from '../../../../models/Skills';
import { BottomContentController, SectionTable, TableTitle } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { StatusForm } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/StatusForm/StatusForm';
import { CharacterSystemFormProps } from './CharacterSystemForm.type';
import { getInventarioItems, getProtesesItems, getProtesesTableItems, isEmptyItemRow, replaceItemSection } from '../../../../utils/itemInventorySections';
import { openItemPreview } from '../../../../utils/itemPreview';
import { ItemComparisonModal } from '../../../../components/ItemComparison';
import { CharacterExplodedView, CharacterExplodedViewLauncher, ExplodedViewTab } from '../../../../components/CharacterExplodedView';
import { TableHeading } from '../../../../components/CharacterExplodedView/CharacterExplodedView.style';
import {
  getItemGameplayAction,
  getMagicGameplayAction,
  getSkillGameplayAction,
} from '../../../../utils/gameplaySheetAction';

export const CharacterSystemForm: React.FC<CharacterSystemFormProps> = ({
  theme,
  neon,
  allowMaxStatusEditing = false,
  userName,
  nameField,
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
  runtimeContext,
  comparisonSource,
  comparisonName,
  comparisonId,
  comparisonTableId,
  comparisonTableName,
  comparisonVariant,
  onGameplayAction,
  onGameplayAttributeAction,
  onGameplayXpAction,
  onGameplayGeneralAction,
}) => {
  const [comparisonItem, setComparisonItem] = React.useState<Item | null>(null);
  const [explodedTab, setExplodedTab] = React.useState<ExplodedViewTab | null>(null);
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
  const skillLimit = runtimeContext?.poderes?.skillConfig?.maximoSkills;
  const magicLimit = runtimeContext?.poderes?.skillConfig?.maximoMagias
    ?? runtimeContext?.poderes?.limiteMagias;
  const filledMagicCount = magias.filter((magia) => magia.nome?.trim()).length;
  const filledSkillCount = skills.filter((skill) => skill.nome?.trim()).length;

  return (
    <>
      <StatusForm
        theme={theme}
        neon={neon}
        allowMaxStatusEditing={allowMaxStatusEditing}
        userName={userName}
        nameField={nameField}
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
        runtimeContext={runtimeContext}
        comparisonSource={comparisonSource}
        comparisonName={comparisonName}
        comparisonId={comparisonId}
        comparisonTableId={comparisonTableId}
        comparisonTableName={comparisonTableName}
        comparisonSkillCount={filledSkillCount}
        comparisonVariant={comparisonVariant}
        onGameplayAttributeAction={onGameplayAttributeAction}
        onGameplayXpAction={onGameplayXpAction}
        onGameplayGeneralAction={onGameplayGeneralAction}
      />

      <BottomContentController>
        <SectionTable>
          <TableHeading>
          <TableTitle>Inventário</TableTitle>
            <CharacterExplodedViewLauncher tab="items" label="itens" onOpen={setExplodedTab} theme={theme} neon={neon} />
          </TableHeading>
          <DataTable<Item>
            data={inventario}
            onChange={updateInventario}
            columns={itemColumns}
            searchable
            searchPlaceholder="Pesquisar item..."
            searchData={getInventarioItems(listItens)}
            searchKeys={['nome', 'tipo', 'descricao']}
            onSelectSearch={adicionarItem}
            isRowEmpty={isEmptyItemRow}
            onViewRow={(item) => openItemPreview(item, runtimeContext)}
            onCompareRow={setComparisonItem}
            onActionRow={onGameplayAction
              ? (item) => {
                  const action = getItemGameplayAction(item);
                  if (action) onGameplayAction(action);
                }
              : undefined}
            canActionRow={(item) => Boolean(getItemGameplayAction(item))}
            actionRowLabel="Rolar ação do item"
            theme={theme}
            neon={neon}
          />
        </SectionTable>

        <SectionTable>
          <TableHeading>
          <TableTitle>Próteses</TableTitle>
            <CharacterExplodedViewLauncher tab="prostheses" label="próteses" onOpen={setExplodedTab} theme={theme} neon={neon} />
          </TableHeading>
          <DataTable<Item>
            data={getProtesesTableItems(itens)}
            onChange={updateProteses}
            columns={itemColumns}
            searchable
            searchPlaceholder="Pesquisar implante..."
            searchData={getProtesesItems(listItens)}
            searchKeys={['nome', 'tipo', 'descricao']}
            onSelectSearch={adicionarProtese}
            isRowEmpty={isEmptyItemRow}
            onViewRow={(item) => openItemPreview(item, runtimeContext)}
            onCompareRow={setComparisonItem}
            onActionRow={onGameplayAction
              ? (item) => {
                  const action = getItemGameplayAction(item);
                  if (action) onGameplayAction(action);
                }
              : undefined}
            canActionRow={(item) => Boolean(getItemGameplayAction(item))}
            actionRowLabel="Rolar ação da prótese"
            theme={theme}
            neon={neon}
          />
        </SectionTable>

        <SectionTable>
          <TableHeading>
          <TableTitle>
            Magias{magicLimit != null ? ` (${filledMagicCount}/${magicLimit})` : ''}
          </TableTitle>
            <CharacterExplodedViewLauncher tab="spells" label="magias" onOpen={setExplodedTab} theme={theme} neon={neon} />
          </TableHeading>
          <DataTable<Magia>
            data={magias}
            onChange={setMagias}
            columns={magiasColumns}
            showEmptyRow
            onActionRow={onGameplayAction
              ? (magia) => {
                  const action = getMagicGameplayAction(magia);
                  if (action) onGameplayAction(action);
                }
              : undefined}
            canActionRow={(magia) => Boolean(getMagicGameplayAction(magia))}
            actionRowLabel="Rolar teste da magia"
            theme={theme}
            neon={neon}
          />
        </SectionTable>

        <SectionTable>
          <TableHeading>
          <TableTitle>
            Skills{skillLimit != null ? ` (${filledSkillCount}/${skillLimit})` : ''}
          </TableTitle>
            <CharacterExplodedViewLauncher tab="skills" label="skills" onOpen={setExplodedTab} theme={theme} neon={neon} />
          </TableHeading>
          <DataTable<Skills>
            data={skills}
            onChange={setSkills}
            columns={skillsColumns}
            showEmptyRow
            onActionRow={onGameplayAction
              ? (skill) => {
                  const action = getSkillGameplayAction(skill);
                  if (action) onGameplayAction(action);
                }
              : undefined}
            canActionRow={(skill) => Boolean(getSkillGameplayAction(skill))}
            actionRowLabel="Rolar teste da skill"
            theme={theme}
            neon={neon}
          />
        </SectionTable>
      </BottomContentController>
      <ItemComparisonModal
        open={Boolean(comparisonItem)}
        item={comparisonItem}
        onClose={() => setComparisonItem(null)}
        theme={theme}
        neon={neon}
        runtimeContext={runtimeContext}
        availableItems={listItens}
      />
      <CharacterExplodedView
        open={Boolean(explodedTab)}
        initialTab={explodedTab ?? 'items'}
        onClose={() => setExplodedTab(null)}
        theme={theme}
        neon={neon}
        character={{
          name: userName,
          image: avatarUrl,
          race: selectedRace?.nome,
          system: runtimeContext?.nomeSistema ?? runtimeContext?.codigoSistema,
          version: runtimeContext?.numeroVersao,
          table: comparisonTableName ?? undefined,
          loadCapacity: statusBasico.capacidadeCarga,
        }}
        items={itens}
        itemCatalog={listItens}
        setItems={setItens}
        skills={skills}
        setSkills={setSkills}
        spells={magias}
        setSpells={setMagias}
        skillLimit={skillLimit}
        magicLimit={magicLimit}
        onOpenItem={(item) => openItemPreview(item, runtimeContext)}
      />
    </>
  );
};
