import React, { useState, useEffect, useMemo } from 'react';
import { BiTrash, BiChevronUp, BiChevronDown, BiInfoCircle } from 'react-icons/bi';
import {
  PageBlock,
  RelatedEntityReference,
  EntityKind,
} from '../../../../../../../models/Pages';
import { Select } from '../../../../../../../components/Generic/Select/Select';
import { CyberButton } from '../../../../../../../components/Generic/HighlightButton/HighlightButton';

import { getCidades, getCidadesByIds } from '../../../../../../../services/cidadesService';
import { getRacas, getRacasByIds } from '../../../../../../../services/racasService';
import { getItens, getItensByIds } from '../../../../../../../services/itensService';
import { getPersonagens, getPersonagensByIds } from '../../../../../../../services/personagensService';
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
  ReferenceInfo,
  ReferenceInfoButton,
  ReferenceInfoPopover,
} from './RelationBlockEditor.style';
import { normalizeImagePath } from '../../../../../../../routes/Wiki/utils/imagePathHelper';

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

// Extrai o id de uma entidade preferindo o campo do tipo atual
const extractEntityId = (entity: any, preferredType?: EntityKind): string => {
  if (!entity) return '';

  const tryKeys = (keys: string[]) => {
    for (const k of keys) {
      const v = entity?.[k];
      if (v !== undefined && v !== null && String(v).toString().trim() !== '') return String(v);
    }
    return undefined as string | undefined;
  };

  if (preferredType === 'Personagem') {
    return tryKeys(['Idpersonagem', 'idpersonagem', 'id', 'Id']) ?? '';
  }

  if (preferredType === 'Cidade') {
    return tryKeys(['Idcidade', 'idcidade', 'id', 'Id']) ?? '';
  }

  if (preferredType === 'Raca') {
    return tryKeys(['Idraca', 'idraca', 'id', 'Id']) ?? '';
  }

  if (preferredType === 'Item') {
    return tryKeys(['IdItem', 'iditem', 'idItem', 'id', 'Id']) ?? '';
  }

  // fallback (legacy fields)
  const id =
    entity?.Idcidade ??
    entity?.idcidade ??
    entity?.Idraca ??
    entity?.idraca ??
    entity?.IdItem ??
    entity?.iditem ??
    entity?.Idpersonagem ??
    entity?.idpersonagem ??
    entity?.id ??
    entity?.Id;

  return id === undefined || id === null ? '' : String(id);
};

const extractEntityName = (entity: any): string => {
  return entity?.Nome || entity?.nome || 'Sem nome';
};

const extractEntityImage = (entity: any): string | undefined => {
  return entity?.Imagem || entity?.imagem || undefined;
};

