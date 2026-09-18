import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// La app es solo modo oscuro: se marca antes de renderizar para que el
// priming y todas las variantes `dark:` de Tailwind apliquen desde el primer frame.
document.documentElement.classList.add('dark');

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
