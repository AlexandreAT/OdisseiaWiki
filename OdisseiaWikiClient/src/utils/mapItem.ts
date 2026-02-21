import { ItemTipo, Item } from './../models/Itens';
import { ItemPayload } from './../services/itensService';

// garante que a gente tenha o tipo no formato string esperado pelo front
function normalizeTipo(payloadTipo: any): ItemTipo {
  // Caso venha número (enum numérico do backend)
  if (typeof payloadTipo === 'number') {
    const mapNumToString: ItemTipo[] = ['arma','traje','consumiveis','acessorio','outro'];
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
  let atributos: any = undefined;
  if (payload.atributosJson) {
    if (typeof payload.atributosJson === 'string') {
      try {
        atributos = JSON.parse(payload.atributosJson);
      } catch (e) {
        console.error('Erro ao parsear atributosJson:', e);
        atributos = undefined;
      }
    } else {
      // Já é um objeto
      atributos = payload.atributosJson;
    }
  }

  // Processa descricao: mantém como JSONContent se for objeto, ou string se for string
  let descricao: any = undefined;
  if (payload.descricao) {
    if (typeof payload.descricao === 'string') {
      // Se vier como string, tenta parsear para JSONContent
      try {
        descricao = JSON.parse(payload.descricao);
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
    descricao,
    efeito: payload.efeito ?? undefined,
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
  // Processa descricao: se for objeto JSONContent, envia como objeto; se for string, envia como string
  let descricao: string | any = undefined;
  if (item.descricao) {
    if (typeof item.descricao === 'string') {
      descricao = item.descricao;
    } else {
      // É um objeto JSONContent, envia como objeto
      descricao = item.descricao;
    }
  }

  // Processa atributosJson: envia como objeto (não stringifica)
  let atributosJson: any = undefined;
  if (item.atributos) {
    atributosJson = item.atributos;
  }

  return {
    iditem: item.id,
    iditemBase: item.idItemBase,
    nome: item.nome,
    tipo: String(item.tipo),
    quantidade: item.quantidade,
    peso: item.peso,
    descricao,
    efeito: item.efeito,
    imagem: item.imagem,
    atributosJson,
    tags: item.tags,
    visivel: item.visivel,
    dataCriacao: item.dataCriacao,
    idpersonagem: item.idPersonagem,
  };
};
