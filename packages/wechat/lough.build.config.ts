import { defineConfig } from '@lough/build-cli';

export default defineConfig({
  external: ['homing', 'miniprogram-api-typings'],
  globals: { homing: 'homing', 'miniprogram-api-typings': 'miniprogramApiTypings' },
  terser: false,
  style: false,
  input: 'src/index.ts'
});
