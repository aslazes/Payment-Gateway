import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, CreditCard, RotateCcw, FileText } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/refunds", label: "Refunds", icon: RotateCcw },
  { to: "/reports", label: "Reports", icon: FileText },
];

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar rail */}
      <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-mono text-sm font-bold tracking-wider text-foreground">
            FFB<span className="text-primary">PAY</span>
          </span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent border-l-2 border-transparent"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">merchant_id</p>
          <p className="text-xs text-foreground font-mono truncate">mch_demo_store</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
