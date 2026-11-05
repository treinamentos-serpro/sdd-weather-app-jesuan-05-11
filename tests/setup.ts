import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('Chamada de rede sem mock: configure o service ou fetch neste teste.');
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
