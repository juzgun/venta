import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import 'antd/dist/reset.css';
import './index.css';
import App from './App.tsx';
import { StoreProvider } from './stores';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <StoreProvider>
      <ConfigProvider locale={ruRU}>
        <App />
      </ConfigProvider>
    </StoreProvider>
  </StrictMode>,
);
