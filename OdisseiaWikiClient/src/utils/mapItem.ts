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
export const mapToItem = (payload: ItemPayload): Item => ({
  id: payload.iditem,
  idItemBase: payload.iditemBase,
  nome: payload.nome,
  tipo: normalizeTipo(payload.tipo),
  quantidade: payload.quantidade,
  peso: payload.peso ?? undefined,
  descricao: payload.descricao ?? undefined,
  efeito: payload.efeito ?? undefined,
  imagem: payload.imagem ?? undefined,
  atributos: payload.atributosJson ? JSON.parse(payload.atributosJson) : undefined,
  dataCriacao: payload.dataCriacao ?? undefined,
  idPersonagem: payload.idpersonagem ?? undefined,
});

// de frontend → backend
export const mapToPayload = (item: Item): ItemPayload => ({
  iditem: item.id,
  iditemBase: item.idItemBase,
  nome: item.nome,
  tipo: String(item.tipo),
  quantidade: item.quantidade,
  peso: item.peso,
  descricao: item.descricao,
  efeito: item.efeito,
  imagem: item.imagem,
  atributosJson: item.atributos
    ? JSON.stringify(item.atributos)
    : undefined,
  dataCriacao: item.dataCriacao,
  idpersonagem: item.idPersonagem,
});
