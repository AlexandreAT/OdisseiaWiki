import React from 'react'
import { PersonagemJogador } from '../../../../models/PersonagemJogador';
import { useFormUserCharacter } from '../CharacterCreate/useFormUserCharacter';
import { AtributeController, AtributoBox, AtributoDiv, AvatarController, BottomContentController, FormController, FormEditController, HeaderInfo, InfoImage, LabelStatus, MinimalInput, NavegationButtons, SectionStatus, SectionTable, StatusAtributosDiv, StatusContent, StatusContentCenter, StatusDefesaController, StatusDefesaDiv, StatusHeader, StatusImageDiv, TableTitle } from '../CharacterCreate/FormUserCharacter/FormUserCharacter.style';
import { LabelInfoBox } from '../../../../components/Generic/LabelInfoBox/LabelInfoBox';
import { StatusInput } from '../../../../components/Generic/StatusInput/StatusInput';
import { AvatarIcon } from '../../../../components/Generic/AvatarIcon/AvatarIcon';
import { CyberButton } from '../../../../components/Generic/HighlightButton/HighlightButton';
import { Item } from '../../../../models/Itens';
import { Skills } from '../../../../models/Skills';
import { Magia } from '../../../../models/Magias';
import { DataTable } from '../../../../components/Generic/DataTable/DataTable';
import { createItemColumns, createSkillsColumns, createMagiasColumns } from '../CharacterCreate/tableColumnsConfig';

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

    const itemColumns = React.useMemo(() => createItemColumns(theme, neon), [theme, neon]);
    const skillsColumns = React.useMemo(() => createSkillsColumns(theme, neon), [theme, neon]);
    const magiasColumns = React.useMemo(() => createMagiasColumns(theme, neon), [theme, neon]);

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