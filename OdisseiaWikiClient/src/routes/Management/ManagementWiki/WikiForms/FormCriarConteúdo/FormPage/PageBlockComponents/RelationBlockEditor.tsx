import React, { useState, useEffect } from 'react';
import { PageBlock, RelatedEntityBlockContent } from '../../../../../../../models/Pages';
import { Select } from '../../../../../../../components/Generic/Select/Select';

import { getCidades } from '../../../../../../../services/cidadesService';
import { getRacas } from '../../../../../../../services/racasService';
import { getItens } from '../../../../../../../services/itensService';
import {
  RelationContainer,
  EntityDisplay,
  EntityContent,
  EntityImage,
  EntityDetails,
  EntityName,
  EntityType,
} from './RelationBlockEditor.style';

interface RelationBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: RelatedEntityBlockContent) => void;
}

export const RelationBlockEditor: React.FC<RelationBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const content = (block.conteudo as RelatedEntityBlockContent) || { 
    idEntidade: 0, 
    tipoEntidade: 'Cidade' 
  };

  const [entityType, setEntityType] = useState<'Cidade' | 'Personagem' | 'Item' | 'Raca'>(
    content.tipoEntidade || 'Cidade'
  );
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Carregar entidades conforme o tipo muda
  useEffect(() => {
    const loadEntities = async () => {
      setLoading(true);
      try {
        let result: any = null;

        switch (entityType) {
          case 'Cidade':
            result = await getCidades();
            setEntities(result.cidades || []);
            break;
          case 'Raca':
            result = await getRacas();
            setEntities(result.racas || []);
            break;
          case 'Item':
            const itensResult = await getItens();
            setEntities(itensResult || []);
            break;
          case 'Personagem':
            // TODO: Adicionar chamada para personagens quando disponível
            break;
        }

        // Tentar recuperar a entidade selecionada atual
        if (content.idEntidade && result) {
          const selected = result.find((e: any) => 
            e.Idcidade === content.idEntidade ||
            e.Idraca === content.idEntidade ||
            e.IdItem === content.idEntidade ||
            e.Idpersonagem === content.idEntidade
          );
          if (selected) {
            setSelectedEntity(selected);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar entidades:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, [entityType, content.idEntidade]);

  const getEntityId = (entity: any): number => {
    return entity.Idcidade || entity.Idraca || entity.IdItem || entity.Idpersonagem || 0;
  };

  const getEntityName = (entity: any): string => {
    return entity.Nome || entity.nome || `${entityType} ${getEntityId(entity)}`;
  };

  const handleSelectEntity = (id: number) => {
    const selected = entities.find(e => getEntityId(e) === id);
    if (selected) {
      setSelectedEntity(selected);
      onUpdate({
        idEntidade: id,
        tipoEntidade: entityType,
        nome: getEntityName(selected),
        imagem: selected.Imagem || selected.imagem,
      });
    }
  };

  const entityOptions = entities.map(e => ({
    value: getEntityId(e).toString(),
    label: getEntityName(e),
  }));

  return (
    <RelationContainer>
      <Select
        theme={theme}
        neon={neon}
        label="Tipo de Entidade"
        options={[
          { value: 'Cidade', label: 'Cidade' },
          { value: 'Raca', label: 'Raça' },
          { value: 'Item', label: 'Item' },
          { value: 'Personagem', label: 'Personagem' },
        ]}
        value={entityType}
        onChange={(e) => setEntityType(e.target.value as 'Cidade' | 'Personagem' | 'Item' | 'Raca')}
        width="100%"
      />

      <Select
        theme={theme}
        neon={neon}
        label="Selecionar Entidade"
        options={entityOptions}
        value={selectedEntity ? getEntityId(selectedEntity).toString() : ''}
        onChange={(e) => handleSelectEntity(Number(e.target.value))}
        width="100%"
        disabled={loading || entityOptions.length === 0}
      />

      {selectedEntity && (
        <EntityDisplay $isDark={theme === 'dark'}>
          <EntityContent>
            {(selectedEntity.Imagem || selectedEntity.imagem) && (
              <EntityImage
                src={selectedEntity.Imagem || selectedEntity.imagem}
                alt={getEntityName(selectedEntity)}
              />
            )}
            <EntityDetails>
              <EntityName>
                {getEntityName(selectedEntity)}
              </EntityName>
              <EntityType>
                Tipo: {entityType}
              </EntityType>
            </EntityDetails>
          </EntityContent>
        </EntityDisplay>
      )}
    </RelationContainer>
  );
};
