import { Item, ItemTipo } from '../../../../models/Itens';
import { Skills, SkillTipoString, SkillElemento } from '../../../../models/Skills';
import { Magia, MagiaTipoString, MagiaElemento } from '../../../../models/Magias';

export const generateId = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const mapInventoryForPayload = (itens: Item[]): Item[] => {
  return itens.map((it) => ({
    id: it.id ?? generateId(),
    idItemBase: it.idItemBase ?? undefined,
    nome: it.nome ?? "Item",
    tipo: (it.tipo as ItemTipo) ?? "outro",
    quantidade: Number(it.quantidade) || 1,
    peso: it.peso !== undefined && it.peso !== 0 ? Number(it.peso) : undefined,
    descricao: it.descricao ?? "",
    efeito: it.efeito ?? undefined,
    imagem: it.imagem ?? undefined,
    atributos: it.atributos ?? {},
  }));
};

export const mapMagiasForPayload = (magias: Magia[]): Magia[] => {
  return magias.map((magia) => ({
    id: magia.id ?? generateId(),
    nome: magia.nome ?? "Magia",
    efeito: magia.efeito ?? undefined,
    tipo: (magia.tipo as MagiaTipoString) ?? "suporte",
    elemento: (magia.elemento as MagiaElemento[]) ?? ["normal"],
    custo: magia.custo ?? "",
    atributos: magia.atributos ?? {},
  }));
};

export const mapSkillsForPayload = (skills: Skills[]): Skills[] => {
  return skills.map((skill) => ({
    id: skill.id ?? generateId(),
    nome: skill.nome ?? "Skill",
    efeito: skill.efeito ?? undefined,
    tipo: (skill.tipo as SkillTipoString) ?? "suporte",
    elemento: (skill.elemento as SkillElemento[]) ?? ["normal"],
    custo: skill.custo ?? "",
    nivel: skill.nivel ?? 1,
    atributos: skill.atributos ?? {},
  }));
};
