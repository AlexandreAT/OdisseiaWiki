import { normalizeArmaTipo, normalizeTrajeTipo } from '../constants';
import type { Item, ItemTipo } from './../models/Itens';
import type { ItemPayload } from './../services/itensService';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

// garante que a gente tenha o tipo no formato string esperado pelo front
function normalizeTipo(payloadTipo: unknown): ItemTipo {
  // Caso venha número (enum numérico do backend)
  if (typeof payloadTipo === 'number') {
    const mapNumToString: ItemTipo[] = ['arma','traje','consumiveis','acessorio','implante','outro'];
    return mapNumToString[payloadTipo] ?? 'outro';
  }
  // Caso venha string: padroniza para lowercase
  if (typeof payloadTipo === 'string') {
    return (payloadTipo.toLowerCase() as ItemTipo);
  }
  return 'outro';
}

// de backend → frontend
export const mapToItem = (payload: ItemPayload): Item => {
  // Processa atributosJson: se já for objeto, usa direto; se for string, faz parse
  let atributos: Record<string, unknown> = {};
  if (payload.atributosJson) {
    if (typeof payload.atributosJson === 'string') {
      try {
        const parsedAttributes: unknown = JSON.parse(payload.atributosJson);
        atributos = isRecord(parsedAttributes) ? parsedAttributes : {};
      } catch (e) {
        console.error('Erro ao parsear atributosJson:', e);
        atributos = {};
      }
    } else {
      // Já é um objeto
      atributos = payload.atributosJson;
    }
  }

  atributos = {
    ...atributos,
    efeito: atributos.efeito ?? payload.efeito ?? '',
  };

  const normalizedWeaponType = normalizeArmaTipo(
    atributos.tipoArma ?? atributos.TipoArma
  );
  if (normalizedWeaponType) {
    atributos.tipoArma = normalizedWeaponType;
    delete atributos.TipoArma;
  }

  const normalizedOutfitType = normalizeTrajeTipo(
    atributos.tipoTraje ?? atributos.TipoTraje
  );
  if (normalizedOutfitType) {
    atributos.tipoTraje = normalizedOutfitType;
    delete atributos.TipoTraje;
  }

  // Processa descricao: mantém como JSONContent se for objeto, ou string se for string
  let descricao: Item['descricao'];
  if (payload.descricao) {
    if (typeof payload.descricao === 'string') {
      // Se vier como string, tenta parsear para JSONContent
      try {
        descricao = JSON.parse(payload.descricao) as Item['descricao'];
      } catch (e) {
        // Se falhar o parse, mantém como string
        descricao = payload.descricao;
      }
    } else {
      // Já é um objeto JSONContent
      descricao = payload.descricao;
    }
  }

  return {
    id: payload.iditem,
    idItemBase: payload.iditemBase,
    nome: payload.nome,
    tipo: normalizeTipo(payload.tipo),
    quantidade: payload.quantidade,
    peso: payload.peso ?? undefined,
    discricao: payload.discricao ?? 0,
    descricao,
    efeito: typeof atributos.efeito === 'string' && atributos.efeito
      ? atributos.efeito
      : payload.efeito || undefined,
    imagem: payload.imagem ?? undefined,
    atributos,
    tags: payload.tags ?? undefined,
    visivel: payload.visivel ?? undefined,
    dataCriacao: payload.dataCriacao ?? undefined,
    idPersonagem: payload.idpersonagem ?? undefined,
  };
};

// de frontend → backend
export const mapToPayload = (item: Item): ItemPayload => {
  return {
    iditem: item.id,
    iditemBase: item.idItemBase,
    nome: item.nome,
    tipo: String(item.tipo),
    quantidade: item.quantidade,
    peso: item.peso,
    discricao: item.discricao ?? 0,
    descricao: item.descricao,
    efeito: undefined,
    imagem: item.imagem,
    atributosJson: item.atributos,
    tags: item.tags,
    visivel: item.visivel,
    dataCriacao: item.dataCriacao,
    idpersonagem: item.idPersonagem,
  };
};
