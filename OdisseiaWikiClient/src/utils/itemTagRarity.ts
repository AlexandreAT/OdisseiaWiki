export type ItemTagRarity = 'unique' | 'legendary';

/** Same semantics in the public item page and global/table management cards. */
export function getItemTagRarity(tag: string): ItemTagRarity | undefined {
  const normalized = tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  if (/\blendari[oa]s?\b/.test(normalized)) return 'legendary';
  if (/\bunic[oa]s?\b/.test(normalized)) return 'unique';
  return undefined;
}
