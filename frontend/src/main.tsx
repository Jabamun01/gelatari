import './styles/global'; // Import global styles for side effects (Linaria)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimerProvider } from './contexts/TimerContext';
import App from './App.tsx';

// Create a client
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TimerProvider>
        <App />
      </TimerProvider>
    </QueryClientProvider>
  </StrictMode>,
);
