import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Settings, LayoutDashboard, Plus, Users } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/auth") {
      navigate("/auth");
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Propostas</h1>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link to="/">
                  <Button
                    variant={isActive("/") ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/services">
                  <Button
                    variant={isActive("/services") ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Serviços
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/users">
                    <Button
                      variant={isActive("/users") ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Usuários
                    </Button>
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/proposal/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Proposta
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout;
