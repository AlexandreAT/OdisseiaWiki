import { RacaStatus, RacaVariacao } from "../../../../../../services/racasService";
import { GalleryImage } from '../../../../../../models/GalleryImage';
import { JSONContent } from '../../../../../../models/Cities';

export interface RaceFormData {
  nome: string;
  statusJson: RacaStatus;
  descricao?: JSONContent | string;
  imagem?: string;
  galeriaImagem?: GalleryImage[];
  variacoes?: RacaVariacao[];
  tags?: string[];
  visivel: boolean;
}

export interface RaceFormErrors {
  nome?: string;
  imagem?: string;
  statusVida?: string;
  statusEstamina?: string;
  statusMana?: string;
  statusCapacidadeCarga?: string;
  atributoInicial?: string;
}

export interface UploadResult {
  imagemPath?: string;
  galeriaPaths?: GalleryImage[];
}
