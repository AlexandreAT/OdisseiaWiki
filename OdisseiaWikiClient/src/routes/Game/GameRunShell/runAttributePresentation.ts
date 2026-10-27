export const attributeAbbreviation = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3).toUpperCase();
export const signedAttributeValue = (value: number) => value === 0 ? '±0' : `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
