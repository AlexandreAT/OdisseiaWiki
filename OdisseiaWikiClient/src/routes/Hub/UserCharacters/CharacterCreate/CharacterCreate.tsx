import React, { memo } from 'react'
import { FormController, NavegationButtons } from './FormUserCharacter/FormUserCharacter.style';
import { Select } from '../../../../components/Generic/Select/Select';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { useFormUserCharacter } from './useFormUserCharacter';
import { createItemColumns, createSkillsColumns, createMagiasColumns } from './tableColumnsConfig';
import { BasicInfoForm } from './FormUserCharacter/BasicInfoForm/BasicInfoForm';
import { StatusForm } from './FormUserCharacter/StatusForm/StatusForm';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  userId: number;
  onSave?: () => void;
}

const CharacterCreateComponent = ({ theme, neon, userId, onSave }: UserCharactersProps) => {
  const {
    step, handleNext, handleSubmit,
    handlePrev, isFirstStep, isLastStep,
    userName, setUserName,
    race, setRace,
    city, setCity,
    avatarUrl, setAvatarUrl,
    setAvatarFile,
    history, setHistory,
    costumes, setCostumes,
    extraInformation, setExtraInformation,
    nanites, setNanites,
    alignment, setAlignment,
    traits, setTraits,
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
    xp, setXp,
    level, setLevel,
    atributosPrincipais, setAtributosPrincipais,
    atributosSecundarios, setAtributosSecundarios,
    defesas, setDefesas,
    listItens, handleSelectItem,
    selectedMesa, listMesas, setSelectedMesa, loadingMesas,
  } = useFormUserCharacter(userId, onSave);

  const raceImageUrl = React.useMemo(() => 
    selectedRace?.imagem ? selectedRace.imagem : '/assets_dynamic/default.png',
    [selectedRace]
  );
  
  const itemColumns = React.useMemo(() => createItemColumns(theme, neon), [theme, neon]);
  const skillsColumns = React.useMemo(() => createSkillsColumns(theme, neon), [theme, neon]);
  const magiasColumns = React.useMemo(() => createMagiasColumns(theme, neon), [theme, neon]);
  
  return (
    <FormController onSubmit={handleSubmit}>
      <Select
        theme={theme}
        neon={neon}
        label="Mesa"
        options={listMesas.map(m => ({ value: m.idmesa, label: m.nome }))}
        value={selectedMesa}
        onChange={e => setSelectedMesa(Number(e.target.value))}
        width="100%"
        disabled={loadingMesas}
      />
      
      {selectedMesa && step === 1 && (
        <BasicInfoForm
          theme={theme}
          neon={neon}
          userName={userName}
          setUserName={setUserName}
          race={race}
          setRace={setRace}
          city={city}
          setCity={setCity}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          setAvatarFile={setAvatarFile}
          history={history}
          setHistory={setHistory}
          costumes={costumes}
          setCostumes={setCostumes}
          extraInformation={extraInformation}
          setExtraInformation={setExtraInformation}
          nanites={nanites}
          setNanites={setNanites}
          alignment={alignment}
          setAlignment={setAlignment}
          traits={traits}
          setTraits={setTraits}
          itens={itens}
          setItens={setItens}
          skills={skills}
          setSkills={setSkills}
          magias={magias}
          setMagias={setMagias}
          listPersonagemRelacionado={listPersonagemRelacionado}
          setListPersonagemRelacionado={setListPersonagemRelacionado}
          statusBasico={statusBasico}
          setStatusBasico={setStatusBasico}
          errors={errors}
          userError={userError}
          setUserError={setUserError}
          raceError={raceError}
          setRaceError={setRaceError}
          listCities={listCities}
          loadingCities={loadingCities}
          listRaces={listRaces}
          loadingRaces={loadingRaces}
          selectedRace={selectedRace}
          personagens={personagens}
          allPersonagens={allPersonagens}
          searchTerm={searchTerm}
          loadingPersonagens={loadingPersonagens}
          searchPersonagens={searchPersonagens}
          listItens={listItens}
          handleSelectItem={handleSelectItem}
          itemColumns={itemColumns}
          skillsColumns={skillsColumns}
          magiasColumns={magiasColumns}
        />
      )}

      {selectedMesa && step === 2 && (
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
          setAvatarUrl={setAvatarUrl}
          raceImageUrl={raceImageUrl}
        />
      )}

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
}

export const CharacterCreate = memo(CharacterCreateComponent);