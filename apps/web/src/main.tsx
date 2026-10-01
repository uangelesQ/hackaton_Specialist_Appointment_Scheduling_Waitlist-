import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiProvider } from './api/ApiContext';
import { createApiClient } from './api/client';
import { App } from './App';
import { clearSession, loadSession, SessionProvider } from './session';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

const queryClient = new QueryClient();

// The API rejected our token (it expired): drop the session and start again at sign-in.
const client = createApiClient(
  '/api',
  () => loadSession()?.token ?? null,
  () => {
    clearSession();
    window.location.reload();
  },
);

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ApiProvider client={client}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </ApiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
