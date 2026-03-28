import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import PantryPage from './pages/PantryPage';
import RecipesPage from './pages/RecipesPage';
import PlannerPage from './pages/PlannerPage';
import ShoppingPage from './pages/ShoppingPage';
import BarcodePage from './pages/BarcodePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main" id="appMain">
          <Routes>
            <Route path="/"         element={<PantryPage />} />
            <Route path="/recipes"  element={<RecipesPage />} />
            <Route path="/planner"  element={<PlannerPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/scan"     element={<BarcodePage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
