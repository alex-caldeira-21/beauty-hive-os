import { Calendar, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="default"
        >
          <Calendar className="w-5 h-5" />
          Novo Agendamento
        </Button>
        
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
        >
          <Users className="w-5 h-5" />
          Cadastrar Cliente
        </Button>
        
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
        >
          <DollarSign className="w-5 h-5" />
          Nova Venda
        </Button>
      </CardContent>
    </Card>
  );
}