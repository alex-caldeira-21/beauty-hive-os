import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  QrCode,
  RefreshCw,
  Download
} from "lucide-react";

interface FlowConfig {
  id: string;
  name: string;
  description: string;
  message: string;
  active: boolean;
  triggers: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  active: boolean;
}

interface Conversation {
  id: string;
  name: string;
  message: string;
  time: string;
  status: 'respondida' | 'pendente' | 'finalizada';
}

export default function WhatsAppIntegration() {
  const [flows, setFlows] = useState<FlowConfig[]>([
    {
      id: '1',
      name: 'Confirmação de Agendamento',
      description: 'Enviado automaticamente após criar um agendamento',
      message: 'Olá {nome}! Seu agendamento foi confirmado para {data} às {hora} com {funcionario}. Confirme sua presença respondendo SIM.',
      active: true,
      triggers: 45
    },
    {
      id: '2',
      name: 'Lembrete 24h',
      description: 'Lembrete enviado 24 horas antes do agendamento',
      message: 'Oi {nome}! Lembrando que você tem agendamento amanhã às {hora} com {funcionario}. Confirme sua presença!',
      active: true,
      triggers: 38
    },
    {
      id: '3',
      name: 'Lembrete 2h',
      description: 'Lembrete enviado 2 horas antes do agendamento',
      message: 'Oi {nome}! Seu agendamento é em 2 horas às {hora} com {funcionario}. Nos vemos em breve!',
      active: false,
      triggers: 0
    }
  ]);

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'Qual o horário de funcionamento?',
      answer: 'Funcionamos de segunda a sábado, das 8h às 18h. Domingos fechado.',
      active: true
    },
    {
      id: '2',
      question: 'Quais serviços vocês oferecem?',
      answer: 'Oferecemos cortes masculinos e femininos, barba, coloração, escova e tratamentos capilares.',
      active: true
    },
    {
      id: '3',
      question: 'Como faço para agendar?',
      answer: 'Você pode agendar pelo WhatsApp mesmo! Só me dizer o serviço desejado e sua preferência de data/horário.',
      active: true
    }
  ]);

  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'João Silva',
      message: 'Confirmo meu agendamento para amanhã!',
      time: '14:30',
      status: 'respondida'
    },
    {
      id: '2',
      name: 'Maria Santos',
      message: 'Qual o valor da coloração?',
      time: '13:45',
      status: 'pendente'
    },
    {
      id: '3',
      name: 'Pedro Costa',
      message: 'Obrigado! Até sábado.',
      time: '12:20',
      status: 'finalizada'
    }
  ]);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleGenerateQr = async () => {
    if (!businessName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do seu negócio.",
        variant: "destructive"
      });
      return;
    }

    const url = webhookUrl || 'https://tecnia-n8n.thegkr.easypanel.host/webhook/criaqrcode';
    
    setIsGenerating(true);
    
    try {
      const payload = {
        business_name: businessName.trim(),
        origin: window.location.origin
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const json = await response.json();
        let base64Data = json.qrcode || json.base64 || json.data;
        
        if (!base64Data) {
          throw new Error('QR Code não encontrado na resposta');
        }
        
        // Ensure proper data URL format
        if (!base64Data.startsWith('data:image/')) {
          base64Data = `data:image/png;base64,${base64Data}`;
        }
        
        setQrCodeDataUrl(base64Data);
        setLastUpdated(new Date().toLocaleString('pt-BR'));
        
        toast({
          title: "QR Code gerado",
          description: "QR Code do WhatsApp gerado com sucesso!"
        });
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar QR Code. Verifique a URL do webhook e as configurações CORS.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = 'whatsapp-qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download iniciado",
      description: "QR Code salvo com sucesso!"
    });
  };

  const toggleFlow = (id: string) => {
    setFlows(flows.map(flow => 
      flow.id === id ? { ...flow, active: !flow.active } : flow
    ));
    toast({
      title: "Fluxo atualizado",
      description: "Configuração salva com sucesso!"
    });
  };

  const toggleFAQ = (id: string) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, active: !faq.active } : faq
    ));
    toast({
      title: "FAQ atualizada",
      description: "Pergunta atualizada com sucesso!"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'respondida': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'pendente': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'finalizada': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">WhatsApp</h2>
        <p className="text-muted-foreground mt-2">
          Automação e atendimento via WhatsApp
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Fluxos Automáticos
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mensagens Enviadas</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mensagens Recebidas</p>
                    <p className="text-2xl font-bold">89</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                    <p className="text-2xl font-bold">94%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/10">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agendamentos</p>
                    <p className="text-2xl font-bold">23</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Conversations */}
          <Card>
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
              <p className="text-sm text-muted-foreground">Últimas interações com clientes</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                        {conv.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{conv.name}</p>
                        <p className="text-sm text-muted-foreground">{conv.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{conv.time}</span>
                      <Badge className={getStatusColor(conv.status)}>
                        {conv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flows Tab */}
        <TabsContent value="flows" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Fluxos Automáticos</h3>
              <p className="text-sm text-muted-foreground">Configure mensagens automáticas para diferentes situações</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fluxo
            </Button>
          </div>

          <div className="space-y-4">
            {flows.map((flow) => (
              <Card key={flow.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={flow.active}
                        onCheckedChange={() => toggleFlow(flow.id)}
                      />
                      <div>
                        <h4 className="font-medium">{flow.name}</h4>
                        <p className="text-sm text-muted-foreground">{flow.description}</p>
                      </div>
                    </div>
                    <Badge variant={flow.active ? "default" : "secondary"}>
                      {flow.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="text-sm italic">{flow.message}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {flow.triggers} disparos realizados
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Desativar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Perguntas Frequentes</h3>
              <p className="text-sm text-muted-foreground">Configure respostas automáticas para perguntas comuns</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                    <Badge variant={faq.active ? "default" : "secondary"}>
                      {faq.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <Switch 
                      checked={faq.active}
                      onCheckedChange={() => toggleFAQ(faq.id)}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Desativar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conexão WhatsApp</CardTitle>
              <p className="text-sm text-muted-foreground">
                Conecte seu WhatsApp à automação escaneando o QR Code
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome do Negócio *</Label>
                  <Input
                    id="businessName"
                    placeholder="Ex: Barbearia do João"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Este nome será enviado para o N8N junto com a solicitação do QR Code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook">URL do Webhook N8N (Opcional)</Label>
                  <Input
                    id="webhook"
                    placeholder="https://tecnia-n8n.thegkr.easypanel.host/webhook/criaqrcode"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para usar a URL padrão
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleGenerateQr}
                    disabled={isGenerating || !businessName.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        {qrCodeDataUrl ? 'Atualizar QR Code' : 'Gerar QR Code'}
                      </>
                    )}
                  </Button>
                  
                  {qrCodeDataUrl && (
                    <Button 
                      variant="outline"
                      onClick={handleDownloadQr}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  )}
                </div>

                {qrCodeDataUrl && (
                  <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg bg-muted/20">
                    <div className="text-center">
                      <h4 className="font-medium mb-2">Escaneie o QR Code</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Use seu WhatsApp para escanear e conectar
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code WhatsApp" 
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    
                    {lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {lastUpdated}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integração com N8N</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure o webhook para automatizar o envio de mensagens
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Como configurar:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Crie um workflow no N8N com trigger webhook</li>
                  <li>Adicione um nó do WhatsApp Business API</li>
                  <li>Configure as credenciais do WhatsApp</li>
                  <li>Gere o QR Code acima para conectar</li>
                  <li>Teste a integração</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Importante:</strong> Após escanear o QR Code, seu WhatsApp ficará conectado 
                  ao sistema de automação e poderá enviar mensagens automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campos Disponíveis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Use estes campos nas suas mensagens automáticas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{"{nome}"}</code>
                  <p className="text-xs text-muted-foreground">Nome do cliente</p>
                </div>
                <div className="space-y-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{"{data}"}</code>
                  <p className="text-xs text-muted-foreground">Data do agendamento</p>
                </div>
                <div className="space-y-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{"{hora}"}</code>
                  <p className="text-xs text-muted-foreground">Horário do agendamento</p>
                </div>
                <div className="space-y-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{"{funcionario}"}</code>
                  <p className="text-xs text-muted-foreground">Nome do profissional</p>
                </div>
                <div className="space-y-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{"{servico}"}</code>
                  <p className="text-xs text-muted-foreground">Serviço agendado</p>
                </div>
                <div className="space-y-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{"{telefone}"}</code>
                  <p className="text-xs text-muted-foreground">Telefone do cliente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}