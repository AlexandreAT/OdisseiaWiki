import React from 'react';
import { FormController, FormHeader, HeaderInputs, HeaderAvatar, GridInputs, SectionTable, TableTitle, RelatedCharactersSection, SectionTitle, SectionStatus, NavegationButtons, StatusHeader, HeaderInfo, LabelStatus, MinimalInput, StatusContent, StatusAtributosDiv, StatusImageDiv, AtributoBox, AtributoDiv, InfoImage, AvatarController, AtributeController, StatusContentCenter, StatusDefesaDiv, StatusDefesaController, InfoController } from './FormCharacter.style';
import { InputText } from '../../../../../../components/Generic/InputText/InputText';
import { Select } from '../../../../../../components/Generic/Select/Select';
import { AvatarIcon } from '../../../../../../components/Generic/AvatarIcon/AvatarIcon';
import { CyberButton } from '../../../../../../components/Generic/HighlightButton/HighlightButton';
import { TextArea } from '../../../../../../components/Generic/TextArea/TextArea';
import { Search } from '../../../../../../components/Generic/Search/Search';
import { BiSearchAlt } from 'react-icons/bi';
import { CheckSelect } from '../../../../../../components/Generic/CheckSelect/CheckSelect';
import { DataTable } from '../../../../../../components/Generic/DataTable/DataTable';
import { HorizontalList } from '../../../../../../components/Generic/HorizontalList/HorizontalList';
import { StatusInput } from '../../../../../../components/Generic/StatusInput/StatusInput';
import { useFormCharacter } from './useFormCharacter';
import toast from 'react-hot-toast';
import { LabelInfoBox } from '../../../../../../components/Generic/LabelInfoBox/LabelInfoBox';
import { Modal } from '../../../../../../components/Generic/Modal/Modal';
import { atributosFormMap, atributosMagiaFormMap, atributosSkillFormMap } from './MapItensForm';
import { Skills, SkillTipoString } from '../../../../../../models/Skills';
import { Item, ItemTipo } from '../../../../../../models/Itens';
import { Magia, MagiaTipoString } from '../../../../../../models/Magias';
import { getFirstImageUrl } from '../../../../../../utils/imagesController';
//import OrcBack from '../../../../../../assets/racas/orc/OrcBackground.jpeg';

interface FormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const TRAITS_OPTIONS = [
  { value: 'bravo', label: 'Bravo' },
  { value: 'curioso', label: 'Curioso' },
  { value: 'ambicioso', label: 'Ambicioso' },
  { value: 'leal', label: 'Leal' },
  { value: 'orgulhoso', label: 'Orgulhoso' },
  { value: 'calculista', label: 'Calculista' },
  { value: 'bondoso', label: 'Bondoso' },
  { value: 'impulsivo', label: 'Impulsivo' },
];

const ALIGNMENT_OPTIONS = [
  { value: 'leal_bondoso', label: 'Leal e Bondoso' },
  { value: 'neutro_bondoso', label: 'Neutro e Bondoso' },
  { value: 'caotico_bondoso', label: 'Caótico e Bondoso' },
  { value: 'leal_neutro', label: 'Leal Neutro' },
  { value: 'neutro', label: 'Neutro Puro' },
  { value: 'caotico_neutro', label: 'Caótico Neutro' },
  { value: 'leal_mal', label: 'Leal e Maligno' },
  { value: 'neutro_mal', label: 'Neutro e Maligno' },
  { value: 'caotico_mal', label: 'Caótico e Maligno' },
];

