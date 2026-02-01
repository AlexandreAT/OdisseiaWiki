import React from 'react'
import { AtributeController, AtributoBox, AtributoDiv, AvatarController, HeaderInfo, InfoImage, LabelStatus, MinimalInput, SectionStatus, StatusAtributosDiv, StatusContent, StatusContentCenter, StatusDefesaController, StatusDefesaDiv, StatusHeader, StatusImageDiv } from '../FormUserCharacter.style';
import { LabelInfoBox } from '../../../../../../components/Generic/LabelInfoBox/LabelInfoBox';
import { StatusInput } from '../../../../../../components/Generic/StatusInput/StatusInput';
import { AvatarIcon } from '../../../../../../components/Generic/AvatarIcon/AvatarIcon';
import { StatusFormProps } from './StatusForm.type';

export const StatusForm: React.FC<StatusFormProps> = ({
  theme,
  neon,
  userName,
  selectedRace,
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
  avatarUrl,
  setAvatarUrl,
  raceImageUrl,
}) => {
  return (
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
  );
};
