const activeForms = new Set<symbol>();

export const setUnsavedForm = (key: symbol, dirty: boolean) => {
  if (dirty) activeForms.add(key);
  else activeForms.delete(key);
};

export const hasUnsavedForms = () => activeForms.size > 0;
