const sameTag = (first: string, second: string) =>
  first.localeCompare(second, undefined, { sensitivity: 'accent' }) === 0;

export const ensureContentCategoryTag = (tags: string[], contentType?: string) => {
  const normalizedTags = tags
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter((tag, index, allTags) =>
      allTags.findIndex(existingTag => sameTag(existingTag, tag)) === index
    );

  if (contentType && !normalizedTags.some(tag => sameTag(tag, contentType))) {
    normalizedTags.unshift(contentType);
  }

  return normalizedTags;
};

export const isContentCategoryTag = (tag: string, contentType?: string) =>
  Boolean(contentType && sameTag(tag, contentType));
