import { useState, useCallback } from "react";
import { Calendar, Clock, User, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState("2025-08-26");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handler para novo agendamento
  const handleNovoAgendamento = useCallback(() => {
    setIsLoading(true);
    
    // Simula abertura de modal/página de novo agendamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Novo Agendamento",
        description: "Modal de novo agendamento será implementado",
      });
    }, 500);
  }, []);

  // Handler para filtros
  const handleFiltros = useCallback(() => {
    toast({
      title: "Filtros",
      description: "Modal de filtros será implementado",
    });
  }, []);

  // Handler para mudança de data
  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date);
    toast({
      title: "Data alterada",
      description: `Agendamentos para ${new Date(date).toLocaleDateString()}`,
    });
  }, []);

  // Handler para busca
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    // Implementar lógica de busca aqui
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agendamentos</h2>
          <p className="text-muted-foreground">segunda-feira, 25 de agosto de 2025</p>
        </div>
        
        <Button 
          className="gap-2" 
          onClick={handleNovoAgendamento}
          disabled={isLoading}
          aria-label="Criar novo agendamento"
        >
          <Plus className="w-4 h-4" />
          {isLoading ? "Carregando..." : "Novo Agendamento"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-auto"
            aria-label="Selecionar data dos agendamentos"
          />
        </div>
        
        <Input
          placeholder="Buscar por cliente, serviço ou funcionário..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md"
          aria-label="Buscar agendamentos"
        />
        
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleFiltros}
          aria-label="Abrir filtros avançados"
        >
          <Filter className="w-4 h-4" />
          Filtros
        </Button>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">0</p>
              <p className="text-sm text-muted-foreground">Concluídos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">0</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">R$ 0,00</p>
              <p className="text-sm text-muted-foreground">Receita Prevista</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado para esta data</h3>
            <p className="text-muted-foreground mb-4">
              Que tal começar agendando o primeiro cliente do dia?
            </p>
            <Button 
              className="gap-2"
              onClick={handleNovoAgendamento}
              disabled={isLoading}
              aria-label="Criar primeiro agendamento do dia"
            >
              <Plus className="w-4 h-4" />
              {isLoading ? "Carregando..." : "Novo Agendamento"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}