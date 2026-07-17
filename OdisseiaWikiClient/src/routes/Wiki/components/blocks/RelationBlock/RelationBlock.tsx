import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BiNote,
  BiUserCircle,
  BiGift,
  BiShapeSquare,
  BiChevronLeft,
  BiChevronRight,
} from 'react-icons/bi';
import { RelationBlockProps } from './types';
import { RelatedEntityReference } from '../../../../../models/Pages';
import { normalizeImagePath } from '../../../utils/imagePathHelper';
import {
  RelationBlockContainer,
  RelationItemsGrid,
  RelationCard,
  RelationCardImage,
  RelationCardPlaceholder,
  RelationCardContent,
  RelationCardTitle,
  RelationCardType,
  ErrorMessage,
  TypeIconWrapper,
  TypeLabel,
  RelationTypeGroup,
  RelationTypeGroupHeader,
  CarouselWrapper,
  CarouselViewport,
  CarouselArrow,
} from './RelationBlock.style';
import { getPersonagens, getPersonagensByIds } from '../../../../../services/personagensService';
import { getCidadesByIds } from '../../../../../services/cidadesService';
import { getRacasByIds } from '../../../../../services/racasService';
import { getItensByIds } from '../../../../../services/itensService';
import TitleGlitch from '../../../../../components/Generic/TitleGlitch/TitleGlitch';

const typeIcons: Record<string, React.ReactNode> = {
  Cidade: <BiNote />,
  Personagem: <BiUserCircle />,
  Item: <BiGift />,
  Raca: <BiShapeSquare />,
};

const normalizeRelations = (raw: any): RelatedEntityReference[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && 'idEntidade' in raw) {
    return [raw as RelatedEntityReference];
  }
  return [];
};

interface RelationTypeCarouselProps {
  tipo: string;
  items: RelatedEntityReference[];
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}

