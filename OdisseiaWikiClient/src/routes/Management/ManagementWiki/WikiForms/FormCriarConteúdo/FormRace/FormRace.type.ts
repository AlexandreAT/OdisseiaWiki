import { RacaStatus } from "../../../../../../services/racasService";

export interface RaceFormData {
  nome: string;
  statusJson: RacaStatus;
  imagem?: string;
  galeriaImagem?: string[];
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
  galeriaPaths?: string[];
}
