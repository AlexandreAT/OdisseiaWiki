import React from 'react';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { BiSearchAlt } from 'react-icons/bi';
import toast from 'react-hot-toast';
import { ImageUploader } from '../../../../components/Generic/ImageUploader/ImageUploader';
import { ImageGalleryWithCrop } from '../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import type { CropPreset } from '../../../../components/Generic/ImageUploader/types';
import { CheckBox } from '../../../../components/Generic/CheckBox/CheckBox';
import { CheckSelect } from '../../../../components/Generic/CheckSelect/CheckSelect';
import { HorizontalList } from '../../../../components/Generic/HorizontalList/HorizontalList';
import { InputText } from '../../../../components/Generic/InputText/InputText';
import RichTextModal from '../../../../components/Generic/RichTextModal';
import { RichTextEditor } from '../../../../components/Generic/RichTextEditor/RichTextEditor';
import { Search } from '../../../../components/Generic/Search/Search';
import { Select } from '../../../../components/Generic/Select/Select';
import { TextArea } from '../../../../components/Generic/TextArea/TextArea';
import { ALIGNMENT_OPTIONS, TRAITS_OPTIONS } from '../../../Hub/UserCharacters/CharacterCreate/constants';
import {
  FormHeader,
  GridInputs,
  HeaderAvatar,
  HeaderInputs,
  RelatedCharactersSection,
  SectionTitle,
} from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import {
  ExpandHistoryButton,
  HistoryEditorWrapper,
  HistoryHeader,
  HistoryHint,
  RaceChangeInfo,
  RoleplayContainer,
} from './CharacterRoleplayForm.style';
import { CharacterRoleplayFormProps } from './CharacterRoleplayForm.type';

export const CharacterRoleplayForm: React.FC<CharacterRoleplayFormProps> = ({
  theme,
  neon,
  userName,
  setUserName,
  race,
  setRace,
  city,
  setCity,
  selectedRace,
  listRaces,
  listCities,
  loadingRaces,
  loadingCities,
  avatarUrl,
  setAvatarUrl,
  setAvatarFile,
  galeriaUrls,
  galeriaShapes,
  onAddGaleria,
  onRemoveGaleria,
  history,
  setHistory,
  alignment,
  setAlignment,
  traits,
  setTraits,
  nanites,
  setNanites,
  costumes,
  setCostumes,
  extraInformation,
  setExtraInformation,
  visivel,
  setVisivel,
  listPersonagemRelacionado,
  setListPersonagemRelacionado,
  personagens,
  allPersonagens,
  searchTerm,
  loadingPersonagens,
  searchPersonagens,
  raceChangeMode = 'default',
}) => {
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);

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

  const canChangeRace = React.useMemo(
    () => {
      if (raceChangeMode === 'current-or-android') return true;
      return selectedRace?.nome?.toLowerCase().includes('android') ?? false;
    },
    [raceChangeMode, selectedRace?.nome]
  );

  const raceOptions = React.useMemo(() => {
    if (raceChangeMode !== 'current-or-android') {
      return listRaces.map((r) => ({ value: r.idraca, label: r.nome }));
    }

    const currentRace = listRaces.find((r) => r.idraca === race);
    const androidRace = listRaces.find((r) => r.nome?.toLowerCase().includes('android'));

    const options = [currentRace, androidRace]
      .filter((r): r is NonNullable<typeof r> => !!r)
      .filter((r, index, arr) => arr.findIndex((x) => x.idraca === r.idraca) === index)
      .map((r) => ({ value: r.idraca, label: r.nome }));

    if (options.length > 0) return options;

    return listRaces.map((r) => ({ value: r.idraca, label: r.nome }));
  }, [listRaces, race, raceChangeMode]);

  return (
    <RoleplayContainer>
      <FormHeader theme={theme} neon={neon}>
        <HeaderInputs theme={theme} neon={neon}>
          <InputText
            theme={theme}
            neon={neon}
            label="Nome"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            width="100%"
          />

          <Select
            theme={theme}
            neon={neon}
            label="Raça"
            options={raceOptions}
            value={race}
            onChange={(e) => setRace(Number(e.target.value))}
            width="100%"
            disabled={loadingRaces || !canChangeRace}
          />
          {!canChangeRace && (
            <RaceChangeInfo theme={theme} neon={neon}>
              Alteração de raça liberada somente para personagens android no momento.
            </RaceChangeInfo>
          )}
          {raceChangeMode === 'current-or-android' && (
            <RaceChangeInfo theme={theme} neon={neon}>
              Você pode manter a raça atual ou alterar para Android.
            </RaceChangeInfo>
          )}

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

      <ImageGalleryWithCrop
        theme={theme}
        neon={neon}
        label="Galeria de imagens"
        imageUrls={galeriaUrls}
        imageShapes={galeriaShapes}
        onAdd={onAddGaleria}
        onRemove={onRemoveGaleria}
      />

      <HistoryHeader>
        <HistoryHint theme={theme} neon={neon}>
          História com visual compacto e rolagem vertical. Use expandir para editar em modal.
        </HistoryHint>
        <ExpandHistoryButton
          type="button"
          theme={theme}
          neon={neon}
          onClick={() => setHistoryModalOpen(true)}
          title="Expandir história"
        >
          <OpenInFullIcon className="icon" />
        </ExpandHistoryButton>
      </HistoryHeader>

      <HistoryEditorWrapper theme={theme} neon={neon}>
        <RichTextEditor
          theme={theme}
          neon={neon}
          label="História"
          value={history}
          onChange={setHistory}
          height="220px"
          minHeight="220px"
          placeholder="Escreva a história do personagem..."
        />
      </HistoryEditorWrapper>

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
                  toast.error('Esse personagem já está vinculado.');
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
          type="number"
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

        {typeof visivel === 'boolean' && setVisivel && (
          <CheckBox
            neon={neon}
            label="Personagem visível"
            checked={visivel}
            onChange={(checked) => setVisivel(checked)}
          />
        )}
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
    </RoleplayContainer>
  );
};
