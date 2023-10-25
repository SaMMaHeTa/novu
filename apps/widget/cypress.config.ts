import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  video: false,
  projectId: 'kedzap',
  env: {
    NODE_ENV: 'test',
    API_URL: 'http://192.168.10.152:1336',
  },
  e2e: {
    /*
     * We've imported your old cypress plugins here.
     * You may want to clean this up later by importing these.
     */
    setupNodeEvents(on, config) {
      // eslint-disable-next-line import/extensions
      return require('./cypress/plugins/index.ts')(on, config);
    },
    baseUrl: 'http://192.168.10.152:3500',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
});
