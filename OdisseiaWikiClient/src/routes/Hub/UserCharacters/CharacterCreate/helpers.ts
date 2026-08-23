import { Item, ItemTipo } from '../../../../models/Itens';
import { Skills, SkillTipoString, SkillElemento } from '../../../../models/Skills';
import { Magia, MagiaTipoString, MagiaElemento } from '../../../../models/Magias';

export const generateId = () =>
  (typeof crypto !== "undefined" && (crypto as any).randomUUID)
    ? (crypto as any).randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const mapInventoryForPayload = (itens: Item[]): Item[] => {
  return itens.map(({ imagemArquivo: _imagemArquivo, ...it }) => ({
    ...it,
    id: it.id ?? generateId(),
    idItemBase: it.idItemBase ?? undefined,
    nome: it.nome ?? "Item",
    tipo: (it.tipo as ItemTipo) ?? "outro",
    quantidade: Number(it.quantidade) || 1,
    peso: it.peso !== undefined && it.peso !== 0 ? Number(it.peso) : undefined,
    discricao: Number(it.discricao) || 0,
    descricao: it.descricao ?? "",
    efeito: ((it.atributos as Record<string, unknown> | undefined)?.efeito as string | undefined) ?? it.efeito,
    imagem: it.imagem ?? undefined,
    atributos: it.atributos ?? {},
  }));
};

export const mapMagiasForPayload = (magias: Magia[]): Magia[] => {
  return magias.map(({ imagemArquivo: _imagemArquivo, ...magia }) => ({
    ...magia,
    id: magia.id ?? generateId(),
    nome: magia.nome ?? "Magia",
    efeito: magia.efeito ?? undefined,
    tipo: (magia.tipo as MagiaTipoString) ?? "suporte",
    elemento: (magia.elemento as MagiaElemento[]) ?? ["normal"],
    custo: magia.custo ?? "",
    imagem: magia.imagem ?? undefined,
    atributos: magia.atributos ?? {},
  }));
};

export const mapSkillsForPayload = (skills: Skills[]): Skills[] => {
  return skills.map(({ imagemArquivo: _imagemArquivo, ...skill }) => ({
    ...skill,
    id: skill.id ?? generateId(),
    nome: skill.nome ?? "Skill",
    efeito: skill.efeito ?? undefined,
    tipo: (skill.tipo as SkillTipoString) ?? "suporte",
    elemento: (skill.elemento as SkillElemento[]) ?? ["normal"],
    custo: skill.custo ?? "",
    nivel: skill.nivel ?? 1,
    imagem: skill.imagem ?? undefined,
    atributos: skill.atributos ?? {},
  }));
};
