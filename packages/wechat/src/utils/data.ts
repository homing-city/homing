import { IKey } from 'homing';

export const getValue = (root: any, path: IKey[]) => {
  let data = root;
  for (let i = 0; i < path.length; i++) {
    if (typeof data !== 'object' || data == null) {
      return undefined;
    }
    data = data[path[i]];
  }
  return data;
};

export const setValue = (root: any, path: IKey[], value: any) => {
  for (let i = 0; i < path.length; i++) {
    if (i !== path.length - 1) {
      root = root[path[i]];
      continue;
    }

    root[path[i]] = value;
  }
};

export const joinPath = (...path: IKey[]) => {
  return path
    .map((key, index) => {
      if (index === 0) return key;
      if (/^(\d|[1-9]\d+)$/.test(String(key))) return `[${String(key)}]`;
      return `.${String(key)}`;
    })
    .join('');
};

export const splitPath = (path: string) => {
  return path.split(/[\.\[\]]/).filter(Boolean);
};
