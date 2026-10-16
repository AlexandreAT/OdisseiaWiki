import { Item, ItemTipo } from '../../../../models/Itens';
import { Skills, SkillTipoString, SkillElemento } from '../../../../models/Skills';
import { Magia, MagiaTipoString, MagiaElemento } from '../../../../models/Magias';

export const generateId = () =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

export const mapInventoryForPayload = (itens: Item[]): Item[] => {
  return itens.map((item) => {
    const it = { ...item };
    delete it.imagemArquivo;
    return {
    ...it,
    id: it.id ?? generateId(),
    idItemBase: it.idItemBase ?? undefined,
    nome: it.nome ?? "Item",
    tipo: (it.tipo as ItemTipo) ?? "outro",
    quantidade: Number(it.quantidade) || 1,
    peso: it.peso !== undefined && it.peso !== 0 ? Number(it.peso) : undefined,
    valor: it.valor === undefined ? undefined : Number(it.valor),
    discricao: Number(it.discricao) || 0,
    descricao: it.descricao ?? "",
    efeito: ((it.atributos as Record<string, unknown> | undefined)?.efeito as string | undefined) ?? it.efeito,
    imagem: it.imagem ?? undefined,
    atributos: it.atributos ?? {},
    };
  });
};

export const mapMagiasForPayload = (magias: Magia[]): Magia[] => {
  return magias.filter((magia) => Boolean(magia.nome?.trim())).map((entry) => {
    const magia = { ...entry };
    delete magia.imagemArquivo;
    return {
    ...magia,
    id: magia.id ?? generateId(),
    nome: magia.nome ?? "Magia",
    efeito: magia.efeito ?? undefined,
    tipo: (magia.tipo as MagiaTipoString) ?? "suporte",
    elemento: (magia.elemento as MagiaElemento[]) ?? ["normal"],
    custo: magia.custo ?? "",
    imagem: magia.imagem ?? undefined,
    atributos: magia.atributos ?? {},
    };
  });
};

export const mapSkillsForPayload = (skills: Skills[]): Skills[] => {
  return skills.filter((skill) => Boolean(skill.nome?.trim())).map((entry) => {
    const skill = { ...entry };
    delete skill.imagemArquivo;
    return {
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
    };
  });
};
