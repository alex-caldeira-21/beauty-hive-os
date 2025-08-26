import { Search, Plus, Edit, MoreHorizontal, Phone, Mail, Percent, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const employees = [
  {
    id: 1,
    name: "Ana Cabeleireira",
    role: "Cabeleireira",
    email: "ana@salao.com",
    phone: "(11) 88888-8888",
    commission: "30.0%",
    hiredDate: "14/01/2024",
    status: "Ativo",
    initials: "AC"
  }
];

export default function Employees() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Funcionários</h2>
          <p className="text-muted-foreground">1 funcionários ativos</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Funcionário
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou cargo..."
          className="pl-10"
        />
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        {employees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{employee.name}</h3>
                      <Badge 
                        variant={employee.status === "Ativo" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {employee.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {employee.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        Comissão: {employee.commission}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        Contratado em: {employee.hiredDate}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-warning">
                        Desativar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">1</p>
              <p className="text-sm text-muted-foreground">Total de Funcionários</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">1</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-info">1</p>
              <p className="text-sm text-muted-foreground">Cabeleireiras</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">1</p>
              <p className="text-sm text-muted-foreground">Com Comissão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}