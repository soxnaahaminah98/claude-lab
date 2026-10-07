import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    // functions/ has its own package and test run.
    exclude: [...configDefaults.exclude, 'functions/**'],
  },
});
