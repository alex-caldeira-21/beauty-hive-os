import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck, 
  Package, 
  ShoppingCart, 
  BarChart3,
  Settings,
  LogOut,
  MessageCircle,
  Scissors
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Agendamentos", href: "/appointments" },
  { icon: Users, label: "Clientes", href: "/clients" },
  { icon: UserCheck, label: "Funcionários", href: "/employees" },
  { icon: Scissors, label: "Serviços", href: "/services" },
  { icon: Package, label: "Estoque", href: "/inventory" },
  { icon: ShoppingCart, label: "Vendas", href: "/sales" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
  { icon: MessageCircle, label: "WhatsApp", href: "/whatsapp" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sidebar-accent rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-sidebar-accent-foreground">✂</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Hair Salon</h1>
            <p className="text-sm text-sidebar-muted-foreground">ERP System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-sidebar-accent-foreground">AS</span>
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">Admin User</p>
            <p className="text-xs text-sidebar-muted-foreground">admin@salon.com</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground">
            <Settings className="w-4 h-4" />
            Config
          </button>
          <button className="flex items-center justify-center px-3 py-2 rounded-lg text-sm bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}