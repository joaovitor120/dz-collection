import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

/** Flat config (ESLint 9+). eslint-config-next 16 já exporta neste formato. */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'qa.mjs'] },
  ...coreWebVitals,
  ...typescript,
];

export default config;