export const FormCharacter = ({ theme, neon }: FormProps) => {
  const {
    step, handleNext, handleSubmit,
    handlePrev, isFirstStep, isLastStep,
    userName, setUserName,
    race, setRace,
    city, setCity,
    avatarUrl, setAvatarUrl,
    avatarFile, setAvatarFile,
    history, setHistory,
    costumes, setCostumes,
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
  } = useFormCharacter();

  const raceImageUrl = React.useMemo(() => 
    selectedRace?.imagem ? selectedRace.imagem : '/assets_dynamic/default.png',
    [selectedRace]
  );
  
  const itemColumns = React.useMemo(() => [
    { key: "nome", label: "Nome", inputType: "text", width: 200 } as any,
    { key: "descricao", label: "Descrição", inputType: "text", width: 300 } as any,
    { key: "quantidade", label: "Qtd", inputType: "number", width: 80 } as any,
    { key: "peso", label: "Peso", inputType: "number", width: 80 } as any,
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
    } as any,
    {
      key: "atributos",
      label: "Atributos",
      customRender: (value: any, row: Item, onChange: (v: any) => void) => {
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
      }
    } as any,
  ], [theme, neon]);

  const skillsColumns = React.useMemo(() => [
    { key: "nome", label: "Nome", inputType: "text", width: 200 } as any,
    { key: "efeito", label: "Efeito", inputType: "text", width: 300 } as any,
    { key: "custo", label: "Custo", inputType: "string", width: 100 } as any,
    { key: "nivel", label: "Nível", inputType: "number", width: 80 } as any,
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
    } as any,
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
    } as any,
    {
      key: "atributos",
      label: "Atributos",
      customRender: (value: any, row: Skills, onChange: (v: any) => void) => {
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
      }
    } as any,
  ], [theme, neon]);

  const magiasColumns = React.useMemo(() => [
    { key: "nome", label: "Nome", inputType: "text", width: 200 } as any,
    { key: "efeito", label: "Efeito", inputType: "text", width: 300 } as any,
    { key: "custo", label: "Custo", inputType: "string", width: 100 } as any,
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
    } as any,
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
    } as any,
    {
      key: "atributos",
      label: "Atributos",
      customRender: (value: any, row: Magia, onChange: (v: any) => void) => {
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
      }
    } as any,
  ], [theme, neon]);
  
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
                onChange={(e) => setRace(Number(e.target.value))}
                onFocus={() => setRaceError(false)}
                error={raceError}
                errorMessage={errors.race}
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
              <AvatarIcon
                theme={theme}
                neon={neon}
                onFileSelect={(file) => {
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setAvatarUrl(url);
                    setAvatarFile(file); // para envio no submit
                  }
                }}
                initialImage={avatarUrl}
                size={150}
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
                editable
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, vida: Number(e.target.value) }))
                }
              />
              <StatusInput
                theme={theme}
                neon={neon}
                type="estamina"
                label="Estamina"
                value={statusBasico.estamina}
                editable
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, estamina: Number(e.target.value) }))
                }
              />
              <StatusInput
                theme={theme}
                neon={neon}
                type="mana"
                label="Mana"
                value={statusBasico.mana}
                editable
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, mana: Number(e.target.value) }))
                }
              />
            </SectionStatus>
          )}

          <TextArea
            theme={theme}
            neon={neon}
            label="História"
            value={history}
            onChange={(e) => setHistory(e.target.value)}
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
              suggestions={personagens.map(p => p.Nome)}
              onSelectSuggestion={(nome) => {
                const personagem = allPersonagens.find(p => p.Nome === nome);
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
            <TextArea
              theme={theme}
              neon={neon}
              label="Costumes"
              value={costumes}
              onChange={(e) => setCostumes(e.target.value)}
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
                editable
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, vida: Number(e.target.value) }))
                }
              />
              <StatusInput
                theme={theme}
                neon={neon}
                type="estamina"
                label="Estamina"
                value={statusBasico.estamina}
                editable
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, estamina: Number(e.target.value) }))
                }
              />
              <StatusInput
                theme={theme}
                neon={neon}
                type="mana"
                label="Mana"
                value={statusBasico.mana}
                editable
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, mana: Number(e.target.value) }))
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
                  <AvatarController hasImage={!!avatarUrl}>
                  <AvatarIcon
                    theme={theme}
                    neon={neon}
                    onFileSelect={(file) => {
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setAvatarUrl(url);
                      }
                    }}
                    initialImage={avatarUrl}
                    size={200}
                    clickable={false}
                  />
                  </AvatarController>
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