import { createRoot } from 'react-dom/client';
import { MainPage } from './app/MainPage';
import './styles/base.css';
import './styles/interface.css';

createRoot(document.getElementById('root')!).render(<MainPage />);
