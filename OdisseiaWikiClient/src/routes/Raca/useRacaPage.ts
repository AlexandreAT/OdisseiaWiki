import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { normalizeGalleryImages } from '../../models/GalleryImage';
import { getPersonagens, PersonagemPayload } from '../../services/personagensService';
import {
  getRacaById,
  normalizeRacaStatus,
  normalizeRacaVariacoes,
  RacaPassiva,
  RacaPayload,
  RacaStatus,
  RacaVariacao,
  ResultRaca,
} from '../../services/racasService';
import { detectImageShapeFromUrl, ImageDisplayShape } from '../../utils/imageDisplayShape';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import { RacaListModal, RaceGalleryImage, SelectedRaceDetail } from './RacaPage.types';
import { PageDto } from '../../models/Pages';
import { getPagesReferencingEntity } from '../../services/pageService';

const compareByName = <T,>(getName: (item: T) => string) => (left: T, right: T) => (
  getName(left).localeCompare(getName(right), 'pt-BR', { sensitivity: 'base' })
);

const resolveRacePayload = (response: ResultRaca | RacaPayload): RacaPayload | null => {
  if ('idraca' in response) return response;
  return response.sucesso && response.raca ? response.raca : null;
};

const hasRichTextContent = (value: unknown): boolean => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (!value || typeof value !== 'object') return false;
  if ('text' in value && typeof value.text === 'string' && value.text.trim()) return true;
  if ('content' in value && Array.isArray(value.content)) return value.content.some(hasRichTextContent);
  return false;
};

export const useRacaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<RacaPayload | null>(null);
  const [status, setStatus] = useState<RacaStatus | null>(null);
  const [passives, setPassives] = useState<RacaPassiva[]>([]);
  const [variations, setVariations] = useState<RacaVariacao[]>([]);
  const [characters, setCharacters] = useState<PersonagemPayload[]>([]);
  const [relatedPages, setRelatedPages] = useState<PageDto[]>([]);
  const [galleryShapes, setGalleryShapes] = useState<ImageDisplayShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<RacaListModal>(null);
  const [selectedDetail, setSelectedDetail] = useState<SelectedRaceDetail>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [heroImageOpen, setHeroImageOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const raceId = Number(id);

    if (!id || !Number.isInteger(raceId) || raceId <= 0) {
      setError('O identificador da raça é inválido.');
      setLoading(false);
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setRace(null);
      setRelatedPages([]);

      const [raceResult, characterResult, pageResult] = await Promise.allSettled([
        getRacaById(raceId),
        getPersonagens(true),
        getPagesReferencingEntity('Raca', raceId),
      ]);

      if (!active) return;

      if (raceResult.status === 'rejected') {
        setError('Não foi possível carregar esta raça. Ela pode não existir ou não estar visível.');
        setLoading(false);
        return;
      }

      const loadedRace = resolveRacePayload(raceResult.value);
      if (!loadedRace) {
        setError('Não foi possível encontrar os dados desta raça.');
        setLoading(false);
        return;
      }

      const normalizedStatus = normalizeRacaStatus(loadedRace.statusJson);
      const normalizedVariations = normalizeRacaVariacoes(loadedRace.variacoes);

      setRace(loadedRace);
      setStatus(normalizedStatus);
      setPassives((normalizedStatus?.passivas ?? []).sort(compareByName((passive) => passive.nome)));
      setVariations(normalizedVariations.sort(compareByName((variation) => variation.nome)));

      if (characterResult.status === 'fulfilled') {
        setCharacters(characterResult.value
          .filter((character) => character.visivel !== false && Number(character.idraca) === raceId)
          .sort(compareByName((character) => character.nome)));
      } else {
        setCharacters([]);
      }

      if (pageResult.status === 'fulfilled'
        && pageResult.value.sucesso !== false
        && Array.isArray(pageResult.value.pages)) {
        setRelatedPages(pageResult.value.pages
          .filter((page) => page.visivel !== false)
          .sort(compareByName((page) => page.titulo)));
      } else {
        setRelatedPages([]);
      }

      setLoading(false);
    };

    load().catch(() => {
      if (!active) return;
      setError('Não foi possível carregar esta raça. Tente novamente.');
      setLoading(false);
    });

    return () => { active = false; };
  }, [id]);

  const galleryImages = useMemo<RaceGalleryImage[]>(() => (
    normalizeGalleryImages(race?.galeriaImagem).map((image) => ({
      url: image.url,
      caption: image.legenda,
    }))
  ), [race?.galeriaImagem]);

  useEffect(() => {
    let active = true;
    Promise.all(galleryImages.map((image) => detectImageShapeFromUrl(normalizeImagePath(image.url))))
      .then((shapes) => { if (active) setGalleryShapes(shapes); });
    return () => { active = false; };
  }, [galleryImages]);

  const closeModal = useCallback(() => setActiveModal(null), []);
  const closeDetail = useCallback(() => setSelectedDetail(null), []);
  const closeGallery = useCallback(() => setGalleryIndex(null), []);
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
    race,
    status,
    passives,
    variations,
    characters,
    relatedPages,
    galleryImages,
    galleryShapes,
    loading,
    error,
    activeModal,
    selectedDetail,
    galleryIndex,
    heroImageOpen,
    hasDescription: hasRichTextContent(race?.descricao),
    setActiveModal,
    closeModal,
    setSelectedDetail,
    closeDetail,
    setGalleryIndex,
    closeGallery,
    setHeroImageOpen,
    previousGalleryImage,
    nextGalleryImage,
    selectCharacter,
  };
};
