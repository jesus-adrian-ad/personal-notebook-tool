/// <reference types="vite/client" />

import type { NotebookApi } from '../../preload/src/index';

declare global {
  interface Window {
    notebookApi: NotebookApi;
  }
}
