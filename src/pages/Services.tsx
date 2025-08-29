import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Clock, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FormModal } from "@/components/modals/FormModal";
import { ServiceForm } from "@/components/forms/ServiceForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration_minutes: number;
  created_at: string;
}

export default function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const loadServices = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServices(data || []);
      setFilteredServices(data || []);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredServices(services);
    } else {
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  const handleNewService = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso!",
      });

      loadServices();
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir serviço",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleServiceSuccess = () => {
    setIsModalOpen(false);
    setEditingService(null);
    loadServices();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando serviços...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Serviços</h2>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pelo seu salão
          </p>
        </div>
        
        <Button onClick={handleNewService} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4 text-center">
              {searchTerm 
                ? "Tente ajustar os termos de busca"
                : "Que tal começar cadastrando o primeiro serviço?"
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleNewService} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Serviço
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <Badge variant="secondary" className="mt-1">
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(service)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes}min
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    R$ {service.price.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingService ? "Editar Serviço" : "Novo Serviço"}
      >
        <ServiceForm
          onSuccess={handleServiceSuccess}
          initialData={editingService ? {
            ...editingService,
            price: editingService.price.toString(),
            duration_minutes: editingService.duration_minutes.toString()
          } : undefined}
          isEditing={!!editingService}
        />
      </FormModal>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço "{serviceToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}