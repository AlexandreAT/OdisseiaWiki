import React, { useRef, useEffect } from 'react';
import { FormController, FormHeader, HeaderInputs, HeaderAvatar, GridInputs, SectionTable, TableTitle, RelatedCharactersSection, SectionTitle, SectionStatus, NavegationButtons, StatusHeader, HeaderInfo, LabelStatus, MinimalInput, StatusContent, StatusAtributosDiv, StatusImageDiv, AtributoBox, AtributoDiv, InfoImage, AvatarController, AtributeController, StatusContentCenter, StatusDefesaDiv, StatusDefesaController, CheckboxSection } from './FormCharacter.style';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { ImageUploader } from '../../../../../../components/Generic/ImageUploader/ImageUploader';
import { ImageGalleryWithCrop } from '../../../../../../components/Generic/ImageGallery/ImageGalleryWithCrop';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { TextArea } from '../../../../../../components/Generic/TextArea/TextArea';
import { RichTextEditor } from '../../../../../../components/Generic/RichTextEditor/RichTextEditor';
import { Search } from '../../../../../../components/Generic/Search/Search';
import { BiSearchAlt } from 'react-icons/bi';
import { CheckSelect } from '../../../../../../components/Generic/CheckSelect/CheckSelect';
import { CheckBox } from '../../../../../../components/Generic/CheckBox/CheckBox';
import { FeaturedToggle } from '../../../../../../components/Generic/FeaturedToggle';
import { DataTable } from '../../../../../../components/Generic/DataTable/DataTable';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import { StatusInput } from '../../../../../../components/Generic/StatusInput/StatusInput';
import { useFormCharacter } from './useFormCharacter';
import { CropPreset } from '../../../../../../components/Generic/ImageUploader/types';
import toast from 'react-hot-toast';
import { LabelInfoBox } from '../../../../../../components/Generic/LabelInfoBox/LabelInfoBox';
import { createItemColumns, createMagiasColumns, createSkillsColumns } from '../../../../../Hub/UserCharacters/CharacterCreate/tableColumnsConfig';
import { Skills } from '../../../../../../models/Skills';
import { Item } from '../../../../../../models/Itens';
import { Magia } from '../../../../../../models/Magias';
import { TRAITS_OPTIONS, ALIGNMENT_OPTIONS } from '../../formOptions';
import { getInventarioItems, getProtesesItems, getProtesesTableItems, replaceItemSection } from '../../../../../../utils/itemInventorySections';
//import OrcBack from '../../../../../../assets/racas/orc/OrcBackground.jpeg';

interface FormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  contentType?: string;
}

