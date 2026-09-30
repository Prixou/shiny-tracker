import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { StoreProvider } from './state/store.jsx';
import { ToastProvider, ConfirmProvider } from './components/ui.jsx';
import App from './App.jsx';
import './index.css';

// Demande au navigateur de ne pas effacer les données locales (important sur mobile).
navigator.storage?.persist?.().catch(() => {});

registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StoreProvider>
    <ToastProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </ToastProvider>
  </StoreProvider>
);
