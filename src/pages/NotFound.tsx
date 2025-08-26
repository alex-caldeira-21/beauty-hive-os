import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-primary">404</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        
        <Button asChild className="gap-2">
          <a href="/">
            <Home className="w-4 h-4" />
            Voltar ao Dashboard
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
