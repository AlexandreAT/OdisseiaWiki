import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CidadePayload, getCidadeById } from '../../services/cidadesService';
import { getPagesReferencingEntity } from '../../services/pageService';
import { getPersonagens, PersonagemPayload } from '../../services/personagensService';
import { CidadeModal, CidadePoint, CidadeRelatedPage, CityGalleryImage } from './CidadePage.types';
import { detectImageShapeFromUrl, ImageDisplayShape } from '../../utils/imageDisplayShape';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import { normalizeGalleryImages } from '../../models/GalleryImage';

const compareByName = <T,>(getName: (item: T) => string) => (left: T, right: T) => (
  getName(left).localeCompare(getName(right), 'pt-BR', { sensitivity: 'base' })
);

const hasRichTextContent = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (!value || typeof value !== 'object') return false;

  if ('text' in value && typeof value.text === 'string' && value.text.trim()) return true;
  if ('content' in value && Array.isArray(value.content)) {
    return value.content.some(hasRichTextContent);
  }

  return false;
};

export const useCidadePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [city, setCity] = useState<CidadePayload | null>(null);
  const [characters, setCharacters] = useState<PersonagemPayload[]>([]);
  const [points, setPoints] = useState<CidadePoint[]>([]);
  const [relatedPages, setRelatedPages] = useState<CidadeRelatedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [galleryShapes, setGalleryShapes] = useState<ImageDisplayShape[]>([]);
  const [activeModal, setActiveModal] = useState<CidadeModal>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [selectedPointImage, setSelectedPointImage] = useState<CidadePoint | null>(null);

  useEffect(() => {
    let active = true;
    const cityId = Number(id);

    if (!id || !Number.isInteger(cityId) || cityId <= 0) {
      setError('O identificador da cidade é inválido.');
      setLoading(false);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setCity(null);
      setSelectedPointImage(null);

      const [cityResult, characterResult, pageResult] = await Promise.allSettled([
        getCidadeById(cityId),
        getPersonagens(true),
        getPagesReferencingEntity('Cidade', cityId),
      ]);

      if (!active) return;

      if (cityResult.status === 'rejected' || !cityResult.value) {
        setError('Não foi possível carregar esta cidade. Ela pode não existir ou não estar visível.');
        setLoading(false);
        return;
      }

      const loadedCity = cityResult.value;
      setCity(loadedCity);
      setPoints((loadedCity.pontosDeInteresse ?? [])
        .map((point, index) => ({
          id: `${index}-${point.nome}`,
          nome: point.nome,
          descricao: point.descricao,
          imagem: point.imagem,
        }))
        .sort(compareByName((point) => point.nome)));

      if (characterResult.status === 'fulfilled' && Array.isArray(characterResult.value)) {
        setCharacters(characterResult.value
          .filter((character) => character.visivel !== false && Number(character.idcidade) === cityId)
          .sort(compareByName((character) => character.nome)));
      } else {
        setCharacters([]);
      }

      if (pageResult.status === 'fulfilled'
        && pageResult.value.sucesso !== false
        && Array.isArray(pageResult.value.pages)) {
        setRelatedPages(pageResult.value.pages
          .filter((page): page is CidadeRelatedPage => typeof page.idPage === 'number')
          .sort(compareByName((page) => page.titulo)));
      } else {
        setRelatedPages([]);
      }

      setLoading(false);
    };

    load().catch(() => {
      if (!active) return;
      setError('Não foi possível carregar esta cidade. Tente novamente.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id]);

  const galleryImages = useMemo<CityGalleryImage[]>(() => (
    normalizeGalleryImages(city?.galeriaImagem).map((image) => ({
      url: image.url,
      caption: image.legenda,
    }))
  ), [city?.galeriaImagem]);

  useEffect(() => {
    let active = true;

    Promise.all(galleryImages.map((image) => (
      detectImageShapeFromUrl(normalizeImagePath(image.url))
    ))).then((detectedShapes) => {
      if (active) setGalleryShapes(detectedShapes);
    });

    return () => {
      active = false;
    };
  }, [galleryImages]);

  const hasDescription = hasRichTextContent(city?.descricao);
  const hasPoints = points.length > 0;
  const hasCharacters = characters.length > 0;
  const hasCenter = hasPoints || hasCharacters;
  const hasGallery = galleryImages.length > 0;
  const pointPreviewLimit = hasCharacters ? 3 : 9;
  const characterPreviewLimit = hasPoints ? 4 : 12;

  const closeModal = useCallback(() => setActiveModal(null), []);
  const closeGallery = useCallback(() => setGalleryIndex(null), []);
  const openPointImage = useCallback((point: CidadePoint) => setSelectedPointImage(point), []);
  const closePointImage = useCallback(() => setSelectedPointImage(null), []);
  const previousGalleryImage = useCallback(() => {
    setGalleryIndex((current) => current !== null && current > 0 ? current - 1 : current);
  }, []);
  const nextGalleryImage = useCallback(() => {
    setGalleryIndex((current) => (
      current !== null && current < galleryImages.length - 1 ? current + 1 : current
    ));
  }, [galleryImages.length]);
  const selectCharacter = useCallback((character: PersonagemPayload) => {
    navigate(`/personagem/${character.idpersonagem}`);
  }, [navigate]);

  return {
    city,
    characters,
    points,
    relatedPages,
    galleryImages,
    loading,
    error,
    galleryShapes,
    activeModal,
    galleryIndex,
    selectedPointImage,
    hasDescription,
    hasPoints,
    hasCharacters,
    hasCenter,
    hasGallery,
    pointPreviewLimit,
    characterPreviewLimit,
    setActiveModal,
    closeModal,
    setGalleryIndex,
    closeGallery,
    openPointImage,
    closePointImage,
    previousGalleryImage,
    nextGalleryImage,
    selectCharacter,
  };
};
