import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { HomePage } from './pages/HomePage';
import { RecipesPage } from './pages/RecipesPage';
import { PlannerPage } from './pages/PlannerPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/global.css';

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <BottomNav />
      </AppProvider>
    </HashRouter>
  );
}
