import { Search, Plus, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Inventory() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Controle de Estoque</h2>
          <p className="text-muted-foreground">0 produtos cadastrados</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, categoria ou código de barras..."
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando os primeiros produtos ao seu estoque
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Produto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">0</p>
              <p className="text-sm text-muted-foreground">Em Estoque</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">0</p>
              <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">0</p>
              <p className="text-sm text-muted-foreground">Sem Estoque</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}