import React, { useState, useEffect, useMemo } from 'react';
import { BiTrash, BiChevronUp, BiChevronDown } from 'react-icons/bi';
import {
  PageBlock,
  RelatedEntityReference,
  EntityKind,
} from '../../../../../../../models/Pages';
import { Select } from '../../../../../../../components/Generic/Select/Select';
import { CyberButton } from '../../../../../../../components/Generic/HighlightButton/HighlightButton';

import { getCidades } from '../../../../../../../services/cidadesService';
import { getRacas } from '../../../../../../../services/racasService';
import { getItens } from '../../../../../../../services/itensService';
import { getPersonagens } from '../../../../../../../services/personagensService';
import {
  RelationContainer,
  EntityDisplay,
  EntityContent,
  EntityImage,
  EntityDetails,
  EntityName,
  EntityType,
  ReferenceList,
  ReferenceItem,
  ReferenceHeader,
  RemoveButton,
  AddReferenceRow,
  EmptyMessage,
  ReferenceTypeHeader,
  ReferenceOrderButtons,
  OrderButton,
} from './RelationBlockEditor.style';

interface RelationBlockEditorProps {
  block: PageBlock;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onUpdate: (content: RelatedEntityReference[]) => void;
}

const ENTITY_KINDS: EntityKind[] = ['Cidade', 'Personagem', 'Item', 'Raca'];

const normalizeContent = (raw: any): RelatedEntityReference[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'idEntidade' in raw) {
    return [raw as RelatedEntityReference];
  }
  return [];
};

// Extrai o id de uma entidade suportando AMBOS os casos
// (PascalCase vindo da API e camelCase vindo do frontend)
const extractEntityId = (entity: any): string => {
  const id =
    entity?.Idcidade ??
    entity?.idcidade ??
    entity?.Idraca ??
    entity?.idraca ??
    entity?.IdItem ??
    entity?.iditem ??
    entity?.Idpersonagem ??
    entity?.idpersonagem;
  return id === undefined || id === null ? '' : String(id);
};

const extractEntityName = (entity: any): string => {
  return entity?.Nome || entity?.nome || 'Sem nome';
};

const extractEntityImage = (entity: any): string | undefined => {
  return entity?.Imagem || entity?.imagem || undefined;
};

