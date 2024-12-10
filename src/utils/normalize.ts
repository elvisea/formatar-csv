// src/utils/normalize.ts

export const normalizeKeys = (data: any): any => {
  const normalizedData: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      let normalizedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2');
      normalizedKey = normalizedKey.toLowerCase().trim();
      normalizedKey = normalizedKey.replace(/\s+/g, '_');
      normalizedKey = normalizedKey.replace(/_+/g, '_');
      normalizedKey = normalizedKey.replace(/^_+|_+$/g, '');
      normalizedData[normalizedKey] = data[key];
    }
  }

  return normalizedData;
};
