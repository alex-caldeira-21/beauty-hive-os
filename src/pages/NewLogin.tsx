import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function NewLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Login realizado com sucesso",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, name, phone);
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Conta criada com sucesso! Verifique seu e-mail para confirmar a conta.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar conta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu e-mail",
        variant: "destructive",
      });
      return;
    }

    // Implementar reset de senha aqui
    toast({
      title: "Em breve",
      description: "Funcionalidade de recuperação de senha será implementada",
    });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - App Description */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl font-bold text-primary">Zenith</h1>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Sistema de Gestão para Salões</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Gerencie seu salão de beleza com eficiência. Controle agendamentos, 
              clientes, vendas e relatórios em uma plataforma completa e intuitiva.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8 text-sm">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="font-semibold text-primary">Agendamentos</div>
                <div className="text-muted-foreground">Controle total da agenda</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="font-semibold text-primary">Vendas</div>
                <div className="text-muted-foreground">Gestão completa de vendas</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="font-semibold text-primary">Clientes</div>
                <div className="text-muted-foreground">Base de dados organizada</div>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <div className="font-semibold text-primary">Relatórios</div>
                <div className="text-muted-foreground">Análises detalhadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center space-y-2 pb-8">
            <CardTitle className="text-3xl font-bold text-primary">Zenith</CardTitle>
            <p className="text-muted-foreground">
              {showForgotPassword 
                ? "Recuperar senha" 
                : isRegister 
                  ? "Criar nova conta" 
                  : "Entre em sua conta"
              }
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Voltar ao login
                </Button>
              </form>
            ) : (
              <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
                {isRegister && (
                  <>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        type="tel"
                        placeholder="Telefone (opcional)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                {isRegister && (
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Confirmar senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12"
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (isRegister ? "Criando..." : "Entrando...") 
                    : (isRegister ? "Cadastrar" : "Entrar")
                  }
                </Button>
                
                {!isRegister && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Esqueci minha senha
                  </Button>
                )}
                
                <div className="text-center pt-4">
                  <Button 
                    type="button"
                    variant="link" 
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setShowForgotPassword(false);
                    }}
                  >
                    {isRegister 
                      ? "Já tem uma conta? Fazer login" 
                      : "Não tem uma conta? Cadastre-se"
                    }
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}