import React from 'react'
import { Item } from '../../../../../../models/Itens';
import { Skills } from '../../../../../../models/Skills';
import { Magia } from '../../../../../../models/Magias';
import { ExpandHistoryButton, FormHeader, GridInputs, HeaderAvatar, HeaderInputs, HistoryEditorHeader, RelatedCharactersSection, SectionStatus, SectionTable, SectionTitle, TableTitle } from '../FormUserCharacter.style';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import { CropPreset } from '../../../../../../components/Generic/ImageUploader/types';
import { StatusInput } from '../../../../../../components/Generic/StatusInput/StatusInput';
import { TextArea } from '../../../../../../components/Generic/TextArea/TextArea';
import { RichTextEditor } from '../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { CheckSelect } from '../../../../../../components/Generic/CheckSelect/CheckSelect';
import { Search } from '../../../../../../components/Generic/Search/Search';
import { BiSearchAlt } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import { DataTable } from '../../../../../../components/Generic/DataTable/DataTable';
import RichTextModal from '../../../../../../components/Generic/RichTextModal';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { TRAITS_OPTIONS, ALIGNMENT_OPTIONS } from '../../constants';
import { BasicInfoFormProps } from './BasicInfoForm.type';
import { getInventarioItems, getProtesesItems, getProtesesTableItems, replaceItemSection } from '../../../../../../utils/itemInventorySections';

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  theme,
  neon,
  userName,
  setUserName,
  race,
  setRace,
  city,
  setCity,
  avatarUrl,
  setAvatarUrl,
  setAvatarFile,
  history,
  setHistory,
  costumes,
  setCostumes,
  extraInformation,
  setExtraInformation,
  nanites,
  setNanites,
  alignment,
  setAlignment,
  traits,
  setTraits,
  idpassiva,
  setIdpassiva,
  ultimate,
  setUltimate,
  itens,
  setItens,
  skills,
  setSkills,
  magias,
  setMagias,
  listPersonagemRelacionado,
  setListPersonagemRelacionado,
  statusBasico,
  setStatusBasico,
  errors,
  userError,
  setUserError,
  raceError,
  setRaceError,
  listCities,
  loadingCities,
  listRaces,
  loadingRaces,
  selectedRace,
  personagens,
  allPersonagens,
  searchTerm,
  loadingPersonagens,
  searchPersonagens,
  listItens,
  handleSelectItem,
  itemColumns,
  skillsColumns,
  magiasColumns,
}) => {
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);
  const inventario = getInventarioItems(itens);
  const updateInventario = (updatedItems: Item[]) => setItens(replaceItemSection(itens, 'inventario', updatedItems));
  const updateProteses = (updatedItems: Item[]) => setItens(
    replaceItemSection(itens, 'proteses', updatedItems.map((item) => ({ ...item, tipo: 'implante' }))),
  );
  const characterAvatarCropPreset: CropPreset = {
    mode: 'single',
    aspectRatio: 1,
    shape: 'circle',
    displayShape: 'circle',
    label: 'Avatar Circular',
  };

  const handleCharacterAvatarUpload = (result: any) => {
    setAvatarUrl(result.preview);
    setAvatarFile(result.file);
  };
  return (
    <>
      <FormHeader theme={theme} neon={neon}>
        <HeaderInputs theme={theme} neon={neon}>
          <InputText
            theme={theme}
            neon={neon}
            label="Nome"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            onFocus={() => setUserError(false)}
            error={userError}
            errorMessage={errors.name}
            required
            width="100%"
          />
          <Select
            theme={theme}
            neon={neon}
            label="Raça"
            options={listRaces.map(r => ({ value: r.idraca, label: r.nome }))}
            value={race}
            onChange={(e) => setRace(Number(e.target.value))}
            onFocus={() => setRaceError(false)}
            error={raceError}
            errorMessage={errors.race}
            required
            width="100%"
            disabled={loadingRaces}
          />
          <Select
            theme={theme}
            neon={neon}
            label="Cidade"
            options={listCities.map(c => ({ value: c.idcidade, label: c.nome }))}
            value={city}
            onChange={(e) => setCity(Number(e.target.value))}
            width="100%"
            disabled={loadingCities}
          />
        </HeaderInputs>

        <HeaderAvatar theme={theme} neon={neon}>
          <ImageUploader
            theme={theme}
            neon={neon}
            label="Avatar"
            initialImage={avatarUrl}
            onImageCropped={handleCharacterAvatarUpload}
            cropPreset={characterAvatarCropPreset}
          />
        </HeaderAvatar>
      </FormHeader>

      {selectedRace && (
        <SectionStatus theme={theme} neon={neon}>
          <StatusInput
            theme={theme}
            neon={neon}
            type="vida"
            label="Vida"
            value={statusBasico.vida}
            maxValue={statusBasico.vidaMaxima}
            enableCalculator
            editable
            onChange={(e) =>
              setStatusBasico((prev) => ({ ...prev, vida: Number(e.target.value) }))
            }
            onMaxChange={(e) =>
              setStatusBasico((prev) => ({ ...prev, vidaMaxima: Number(e.target.value) }))
            }
          />
          <StatusInput
            theme={theme}
            neon={neon}
            type="estamina"
            label="Estamina"
            value={statusBasico.estamina}
            maxValue={statusBasico.estaminaMaxima}
            enableCalculator
            editable
            onChange={(e) =>
              setStatusBasico((prev) => ({ ...prev, estamina: Number(e.target.value) }))
            }
            onMaxChange={(e) =>
              setStatusBasico((prev) => ({ ...prev, estaminaMaxima: Number(e.target.value) }))
            }
          />
          <StatusInput
            theme={theme}
            neon={neon}
            type="mana"
            label="Mana"
            value={statusBasico.mana}
            maxValue={statusBasico.manaMaxima}
            enableCalculator
            editable
            onChange={(e) =>
              setStatusBasico((prev) => ({ ...prev, mana: Number(e.target.value) }))
            }
            onMaxChange={(e) =>
              setStatusBasico((prev) => ({ ...prev, manaMaxima: Number(e.target.value) }))
            }
          />
        </SectionStatus>
      )}

      <HistoryEditorHeader>
        <ExpandHistoryButton
          type="button"
          theme={theme}
          neon={neon}
          onClick={() => setHistoryModalOpen(true)}
          title="Expandir história"
        >
          <OpenInFullIcon className="icon" />
        </ExpandHistoryButton>
      </HistoryEditorHeader>
      <RichTextEditor
        theme={theme}
        neon={neon}
        label="História"
        value={history}
        onChange={setHistory}
        minHeight="150px"
        placeholder="Escreva a história do personagem..."
      />
      <RichTextModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSave={setHistory}
        initialContent={history}
        title="Editar História"
        placeholder="Escreva a história do personagem..."
        theme={theme}
        neon={neon}
      />

      <GridInputs>
        <Select
          theme={theme}
          neon={neon}
          label="Alinhamento"
          options={ALIGNMENT_OPTIONS}
          value={alignment}
          onChange={(e) => setAlignment(e.target.value)}
          width="100%"
        />
        <CheckSelect
          theme={theme}
          neon={neon}
          label="Traços de Personalidade"
          options={TRAITS_OPTIONS}
          value={traits}
          onChange={setTraits}
          width="100%"
        />
        <Search
          theme={theme}
          neon={neon}
          label="Personagens relacionados"
          value={searchTerm}
          onChange={(e) => searchPersonagens(e.target.value)}
          icon={<BiSearchAlt className="icon" />}
          iconSize={20}
          disabled={!allPersonagens.length}
          suggestions={personagens.map(p => `${p.Idpersonagem}|${p.Nome}`)}
          onSelectSuggestion={(suggestion) => {
            const [idStr] = suggestion.split('|');
            const id = parseInt(idStr);
            const personagem = allPersonagens.find(p => p.Idpersonagem === id);
            if (personagem) {
              setListPersonagemRelacionado(prev => {
                if (prev.some(item => item.id === personagem.Idpersonagem)) {
                  toast.error("Esse personagem já está vinculado.");
                  return prev;
                }
                return [...prev, { id: personagem.Idpersonagem, nome: personagem.Nome }];
              });
            }
          }}
          loading={loadingPersonagens}
        />
        <InputText
          theme={theme}
          neon={neon}
          label="Nanites"
          value={nanites}
          onChange={(e) => setNanites(e.target.value)}
          width="100%"
          type='number'
        />
        <InputText
          theme={theme}
          neon={neon}
          label="Idpassiva"
          value={String(idpassiva ?? '')}
          onChange={(e) => setIdpassiva(e.target.value ? Number(e.target.value) : undefined)}
          width="100%"
          type='number'
        />
        <InputText
          theme={theme}
          neon={neon}
          label="Ultimate"
          value={ultimate}
          onChange={(e) => setUltimate(e.target.value)}
          width="100%"
        />
        <TextArea
          theme={theme}
          neon={neon}
          label="Costumes"
          value={costumes}
          onChange={(e) => setCostumes(e.target.value)}
          fullWidth
        />
        <TextArea
          theme={theme}
          neon={neon}
          label="Informações extras"
          value={extraInformation}
          onChange={(e) => setExtraInformation(e.target.value)}
          fullWidth
        />
      </GridInputs>

      {listPersonagemRelacionado.length > 0 && (
        <RelatedCharactersSection>
          <SectionTitle theme={theme} neon={neon}>
            Personagens Relacionados
          </SectionTitle>
          <HorizontalList
            theme={theme}
            neon={neon}
            data={listPersonagemRelacionado}
            onDelete={(id) =>
              setListPersonagemRelacionado((prev) =>
                prev.filter((item) => item.id !== id)
              )
            }
          />
        </RelatedCharactersSection>
      )}

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
          onSelectSearch={(item) => item.tipo !== 'implante' && handleSelectItem(item)}
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
          onSelectSearch={(item) => item.tipo === 'implante' && handleSelectItem(item)}
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
    </>
  );
};
