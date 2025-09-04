import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [reportType, setReportType] = useState("all");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    newClients: 0,
    averageTicket: 0,
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [user, period, reportType]);

  const loadReportData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          clients(name),
          employees(name),
          sale_items(*, products(name), services(name))
        `)
        .eq("user_id", user.id)
        .gte("sale_date", startDate.toISOString().split('T')[0]);

      if (salesError) throw salesError;

      // Buscar agendamentos
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          clients(name),
          employees(name),
          services(name)
        `)
        .eq("user_id", user.id)
        .gte("appointment_date", startDate.toISOString().split('T')[0]);

      if (appointmentsError) throw appointmentsError;

      // Buscar novos clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString());

      if (clientsError) throw clientsError;

      // Calcular estatísticas
      const totalRevenue = (salesData || []).reduce((sum, sale) => sum + Number(sale.total), 0) +
                          (appointmentsData || []).filter(app => app.status === 'completed' && app.price)
                            .reduce((sum, app) => sum + Number(app.price), 0);

      const totalAppointments = (appointmentsData || []).length;
      const newClients = (clientsData || []).length;
      const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

      setStats({
        totalRevenue,
        totalAppointments,
        newClients,
        averageTicket,
      });

      // Preparar dados para exportação
      let reportItems = [];

      if (reportType === 'all' || reportType === 'sales') {
        reportItems.push(...(salesData || []).map(sale => ({
          type: 'Venda',
          date: sale.sale_date,
          client: sale.clients?.name || 'N/A',
          employee: sale.employees?.name || 'N/A',
          description: sale.sale_items?.map((item: any) => 
            item.products?.name || item.services?.name).join(', ') || 'N/A',
          amount: sale.total,
          payment: sale.payment_method,
        })));
      }

      if (reportType === 'all' || reportType === 'appointments') {
        reportItems.push(...(appointmentsData || []).map(app => ({
          type: 'Agendamento',
          date: app.appointment_date,
          client: app.clients?.name || 'N/A',
          employee: app.employees?.name || 'N/A',
          description: app.services?.name || 'N/A',
          amount: app.price || 0,
          payment: 'N/A',
          status: app.status,
        })));
      }

      reportItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setReportData(reportItems);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Tipo', 'Data', 'Cliente', 'Funcionário', 'Descrição', 'Valor', 'Pagamento', 'Status'];
    const csvContent = [
      headers.join(','),
      ...reportData.map(item => [
        item.type,
        item.date,
        item.client,
        item.employee,
        `"${item.description}"`,
        item.amount,
        item.payment,
        item.status || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${period}dias_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso!",
      description: "Relatório CSV exportado com sucesso",
    });
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há dados para exportar",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Negócios', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text(`Período: Últimos ${period} dias`, 20, 30);
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);
    
    // Estatísticas
    doc.setFontSize(14);
    doc.text('Resumo:', 20, 55);
    doc.setFontSize(11);
    doc.text(`Receita Total: ${formatCurrency(stats.totalRevenue)}`, 20, 65);
    doc.text(`Total de Agendamentos: ${stats.totalAppointments}`, 20, 72);
    doc.text(`Novos Clientes: ${stats.newClients}`, 20, 79);
    doc.text(`Ticket Médio: ${formatCurrency(stats.averageTicket)}`, 20, 86);
    
    // Tabela de dados
    const tableData = reportData.map(item => [
      item.type,
      new Date(item.date).toLocaleDateString('pt-BR'),
      item.client,
      item.employee,
      item.description,
      formatCurrency(item.amount),
      item.payment,
      item.status || 'N/A'
    ]);

    autoTable(doc, {
      head: [['Tipo', 'Data', 'Cliente', 'Funcionário', 'Descrição', 'Valor', 'Pagamento', 'Status']],
      body: tableData,
      startY: 95,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 66, 66],
      },
    });

    doc.save(`relatorio_${period}dias_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Sucesso!",
      description: "Relatório PDF exportado com sucesso",
    });
  };

  const handleExport = () => {
    // Mostrar opções de exportação
    if (confirm("Exportar como PDF? (Clique OK para PDF, Cancelar para CSV)")) {
      exportToPDF();
    } else {
      exportToCSV();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">Análise detalhada do seu negócio</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sales">Vendas</SelectItem>
              <SelectItem value="appointments">Agendamentos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={handleExport}
            disabled={isLoading || reportData.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
              </div>
              <Calendar className="w-8 h-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Clientes</p>
                <p className="text-2xl font-bold">{stats.newClients}</p>
                <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</p>
                <p className="text-xs text-muted-foreground">Últimos {period} dias</p>
              </div>
              <TrendingUp className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Relatório Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  Nenhuma transação encontrada no período selecionado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {reportData.length} transações no período
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reportData.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                      <div>
                        <span className="font-medium">{item.type}</span> - {item.client}
                        <div className="text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('pt-BR')} | {item.employee}
                        </div>
                      </div>
                      <div className="font-medium">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                  {reportData.length > 10 && (
                    <div className="text-center text-muted-foreground text-sm">
                      E mais {reportData.length - 10} transações...
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance da Equipe</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{stats.totalAppointments}</p>
                    <p className="text-sm text-muted-foreground">Agendamentos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Receita</p>
                  </div>
                </div>
                {stats.totalAppointments > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-info">{formatCurrency(stats.averageTicket)}</p>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}