const isEntityVisible = (entity: any): boolean => entity?.Visivel === true || entity?.visivel === true;

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
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);

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
          setEntities(list.filter(isEntityVisible));
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

    const entity = entities.find(e => extractEntityId(e, pickingType) === selectedEntityId);
    if (!entity) return;

    // Only store id and type; name/image will be resolved at render time
    const newRef: RelatedEntityReference = {
      idEntidade: selectedEntityId,
      tipoEntidade: pickingType,
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
    const options = entities
      .filter(e => {
        const id = extractEntityId(e, pickingType);
        if (!id) return false;
        return !usedIds.has(`${pickingType}:${id}`);
      })
      .map(e => ({
        value: extractEntityId(e, pickingType),
        label: extractEntityName(e),
      }));

    // debug
    // console.log('RelationBlockEditor entityOptions:', options);
    return options;
  }, [entities, usedIds, pickingType]);

  // Encontra a entidade selecionada para mostrar a prévia
  const previewEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find(e => extractEntityId(e, pickingType) === selectedEntityId) || null;
  }, [selectedEntityId, entities, pickingType]);

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

  // Cache fetched entity objects for the current references (so we always show up-to-date name/image)
  const [entityMap, setEntityMap] = React.useState<Record<string, any>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      const map: Record<string, any> = {};
      const idsByType = new Map<EntityKind, Set<string>>();
      references.forEach(r => {
        const set = idsByType.get(r.tipoEntidade as EntityKind) || new Set<string>();
        if (r.idEntidade != null && String(r.idEntidade).trim() !== '') set.add(String(r.idEntidade));
        idsByType.set(r.tipoEntidade as EntityKind, set);
      });

      const jobs: Promise<void>[] = [];

      const push = (tipo: EntityKind, list: any[], idFields: string[]) => {
        list.forEach(ent => {
          let idVal: any = undefined;
          for (const f of idFields) {
            if (ent && ent[f] !== undefined && ent[f] !== null) { idVal = ent[f]; break; }
          }
          if (idVal === undefined || idVal === null) idVal = ent?.id ?? ent?.Id;
          const key = `${tipo}:${String(idVal)}`;
          map[key] = ent;
        });
      };

      idsByType.forEach((set, tipo) => {
        const ids = Array.from(set);
        if (ids.length === 0) return;
        switch (tipo) {
          case 'Personagem':
            jobs.push((async () => {
              try {
                const list = await getPersonagensByIds(ids);
                push('Personagem', list, ['idpersonagem', 'Idpersonagem', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          case 'Cidade':
            jobs.push((async () => {
              try {
                const list = await getCidadesByIds(ids.map(i => Number(i)));
                push('Cidade', list, ['idcidade', 'Idcidade', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          case 'Raca':
            jobs.push((async () => {
              try {
                const list = await getRacasByIds(ids.map(i => Number(i)));
                push('Raca', list, ['idraca', 'Idraca', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          case 'Item':
            jobs.push((async () => {
              try {
                const list = await getItensByIds(ids);
                push('Item', list, ['iditem', 'IdItem', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          default:
            break;
        }
      });

      await Promise.all(jobs);
      if (!cancelled) setEntityMap(map);
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [references]);

  return (
    <RelationContainer>
      <ReferenceInfo>
        <span>Referências da página</span>
        <ReferenceInfoButton
          type="button"
          $neon={neon === 'on'}
          aria-label="Como funcionam as referências"
          aria-expanded={showReferenceInfo}
          onClick={() => setShowReferenceInfo((visible) => !visible)}
        >
          <BiInfoCircle aria-hidden="true" />
        </ReferenceInfoButton>
        {showReferenceInfo && (
          <ReferenceInfoPopover $isDark={theme === 'dark'} $neon={neon === 'on'} role="status">
            Uma referência conecta esta página à entidade escolhida. Depois de salvar, a página passa a aparecer entre os conteúdos relacionados dessa entidade. Apenas entidades visíveis podem ser referenciadas, inclusive por administradores.
          </ReferenceInfoPopover>
        )}
      </ReferenceInfo>
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
            <EntityImage
              $entityType={pickingType}
              src={extractEntityImage(previewEntity)
                ? normalizeImagePath(extractEntityImage(previewEntity))
                : undefined}
              alt={`Imagem de ${extractEntityName(previewEntity)}`}
            />
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
                        {(() => {
                          const ent = entityMap[`${ref.tipoEntidade}:${ref.idEntidade}`];
                          const name = ent ? (ent.Nome || ent.nome || ent.nome) : ref.nome;
                          const img = ent ? (ent.Imagem || ent.imagem || ent.imagem) : (ref.imagem as string | undefined);
                          return (
                            <>
                              <EntityImage
                                $entityType={ref.tipoEntidade}
                                src={img ? normalizeImagePath(img as string) : undefined}
                                alt={`Imagem de ${name || 'referência'}`}
                              />
                              <EntityDetails>
                                <EntityName>{name || 'Sem nome'}</EntityName>
                                <EntityType>Tipo: {ref.tipoEntidade}</EntityType>
                              </EntityDetails>
                            </>
                          );
                        })()}
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
