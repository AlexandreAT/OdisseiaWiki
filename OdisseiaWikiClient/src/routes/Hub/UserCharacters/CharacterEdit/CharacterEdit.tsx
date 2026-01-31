import React from 'react'
import { PersonagemJogador } from '../../../../models/PersonagemJogador';
import { useFormUserCharacter } from '../CharacterCreate/useFormUserCharacter';
import { AtributeController, AtributoBox, AtributoDiv, AvatarController, BottomContentController, FormController, FormEditController, HeaderInfo, InfoImage, LabelStatus, MinimalInput, NavegationButtons, SectionStatus, SectionTable, StatusAtributosDiv, StatusContent, StatusContentCenter, StatusDefesaController, StatusDefesaDiv, StatusHeader, StatusImageDiv, TableTitle } from '../CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { Select } from '../../../../components/Generic/Select/Select';
import { LabelInfoBox } from '../../../../components/Generic/LabelInfoBox/LabelInfoBox';
import { StatusInput } from '../../../../components/Generic/StatusInput/StatusInput';
import { AvatarIcon } from '../../../../components/Generic/AvatarIcon/AvatarIcon';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { Modal } from '../../../../components/Generic/Modal/Modal';
import { Item, ItemTipo } from '../../../../models/Itens';
import { atributosFormMap, atributosMagiaFormMap, atributosSkillFormMap } from '../../../Management/ManagementWiki/WikiForms/FormCriarConteúdo/FormCharacter/MapItensForm';
import { Skills, SkillTipoString } from '../../../../models/Skills';
import { Magia, MagiaTipoString } from '../../../../models/Magias';
import { DataTable } from '../../../../components/Generic/DataTable/DataTable';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  personagem: PersonagemJogador;
  userId: number;
  onSave?: () => void;
}

export const CharacterEdit = ({ theme, neon, personagem, userId, onSave }: UserCharactersProps) => {
    const {
        handleSubmit,
        handleUpdate,
        userName,
        race,
        city,
        avatarUrl,
        itens, setItens,
        skills, setSkills,
        magias, setMagias,
        statusBasico, setStatusBasico,
        listRaces,
        xp, setXp,
        level, setLevel,
        atributosPrincipais, setAtributosPrincipais,
        atributosSecundarios, setAtributosSecundarios,
        defesas, setDefesas,
        listItens, handleSelectItem,
    } = useFormUserCharacter(userId, onSave, personagem);

    const characterRace = React.useMemo(() => 
        listRaces?.find(r => r.idraca === personagem.idraca),
        [listRaces, personagem.idraca]
    );

    const raceImageUrl = React.useMemo(() => 
        characterRace?.imagem ?? '/assets_dynamic/default.png',
        [characterRace]
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

      console.log("🔵 [CharacterEdit] RENDER:");

    return (
        <FormController onSubmit={handleSubmit}> 
            <FormEditController>
              <StatusHeader>
                <HeaderInfo>
                  <LabelInfoBox theme={theme} neon={neon}>
                    <LabelStatus>Nome: {userName}</LabelStatus>
                  </LabelInfoBox>
                  <LabelInfoBox theme={theme} neon={neon}>
                    <LabelStatus>Raça: {characterRace?.nome}</LabelStatus>
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
                        alt={characterRace?.nome || 'Background'}
                      />
                      <AvatarController hasImage={personagem.imagem ? true : false} imageSize={170}>
                        <AvatarIcon
                            theme={theme}
                            neon={neon}
                            initialImage={personagem.imagem}
                            size={170}
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
            </FormEditController>
        
            <NavegationButtons>
              <CyberButton
                theme={theme}
                neon={neon}
                text={"Atualizar"}
                width="200px"
                type="button"
                onClick={handleUpdate}
              />
            </NavegationButtons>
        </FormController>
    )
}