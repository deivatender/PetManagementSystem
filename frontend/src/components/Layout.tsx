import { NavLink, Outlet } from 'react-router-dom';
import { cn } from './ui/cn';

const navItems = [
  { to: '/pets', label: 'Pets' },
  { to: '/owners', label: 'Owners' },
];

/** App shell: header with primary navigation + routed content area. */
export function Layout() {
  return (
    <div className="min-h-screen">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-xl">
              🐾
            </span>
            <span className="text-lg font-semibold text-slate-900">Pet Management</span>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
