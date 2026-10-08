import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { StoreProvider } from './state/StoreProvider.jsx';
import { CloudProvider } from './state/cloud.jsx';
import App from './app/App.jsx';
import './index.css';
import { ToastProvider, ConfirmProvider } from './ui/index.js';

// Demande au navigateur de ne pas effacer les données locales (important sur mobile).
navigator.storage?.persist?.().catch(() => {});

registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
  <StoreProvider>
    <ToastProvider>
      <ConfirmProvider>
        <CloudProvider>
          <App />
        </CloudProvider>
      </ConfirmProvider>
    </ToastProvider>
  </StoreProvider>
);
