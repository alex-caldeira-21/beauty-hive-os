import { useState } from "react";
import { Calendar, Clock, User, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState("26/08/2025");

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Agendamentos</h2>
          <p className="text-muted-foreground">segunda-feira, 25 de agosto de 2025</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value="2025-08-26"
            className="w-auto"
          />
        </div>
        
        <Input
          placeholder="Buscar por cliente, serviço ou funcionário..."
          className="max-w-md"
        />
        
        <Button variant="outline" className="gap-2">
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
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}