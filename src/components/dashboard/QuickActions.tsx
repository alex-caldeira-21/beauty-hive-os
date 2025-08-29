import { Calendar, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const handleNewAppointment = () => {
    navigate("/appointments?action=new");
  };

  const handleNewClient = () => {
    navigate("/clients?action=new");
  };

  const handleNewSale = () => {
    navigate("/sales?action=new");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="default"
          onClick={handleNewAppointment}
        >
          <Calendar className="w-5 h-5" />
          Novo Agendamento
        </Button>
        
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
          onClick={handleNewClient}
        >
          <Users className="w-5 h-5" />
          Cadastrar Cliente
        </Button>
        
        <Button 
          className="w-full justify-start gap-3 h-12" 
          variant="outline"
          onClick={handleNewSale}
        >
          <DollarSign className="w-5 h-5" />
          Nova Venda
        </Button>
      </CardContent>
    </Card>
  );
}