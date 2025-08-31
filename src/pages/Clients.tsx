import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit, MoreHorizontal, Phone, Mail, MapPin, Calendar as CalendarIcon, Trash2, History } from "lucide-react";
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
import { ClientForm } from "@/components/forms/ClientForm";
import { ClientHistoryModal } from "@/components/modals/ClientHistoryModal";

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const loadClients = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;

      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const handleNewClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Cliente excluído com sucesso",
      });

      loadClients();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    loadClients();
  };

  const handleViewHistory = (client: any) => {
    setSelectedClient(client);
    setIsHistoryModalOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatBirthdate = (birthdate: string) => {
    if (!birthdate) return "Não informado";
    return new Date(birthdate).toLocaleDateString("pt-BR");
  };

  const stats = {
    total: clients.length,
    withBirthdate: clients.filter(c => c.birthdate).length,
    withNotes: clients.filter(c => c.notes).length,
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-muted-foreground">{clients.length} clientes cadastrados</p>
        </div>
        
        <Button className="gap-2" onClick={handleNewClient}>
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Client List or Empty State */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {clients.length === 0
                  ? "Comece adicionando os primeiros clientes"
                  : "Tente ajustar os filtros de busca"}
              </p>
              {clients.length === 0 && (
                <Button className="gap-2" onClick={handleNewClient}>
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiro Cliente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold">{client.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {client.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {client.address}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          Nascimento: {formatBirthdate(client.birthdate)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditClient(client)}>
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
                        <DropdownMenuItem onClick={() => handleViewHistory(client)}>
                          <History className="w-4 h-4 mr-2" />
                          Histórico
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClient(client.id)}>
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

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{stats.withBirthdate}</p>
              <p className="text-sm text-muted-foreground">Com Data de Nascimento</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-info">{stats.withNotes}</p>
              <p className="text-sm text-muted-foreground">Com Observações</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? "Editar Cliente" : "Novo Cliente"}
      >
        <ClientForm
          initialData={editingClient}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>

      {/* History Modal */}
      <ClientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}