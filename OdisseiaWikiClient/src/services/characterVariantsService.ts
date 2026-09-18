import type { PersonagemVariante } from '../models/Characters';
import { persistCharacterEntryImages } from './characterEntryImageService';
import { buildCharacterVariantFields } from '../utils/characterVariants';
import { normalizeCharacterStatusExtras } from '../utils/characterStatus';

const richText = (value: unknown) => typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);

export async function persistCharacterVariants(variants: PersonagemVariante[], entityName: string) {
  const saved = await Promise.all(variants.map(async variant => {
    const options = { assetType: 'personagens' as const, entityName };
    const [items, skills, spells] = await Promise.all([
      persistCharacterEntryImages(variant.inventarioJson.filter(item => item.nome?.trim()), {
        ...options, resolveFolderName: item => item.tipo === 'implante' ? 'proteses' : 'inventario',
      }),
      persistCharacterEntryImages(variant.skills.filter(skill => skill.nome?.trim()), {
        ...options, resolveFolderName: () => 'skills',
      }),
      persistCharacterEntryImages(variant.magia.filter(spell => spell.nome?.trim()), {
        ...options, resolveFolderName: () => 'magias',
      }),
    ]);
    return {
      ...variant,
      nome: variant.nome.trim(),
      statusJson: { ...variant.statusJson, ...normalizeCharacterStatusExtras(variant.statusJson) },
      inventarioJson: items.map(item => ({ ...item, id: item.id || crypto.randomUUID(), quantidade: Number(item.quantidade) || 1,
        descricao: richText(item.descricao) })),
      skills: skills.map(skill => ({ ...skill, id: skill.id || crypto.randomUUID(), nivel: skill.nivel ?? 1, efeito: richText(skill.efeito),
        atributos: { ...skill.atributos, __efeitoRichText: richText(skill.efeito) } })),
      magia: spells.map(spell => ({ ...spell, id: spell.id || crypto.randomUUID(), efeito: richText(spell.efeito),
        atributos: { ...spell.atributos, __efeitoRichText: richText(spell.efeito) } })),
    };
  }));
  return buildCharacterVariantFields(saved);
}
