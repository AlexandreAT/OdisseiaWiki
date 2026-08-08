import React from 'react'
import { AtributeController, AtributoBox, AtributoDiv, AvatarController, HeaderInfo, InfoImage, LabelStatus, MinimalInput, SectionStatus, StatusAtributosDiv, StatusContent, StatusContentCenter, StatusDefesaController, StatusDefesaDiv, StatusHeader, StatusImageDiv } from '../FormUserCharacter.style';
import { LabelInfoBox } from '../../../../../../components/Generic/LabelInfoBox/LabelInfoBox';
import { StatusInput } from '../../../../../../components/Generic/StatusInput/StatusInput';
import { AvatarIcon } from '../../../../../../components/Generic/AvatarIcon/AvatarIcon';
import { StatusFormProps } from './StatusForm.type';
import {
  getRuntimeAttributeFields,
  getRuntimeDefenseFields,
  getRuntimeResourceFields,
  getRuntimeResourceLabel,
} from '../../../../../../utils/systemRuntimeCharacter';
import {
  CharacterComparisonButton,
  CharacterComparisonModal,
  createCharacterComparisonData,
} from '../../../../../../components/CharacterComparison';

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
  runtimeContext,
  comparisonSource,
  comparisonId,
  comparisonTableId,
  comparisonTableName,
  comparisonSkillCount = 0,
}) => {
  const [comparisonOpen, setComparisonOpen] = React.useState(false);
  const primaryFields = React.useMemo(
    () => getRuntimeAttributeFields(runtimeContext, 'Principal', atributosPrincipais),
    [atributosPrincipais, runtimeContext],
  );
  const secondaryFields = React.useMemo(
    () => getRuntimeAttributeFields(runtimeContext, 'Secundario', atributosSecundarios),
    [atributosSecundarios, runtimeContext],
  );
  const defenseFields = React.useMemo(
    () => getRuntimeDefenseFields(runtimeContext, defesas),
    [defesas, runtimeContext],
  );
  const resourceFields = React.useMemo(
    () => getRuntimeResourceFields(runtimeContext, statusBasico),
    [runtimeContext, statusBasico],
  );
  const extraResources = resourceFields.filter(
    ({ key }) => !['vida', 'estamina', 'mana', 'capacidadeCarga'].includes(key),
  );
  const capacityLabel = getRuntimeResourceLabel(
    runtimeContext,
    'capacidadeCarga',
    'Carga',
  );
  const comparisonCharacter = React.useMemo(() => comparisonSource
    ? createCharacterComparisonData({
        id: comparisonId,
        origem: comparisonSource,
        nome: userName,
        imagem: avatarUrl,
        idMesa: comparisonTableId,
        mesaNome: comparisonTableName,
        quantidadeSkills: comparisonSkillCount,
        sistemaRuntime: runtimeContext,
        status: {
          status: statusBasico,
          atributos: {
            principais: atributosPrincipais,
            secundarios: atributosSecundarios,
          },
          nivel: level,
          xp,
          defesas,
        },
      })
    : null, [
      atributosPrincipais,
      atributosSecundarios,
      avatarUrl,
      comparisonId,
      comparisonSkillCount,
      comparisonSource,
      comparisonTableId,
      comparisonTableName,
      defesas,
      level,
      runtimeContext,
      statusBasico,
      userName,
      xp,
    ]);

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
              <MinimalInput min={0} value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </>
          </LabelInfoBox>
          <LabelInfoBox theme={theme} neon={neon}>
            <>
              <LabelStatus>Nível: </LabelStatus>
              <MinimalInput
                min={1}
                max={runtimeContext?.progressao?.nivelMaximo}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
            </>
          </LabelInfoBox>
          <LabelInfoBox theme={theme} neon={neon}>
            <>
            <LabelStatus>{capacityLabel}: </LabelStatus>
              <MinimalInput
                value={statusBasico.capacidadeCarga}
                onChange={(e) =>
                  setStatusBasico((prev) => ({ ...prev, capacidadeCarga: Number(e.target.value) }))
                } 
              />
            </>
          </LabelInfoBox>
          {extraResources.map((resource) => (
            <LabelInfoBox
              key={resource.key}
              theme={theme}
              neon={neon}
              title={resource.description}
            >
              <>
                <LabelStatus>{resource.label}: </LabelStatus>
                <MinimalInput
                  value={statusBasico[resource.key] ?? 0}
                  min={resource.min}
                  max={resource.max}
                  onChange={(event) => setStatusBasico((previous) => ({
                    ...previous,
                    [resource.key]: Number(event.target.value),
                  }))}
                />
              </>
            </LabelInfoBox>
          ))}
          {comparisonSource && (
            <CharacterComparisonButton
              theme={theme}
              neon={neon}
              onClick={() => setComparisonOpen(true)}
            />
          )}
        </HeaderInfo>
        <SectionStatus theme={theme} neon={neon}>
          <StatusInput
            theme={theme}
            neon={neon}
            type="vida"
            label={getRuntimeResourceLabel(runtimeContext, 'vida', 'Vida')}
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
            label={getRuntimeResourceLabel(runtimeContext, 'estamina', 'Estamina')}
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
            label={getRuntimeResourceLabel(runtimeContext, 'mana', 'Mana')}
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
      {comparisonSource && (
        <CharacterComparisonModal
          open={comparisonOpen}
          current={comparisonCharacter}
          source={comparisonSource}
          sourceId={comparisonId}
          tableId={comparisonTableId}
          onClose={() => setComparisonOpen(false)}
          theme={theme}
          neon={neon}
        />
      )}
      
      <StatusContent>
        <AtributeController>
          <StatusAtributosDiv theme={theme} neon={neon}>
            <LabelStatus width='16px'>Principais</LabelStatus>
            {primaryFields.map((field) => (
              <AtributoDiv key={field.key} title={field.description}>
                <LabelStatus width='13px'>{field.label}</LabelStatus>
                <AtributoBox theme={theme} neon={neon}>
                  <MinimalInput
                    type="number"
                    value={atributosPrincipais[field.key] ?? 0}
                    min={field.min}
                    max={field.max}
                    onChange={(e) =>
                      setAtributosPrincipais({
                        ...atributosPrincipais,
                        [field.key]: Number(e.target.value),
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
              {defenseFields.map((field) => (
                <AtributoDiv key={field.key} title={field.description}>
                  <LabelStatus width='13px'>{field.label}</LabelStatus>
                  <AtributoBox theme={theme} neon={neon}>
                    <MinimalInput
                      type="number"
                      value={defesas[field.key] ?? 0}
                      onChange={(e) =>
                        setDefesas({
                          ...defesas,
                          [field.key]: Number(e.target.value),
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
          {secondaryFields.map((field) => (
            <AtributoDiv key={field.key} title={field.description}>
              <LabelStatus width='13px'>{field.label}</LabelStatus>
              <AtributoBox theme={theme} neon={neon}>
                <MinimalInput
                  type="number"
                  value={atributosSecundarios[field.key] ?? 0}
                  min={field.min}
                  max={field.max}
                  onChange={(e) =>
                    setAtributosSecundarios({
                      ...atributosSecundarios,
                      [field.key]: Number(e.target.value),
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
