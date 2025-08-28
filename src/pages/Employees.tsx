import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit, MoreHorizontal, Phone, Mail, Percent, Calendar as CalendarIcon, Trash2 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FormModal } from "@/components/modals/FormModal";
import { EmployeeForm } from "@/components/forms/EmployeeForm";

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const loadEmployees = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar funcionários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);

  const handleNewEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Funcionário excluído com sucesso",
      });

      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir funcionário",
        variant: "destructive",
      });
    }
  };

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const { error } = await supabase
        .from("employees")
        .update({ status: newStatus })
        .eq("id", employeeId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Funcionário ${newStatus === "active" ? "ativado" : "desativado"} com sucesso`,
      });

      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do funcionário",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    loadEmployees();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatHireDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    roles: [...new Set(employees.map(e => e.role))].length,
    withCommission: employees.filter(e => e.commission_percentage > 0).length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Funcionários</h2>
          <p className="text-muted-foreground">{stats.active} funcionários ativos</p>
        </div>
        
        <Button className="gap-2" onClick={handleNewEmployee}>
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Employee List or Empty State */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {employees.length === 0 ? "Nenhum funcionário cadastrado" : "Nenhum funcionário encontrado"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {employees.length === 0
                  ? "Comece adicionando os primeiros funcionários"
                  : "Tente ajustar os filtros de busca"}
              </p>
              {employees.length === 0 && (
                <Button className="gap-2" onClick={handleNewEmployee}>
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Funcionário
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{employee.name}</h3>
                        <Badge 
                          variant={employee.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {employee.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{employee.role}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {employee.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {employee.email}
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Percent className="w-4 h-4" />
                          Comissão: {employee.commission_percentage}%
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          Contratado em: {formatHireDate(employee.hire_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditEmployee(employee)}>
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
                        <DropdownMenuItem 
                          className="text-warning"
                          onClick={() => toggleEmployeeStatus(employee.id, employee.status)}
                        >
                          {employee.status === "active" ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Funcionários</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-info">{stats.roles}</p>
              <p className="text-sm text-muted-foreground">Cargos Diferentes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.withCommission}</p>
              <p className="text-sm text-muted-foreground">Com Comissão</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
      >
        <EmployeeForm
          initialData={editingEmployee}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </div>
  );
}