import { NavLink } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
        <span className="nav-icon">🏠</span>
        ホーム
      </NavLink>
      <NavLink to="/recipes" className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="nav-icon">📖</span>
        レシピ
      </NavLink>
      <NavLink to="/planner" className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="nav-icon">📅</span>
        献立
      </NavLink>
      <NavLink to="/shopping" className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="nav-icon">🛒</span>
        買い物
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
        <span className="nav-icon">⚙</span>
        設定
      </NavLink>
    </nav>
  );
}