export const FormCharacter = ({ theme, neon, contentType }: FormProps) => {
  const {
    step, handleNext, handleSubmit,
    handlePrev, isFirstStep, isLastStep,
    userName, setUserName,
    race, handleRaceChange,
    city, setCity,
    avatarUrl, setAvatarUrl,
    setAvatarFile,
    galeriaUrls,
    galeriaShapes,
    handleGaleriaUpload,
    handleRemoveGaleriaImage,
    history, setHistory,
    costumes, setCostumes,
    nanites, setNanites,
    alignment, setAlignment,
    traits, setTraits,
    idpassiva, setIdpassiva,
    ultimate, setUltimate,
    tags,
    tagInput, setTagInput,
    visivel, setVisivel,
    destaque, setDestaque,
    itens, setItens,
    skills, setSkills,
    magias, setMagias,
    listPersonagemRelacionado, setListPersonagemRelacionado,
    statusBasico, setStatusBasico,
    errors, userError, setUserError, raceError, setRaceError,
    listCities, loadingCities,
    listRaces, loadingRaces, selectedRace,
    personagens, allPersonagens, searchTerm, loadingPersonagens,
    searchPersonagens,
    handleAddTag,
    handleRemoveTag,
    xp, setXp,
    level, setLevel,
    atributosPrincipais, setAtributosPrincipais,
    atributosSecundarios, setAtributosSecundarios,
    defesas, setDefesas,
    listItens, handleSelectItem,
  } = useFormCharacter({ contentType });
  
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = tagInputRef.current;
    if (!input) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    };

    input.addEventListener('keydown', handleKeyDown);
    return () => input.removeEventListener('keydown', handleKeyDown);
  }, [handleAddTag]);

  const raceImageUrl = React.useMemo(() => 
    selectedRace?.imagem ?? '',
    [selectedRace]
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

  const itemColumns = React.useMemo(() => createItemColumns(theme, neon), [theme, neon]);
  const skillsColumns = React.useMemo(() => createSkillsColumns(theme, neon), [theme, neon]);
  const magiasColumns = React.useMemo(() => createMagiasColumns(theme, neon), [theme, neon]);
  const inventario = getInventarioItems(itens);
  const updateInventario = (updatedItems: Item[]) => setItens(replaceItemSection(itens, 'inventario', updatedItems));
  const updateProteses = (updatedItems: Item[]) => setItens(
    replaceItemSection(itens, 'proteses', updatedItems.map((item) => ({ ...item, tipo: 'implante' }))),
  );
  
                console.log("🚀 ~ FormCharacter ~ allPersonagens:", allPersonagens)
  return (
    <FormController onSubmit={handleSubmit}>
      {step === 1 && (
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
                onChange={(e) => handleRaceChange(Number(e.target.value))}
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
                mobileSize="main"
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

          <RichTextEditor
            theme={theme}
            neon={neon}
            label="História"
            value={history}
            onChange={setHistory}
            minHeight="150px"
            placeholder="Escreva a história do personagem..."
            expandable
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
              suggestions={personagens.map(p => `${p.idpersonagem}|${p.nome}`)}
              onSelectSuggestion={(suggestion) => {
                const [idStr] = suggestion.split('|');
                const id = parseInt(idStr);
                const personagem = allPersonagens.find(p => p.idpersonagem === id);
                console.log("🚀 ~ FormCharacter ~ personagem:", personagem)
                if (personagem) {
                  setListPersonagemRelacionado(prev => {
                    if (prev.some(item => item.id === personagem.idpersonagem)) {
                      toast.error("Esse personagem já está vinculado.");
                      return prev;
                    }
                    return [...prev, { id: personagem.idpersonagem, nome: personagem.nome }];
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
            {listPersonagemRelacionado.length > 0 && (
              <RelatedCharactersSection fullWidth>
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
            <TextArea
              theme={theme}
              neon={neon}
              label="Costumes"
              value={costumes}
              onChange={(e) => setCostumes(e.target.value)}
              fullWidth
            />
          </GridInputs>

          <RelatedCharactersSection fullWidth>
            <SectionTitle theme={theme} neon={neon}>
              Tags (Opcional)
            </SectionTitle>
            <InputText
              ref={tagInputRef}
              theme={theme}
              neon={neon}
              label="Adicionar tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              width="100%"
            />
            {tags.length > 0 && (
              <HorizontalList
                theme={theme}
                neon={neon}
                data={tags.map((tag, index) => ({ id: index, nome: tag }))}
                canDelete={(item) => !contentType || item.nome.localeCompare(contentType, undefined, { sensitivity: 'accent' }) !== 0}
                onDelete={(id) => {
                  const tagToRemove = tags[id as number];
                  if (tagToRemove) {
                    handleRemoveTag(tagToRemove);
                  }
                }}
              />
            )}
          </RelatedCharactersSection>

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

          <CheckboxSection>
            <CheckBox
              neon={neon}
              label="Personagem visível"
              checked={visivel}
              onChange={(checked) => setVisivel(checked)}
            />
            <FeaturedToggle featured={destaque} onChange={setDestaque} />
          </CheckboxSection>

          <ImageGalleryWithCrop
            theme={theme}
            neon={neon}
            label="Galeria de Imagens (Opcional)"
            imageUrls={galeriaUrls}
            imageShapes={galeriaShapes}
            onAdd={handleGaleriaUpload}
            onRemove={handleRemoveGaleriaImage}
          />
        </>
      )}
      {step === 2 && 
        <>
          <StatusHeader>
            <HeaderInfo>
              <LabelInfoBox theme={theme} neon={neon}>
                <LabelStatus>Nome: {userName}</LabelStatus>
              </LabelInfoBox>
              <LabelInfoBox theme={theme} neon={neon}>
                <LabelStatus>Raça: {selectedRace?.nome}</LabelStatus>
              </LabelInfoBox>
              <LabelInfoBox theme={theme} neon={neon}>
                <>
                  <LabelStatus>Xp: </LabelStatus>
                  <MinimalInput value={xp} onChange={(e) => setXp(Number(e.target.value))} />
                </>
              </LabelInfoBox>
              <LabelInfoBox theme={theme} neon={neon}>
                <>
                  <LabelStatus>Nível: </LabelStatus>
                  <MinimalInput value={level} onChange={(e) => setLevel(Number(e.target.value))} />
                </>
              </LabelInfoBox>
              <LabelInfoBox theme={theme} neon={neon}>
                <>
                  <LabelStatus>Carga: </LabelStatus>
                  <MinimalInput
                    value={statusBasico.capacidadeCarga}
                    onChange={(e) =>
                      setStatusBasico((prev) => ({ ...prev, capacidadeCarga: Number(e.target.value) }))
                    } 
                  />
                </>
              </LabelInfoBox>
            </HeaderInfo>
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
          </StatusHeader>
          <StatusContent>
            
            <AtributeController>
              <StatusAtributosDiv theme={theme} neon={neon}>
                <LabelStatus width='16px'>Principais</LabelStatus>
                {Object.entries(atributosPrincipais).map(([key, value]) => (
                  <AtributoDiv key={key}>
                    <LabelStatus width='13px'>{key}</LabelStatus>
                    <AtributoBox theme={theme} neon={neon}>
                      <MinimalInput
                        type="number"
                        value={value}
                        onChange={(e) =>
                          setAtributosPrincipais({
                            ...atributosPrincipais,
                            [key]: Number(e.target.value),
                          })
                        }
                      />
                    </AtributoBox>
                  </AtributoDiv>
                ))}
              </StatusAtributosDiv>
            </AtributeController>

            <StatusContentCenter>
              <StatusDefesaController theme={theme} neon={neon}>
                <LabelStatus>Defesas</LabelStatus>
                <StatusDefesaDiv>
                  {Object.entries(defesas).map(([key, value]) => (
                    <AtributoDiv key={key}>
                      <LabelStatus width='13px'>{key}</LabelStatus>
                      <AtributoBox theme={theme} neon={neon}>
                        <MinimalInput
                          type="number"
                          value={value}
                          onChange={(e) =>
                            setDefesas({
                              ...defesas,
                              [key]: Number(e.target.value),
                            })
                          }
                        />
                      </AtributoBox>
                    </AtributoDiv>
                  ))}
                </StatusDefesaDiv>
              </StatusDefesaController>
              <StatusImageDiv>
                  <InfoImage
                    src={raceImageUrl}
                    alt={selectedRace?.nome || 'Background'}
                  />
                  {avatarUrl && (
                    <AvatarController hasImage={!!avatarUrl}>
                      <img 
                        src={avatarUrl} 
                        alt="Avatar do personagem"
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    </AvatarController>
                  )}
              </StatusImageDiv>
            </StatusContentCenter>
            
            <StatusAtributosDiv theme={theme} neon={neon}>
              <LabelStatus width='16px'>Secundários</LabelStatus>
              {Object.entries(atributosSecundarios).map(([key, value]) => (
                <AtributoDiv key={key}>
                  <LabelStatus width='13px'>{key}</LabelStatus>
                  <AtributoBox theme={theme} neon={neon}>
                    <MinimalInput
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setAtributosSecundarios({
                          ...atributosSecundarios,
                          [key]: Number(e.target.value),
                        })
                      }
                    />
                  </AtributoBox>
                </AtributoDiv>
              ))}
            </StatusAtributosDiv>

          </StatusContent>
        </>
      }

      <NavegationButtons>
        <CyberButton
          colorType="secondary"
          theme={theme}
          neon={neon}
          text="Anterior"
          width="200px"
          onClick={handlePrev}
          type="button"
          disabled={isFirstStep}
        />
        
        <CyberButton
          theme={theme}
          neon={neon}
          text={isLastStep ? "Finalizar" : "Próximo"}
          width="200px"
          type="button"
          onClick={isLastStep ? handleSubmit : handleNext}
        />
      </NavegationButtons>

    </FormController>
  );
};