const RelationTypeCarousel: React.FC<RelationTypeCarouselProps> = ({ tipo, items, theme: _theme, neon: _neon }) => {
  const CAROUSEL_LIMIT = 4;
  const navigate = useNavigate();
  const [entityMap, setEntityMap] = useState<Record<string, any>>({});

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDrag = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || items.length <= CAROUSEL_LIMIT) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [items.length, updateScrollButtons]);

  useEffect(() => {
    let cancelled = false;
    const fetchEntities = async () => {
      const map: Record<string, any> = {};

      // group ids per type
      const idsByType: Record<string, Set<string>> = {};
      items.forEach(r => {
        const tipo = r.tipoEntidade || 'Outro';
        if (!idsByType[tipo]) idsByType[tipo] = new Set<string>();
        if (r.idEntidade != null && String(r.idEntidade).toString().trim() !== '') idsByType[tipo].add(String(r.idEntidade));
      });

      const jobs: Promise<void>[] = [];

      const pushToMap = (tipo: string, list: any[], idFieldCandidates: string[]) => {
        list.forEach(ent => {
          let idVal: any = undefined;
          for (const f of idFieldCandidates) {
            if (ent && ent[f] !== undefined && ent[f] !== null) { idVal = ent[f]; break; }
          }
          if (idVal === undefined || idVal === null) idVal = ent?.id ?? ent?.Id;
          const key = `${tipo}:${String(idVal)}`;
          map[key] = ent;
        });
      };

      Object.keys(idsByType).forEach(tipo => {
        const ids = Array.from(idsByType[tipo]);
        if (ids.length === 0) return;
        switch (tipo) {
          case 'Personagem':
            jobs.push((async () => {
              try {
                const list = await getPersonagensByIds(ids);
                pushToMap('Personagem', list, ['idpersonagem', 'Idpersonagem', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          case 'Cidade':
            jobs.push((async () => {
              try {
                const list = await getCidadesByIds(ids.map(i => Number(i)));
                pushToMap('Cidade', list, ['idcidade', 'Idcidade', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          case 'Raca':
            jobs.push((async () => {
              try {
                const list = await getRacasByIds(ids.map(i => Number(i)));
                pushToMap('Raca', list, ['idraca', 'Idraca', 'id']);
              } catch { /* ignore */ }
            })());
            break;
          case 'Item':
            jobs.push((async () => {
              try {
                const list = await getItensByIds(ids);
                pushToMap('Item', list, ['iditem', 'IdItem', 'id']);
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

    fetchEntities();
    return () => { cancelled = true; };
  }, [items]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    setIsDragging(true);
    didDrag.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const el = viewportRef.current;
    if (el) el.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = viewportRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    el.scrollLeft = dragScrollLeft.current - walk;
    didDrag.current = true;
  };

  const handleMouseLeave = () => {
    if (isDragging) handleMouseUp();
  };

  const renderRelationItem = (relation: RelatedEntityReference, index: number) => {
    const key = `${tipo}:${String(relation.idEntidade)}:${index}`;
    const handleClick = () => {
      if (didDrag.current) {
        didDrag.current = false;
        return;
      }
      // navigate to entity page when clicking a personagem
      if (relation.tipoEntidade === 'Personagem') {
        // attempt direct navigation first
        if (relation.idEntidade != null && String(relation.idEntidade).trim() !== '') {
          navigate(`/personagem/${relation.idEntidade}`);
          return;
        }

        // if relation has no idEntidade or navigation didn't occur, try resolving from cached entityMap
        const resolvedEnt = entityMap[`${relation.tipoEntidade}:${String(relation.idEntidade)}`];
        if (resolvedEnt) {
          const resolvedId = (resolvedEnt as any).idpersonagem ?? (resolvedEnt as any).Idpersonagem ?? (resolvedEnt as any).id ?? undefined;
          if (resolvedId != null) {
            navigate(`/personagem/${resolvedId}`);
            return;
          }
        }

        // defensive: try to resolve by image filename if id seems wrong/missing
        if (relation.imagem) {
          (async () => {
            try {
              const list = await getPersonagens();
              const imageName = String(relation.imagem).split('/').pop();
              const found = list.find((p: any) => {
                const img = p?.imagem || p?.Imagem || '';
                return String(img).endsWith(imageName || '');
              });
              if (found) {
                const id = (found as any).idpersonagem ?? (found as any).Idpersonagem ?? (found as any).id ?? undefined;
                if (id != null) navigate(`/personagem/${id}`);
              }
            } catch (err) {
              // ignore resolution failure
            }
          })();
        }
        return;
      }
    };

    const ent = entityMap[`${relation.tipoEntidade}:${String(relation.idEntidade)}`];
    const name = ent ? (ent.Nome || ent.nome || ent.nome) : (relation.nome || 'Sem nome');
    const img = ent ? (ent.Imagem || ent.imagem || relation.imagem) : relation.imagem;

    return (
      <RelationCard key={key} type="button" onClick={handleClick}>
        {img ? (
          <RelationCardImage
            $entityType={relation.tipoEntidade}
            src={normalizeImagePath(img as string)}
            fallbackIcon={typeIcons[relation.tipoEntidade as string] || <BiUserCircle />}
            alt={name || 'Relação'}
          />
        ) : (
          <RelationCardPlaceholder $entityType={relation.tipoEntidade}>
            {typeIcons[relation.tipoEntidade as string] || <BiUserCircle />}
          </RelationCardPlaceholder>
        )}
        <RelationCardContent>
          <RelationCardTitle>{name}</RelationCardTitle>
          <RelationCardType>{relation.tipoEntidade}</RelationCardType>
        </RelationCardContent>
      </RelationCard>
    );
  };

  if (items.length > CAROUSEL_LIMIT) {
    return (
      <CarouselWrapper>
        <CarouselArrow
          $direction="left"
          disabled={!canScrollLeft}
          onClick={() => {
            const el = viewportRef.current;
            if (!el) return;
            const itemWidth = el.querySelector('button')?.offsetWidth ?? 220;
            const gap = 12;
            el.scrollBy({ left: -(itemWidth + gap), behavior: 'smooth' });
          }}
          aria-label="Anterior"
        >
          <BiChevronLeft />
        </CarouselArrow>

        <CarouselViewport
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onDragStart={e => e.preventDefault()}
        >
          {items.map((relation, index) => renderRelationItem(relation, index))}
        </CarouselViewport>

        <CarouselArrow
          $direction="right"
          disabled={!canScrollRight}
          onClick={() => {
            const el = viewportRef.current;
            if (!el) return;
            const itemWidth = el.querySelector('button')?.offsetWidth ?? 220;
            const gap = 12;
            el.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
          }}
          aria-label="Próximo"
        >
          <BiChevronRight />
        </CarouselArrow>
      </CarouselWrapper>
    );
  }

  return (
    <RelationItemsGrid>
      {items.map((relation, index) => renderRelationItem(relation, index))}
    </RelationItemsGrid>
  );
};

export const RelationBlock: React.FC<RelationBlockProps> = ({ block, theme, neon }) => {
  const relations = useMemo(
    () => normalizeRelations(block.conteudo),
    [block.conteudo]
  );

  

  if (relations.length === 0) {
    return (
      <ErrorMessage>
        <p>Nenhuma referência disponível neste bloco</p>
      </ErrorMessage>
    );
  }

  const grouped = useMemo(() => {
    const map = new Map<string, RelatedEntityReference[]>();
    relations.forEach(r => {
      const key = r.tipoEntidade || 'Outro';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [relations]);

  return (
    <RelationBlockContainer>
      <TitleGlitch theme={theme ?? 'dark'} neon={neon ?? 'off'} text="Referencias" />
      {grouped.map(([tipo, items]) => (
        <RelationTypeGroup key={tipo}>
          <RelationTypeGroupHeader>
            <TypeIconWrapper>
              {typeIcons[tipo] || <BiUserCircle />}
            </TypeIconWrapper>
            <TypeLabel>
              {tipo}s ({items.length})
            </TypeLabel>
          </RelationTypeGroupHeader>

          <RelationTypeCarousel tipo={tipo} items={items} theme={theme} neon={neon} />
        </RelationTypeGroup>
      ))}
    </RelationBlockContainer>
  );
};

