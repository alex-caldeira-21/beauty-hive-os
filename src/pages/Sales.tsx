import { Search, Plus, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Sales() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Vendas</h2>
          <p className="text-muted-foreground">0 vendas realizadas</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Venda
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente ou forma de pagamento..."
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma venda realizada</h3>
            <p className="text-muted-foreground mb-6">
              Registre sua primeira venda para começar a acompanhar o faturamento
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registrar Primeira Venda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">R$ 0,00</p>
              <p className="text-sm text-muted-foreground">Receita Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-info">R$ 0,00</p>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Vendas PIX</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}