export const RelationBlockEditor: React.FC<RelationBlockEditorProps> = ({
  block,
  theme,
  neon,
  onUpdate,
}) => {
  const references = useMemo<RelatedEntityReference[]>(
    () => normalizeContent(block.conteudo),
    [block.conteudo]
  );

  // Tipo de entidade que o usuário está escolhendo no momento para a nova referência
  const [pickingType, setPickingType] = useState<EntityKind>('Cidade');
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // IDs já usados neste bloco (para evitar duplicatas)
  const usedIds = useMemo(() => {
    const set = new Set<string>();
    references.forEach(r => set.add(`${r.tipoEntidade}:${String(r.idEntidade)}`));
    return set;
  }, [references]);

  // Carregar entidades conforme o tipo muda
  useEffect(() => {
    let cancelled = false;

    const loadEntities = async () => {
      setLoading(true);
      setSelectedEntityId('');
      setLoadError(null);
      try {
        let list: any[] = [];

        switch (pickingType) {
          case 'Cidade': {
            const result = await getCidades();
            list = result?.cidades || [];
            break;
          }
          case 'Raca': {
            const result = await getRacas();
            list = result?.racas || [];
            break;
          }
          case 'Item': {
            const result = await getItens();
            list = Array.isArray(result) ? result : [];
            break;
          }
          case 'Personagem': {
            const result = await getPersonagens();
            list = Array.isArray(result) ? result : [];
            break;
          }
        }

        if (!cancelled) {
          setEntities(list);
        }
      } catch (err) {
        console.error('Erro ao carregar entidades:', err);
        if (!cancelled) {
          setEntities([]);
          setLoadError('Erro ao carregar a lista. Tente novamente.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEntities();
    return () => {
      cancelled = true;
    };
  }, [pickingType]);

  const handleSelectEntity = (id: string) => {
    setSelectedEntityId(id);
  };

  const handleAddReference = () => {
    if (!selectedEntityId) return;

    const entity = entities.find(e => extractEntityId(e) === selectedEntityId);
    if (!entity) return;

    const newRef: RelatedEntityReference = {
      idEntidade: selectedEntityId,
      tipoEntidade: pickingType,
      nome: extractEntityName(entity),
      imagem: extractEntityImage(entity),
    };

    onUpdate([...references, newRef]);
    setSelectedEntityId('');
  };

  const handleRemoveReference = (index: number) => {
    onUpdate(references.filter((_, i) => i !== index));
  };

  const handleMoveReference = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= references.length) return;
    const next = [...references];
    [next[index], next[target]] = [next[target], next[index]];
    onUpdate(next);
  };

  // Opções do dropdown - filtradas para o tipo atual e removendo duplicatas
  const entityOptions = useMemo(() => {
    return entities
      .filter(e => {
        const id = extractEntityId(e);
        if (!id) return false;
        return !usedIds.has(`${pickingType}:${id}`);
      })
      .map(e => ({
        value: extractEntityId(e),
        label: extractEntityName(e),
      }));
  }, [entities, usedIds, pickingType]);

  // Encontra a entidade selecionada para mostrar a prévia
  const previewEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find(e => extractEntityId(e) === selectedEntityId) || null;
  }, [selectedEntityId, entities]);

  // Agrupa referências por tipo para a lista do editor
  const grouped = useMemo(() => {
    const map = new Map<EntityKind, { ref: RelatedEntityReference; globalIndex: number }[]>();
    references.forEach((ref, globalIndex) => {
      const key = (ref.tipoEntidade || 'Outro') as EntityKind;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ref, globalIndex });
    });
    return Array.from(map.entries());
  }, [references]);

  return (
    <RelationContainer>
      <AddReferenceRow>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <Select
            theme={theme}
            neon={neon}
            label="Tipo de Entidade"
            options={ENTITY_KINDS.map(k => ({ value: k, label: k }))}
            value={pickingType}
            onChange={(e) => setPickingType(e.target.value as EntityKind)}
            width="100%"
          />
        </div>

        <div style={{ flex: 2, minWidth: '220px' }}>
          <Select
            theme={theme}
            neon={neon}
            label="Selecionar Entidade"
            options={entityOptions}
            value={selectedEntityId}
            onChange={(e) => handleSelectEntity(e.target.value)}
            width="100%"
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <CyberButton
            theme={theme}
            neon={neon}
            text="Adicionar"
            type="button"
            onClick={handleAddReference}
            disabled={!selectedEntityId}
            width="140px"
          />
        </div>
      </AddReferenceRow>

      {loadError && (
        <EmptyMessage $isDark={theme === 'dark'}>{loadError}</EmptyMessage>
      )}

      {!loadError && entityOptions.length === 0 && !loading && (
        <EmptyMessage $isDark={theme === 'dark'}>
          Nenhuma {pickingType.toLowerCase()} disponível para adicionar.
        </EmptyMessage>
      )}

      {previewEntity && (
        <EntityDisplay $isDark={theme === 'dark'}>
          <EntityContent>
            {extractEntityImage(previewEntity) && (
              <EntityImage
                src={extractEntityImage(previewEntity)}
                alt={extractEntityName(previewEntity)}
              />
            )}
            <EntityDetails>
              <EntityName>{extractEntityName(previewEntity)}</EntityName>
              <EntityType>Tipo: {pickingType}</EntityType>
            </EntityDetails>
          </EntityContent>
        </EntityDisplay>
      )}

      {references.length === 0 ? (
        <EmptyMessage $isDark={theme === 'dark'}>
          Nenhuma referência adicionada. Escolha o tipo de entidade e selecione um
          item para adicioná-lo à lista.
        </EmptyMessage>
      ) : (
        <ReferenceList>
          {grouped.map(([tipo, items]) => (
            <div key={tipo}>
              <ReferenceTypeHeader>{tipo}s ({items.length})</ReferenceTypeHeader>
              {items.map(({ ref, globalIndex }) => {
                const key = `${ref.tipoEntidade}:${String(ref.idEntidade)}:${globalIndex}`;
                return (
                  <ReferenceItem key={key} $isDark={theme === 'dark'}>
                    <ReferenceHeader>
                      <EntityType style={{ margin: 0 }}>
                        {String(ref.idEntidade)}
                      </EntityType>
                      <ReferenceOrderButtons>
                        <OrderButton
                          type="button"
                          onClick={() => handleMoveReference(globalIndex, 'up')}
                          disabled={globalIndex === 0}
                          title="Mover para cima"
                        >
                          <BiChevronUp />
                        </OrderButton>
                        <OrderButton
                          type="button"
                          onClick={() => handleMoveReference(globalIndex, 'down')}
                          disabled={globalIndex === references.length - 1}
                          title="Mover para baixo"
                        >
                          <BiChevronDown />
                        </OrderButton>
                        <RemoveButton
                          type="button"
                          onClick={() => handleRemoveReference(globalIndex)}
                          title="Remover referência"
                        >
                          <BiTrash />
                        </RemoveButton>
                      </ReferenceOrderButtons>
                    </ReferenceHeader>
                    <EntityDisplay $isDark={theme === 'dark'}>
                      <EntityContent>
                        {ref.imagem && (
                          <EntityImage src={ref.imagem} alt={ref.nome || 'Referência'} />
                        )}
                        <EntityDetails>
                          <EntityName>{ref.nome || 'Sem nome'}</EntityName>
                          <EntityType>Tipo: {ref.tipoEntidade}</EntityType>
                        </EntityDetails>
                      </EntityContent>
                    </EntityDisplay>
                  </ReferenceItem>
                );
              })}
            </div>
          ))}
        </ReferenceList>
      )}

      {references.length > 0 && (
        <p style={{ fontSize: '12px', opacity: 0.7, margin: 0 }}>
          {references.length} referência(s) adicionada(s)
        </p>
      )}
    </RelationContainer>
  );
};
