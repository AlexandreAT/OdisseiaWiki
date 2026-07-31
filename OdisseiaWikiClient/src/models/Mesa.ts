export interface Mesa {
  idmesa: number;
  idusuarioCriacao?: number;
  nome: string;
  imagem?: string | null;
  padraoSistema: boolean;
  idSistemaVersao?: number | null;
  dataCriacao: string;
}
