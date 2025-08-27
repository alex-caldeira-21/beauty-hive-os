import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Copy, ExternalLink, QrCode, MessageCircle, Check } from "lucide-react";
import QRCode from "qrcode";

interface WhatsAppData {
  numero: string;
  mensagem: string;
}

export default function WhatsAppIntegration() {
  const [data, setData] = useState<WhatsAppData>({
    numero: "",
    mensagem: "Olá! Estou interessado(a) em agendar um serviço no seu salão."
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [errors, setErrors] = useState<{ numero?: string; mensagem?: string }>({});

  // Carrega dados do localStorage na inicialização
  useEffect(() => {
    const savedData = localStorage.getItem("whatsapp-integration");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed);
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
      }
    }
  }, []);

  // Salva dados no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem("whatsapp-integration", JSON.stringify(data));
  }, [data]);

  // Validação do número de WhatsApp
  const validarNumero = useCallback((numero: string): string | null => {
    const clean = numero.replace(/[\s\-\(\)]/g, "");
    
    if (!clean) return "Número é obrigatório";
    if (!/^\+\d{10,15}$/.test(clean)) {
      return "Formato inválido. Use +55DDDNUMERO (ex: +5511987654321)";
    }
    if (clean.startsWith("+55") && clean.length !== 14) {
      return "Número brasileiro deve ter 13 dígitos após +55";
    }
    
    return null;
  }, []);

  // Validação da mensagem
  const validarMensagem = useCallback((mensagem: string): string | null => {
    if (!mensagem.trim()) return "Mensagem padrão é obrigatória";
    if (mensagem.length > 1000) return "Mensagem deve ter no máximo 1000 caracteres";
    return null;
  }, []);

  // Gera link do WhatsApp
  const gerarLinkWhatsApp = useCallback((numero: string, mensagem: string): string => {
    const numeroLimpo = numero.replace(/[\s\-\(\)]/g, "").replace("+", "");
    const mensagemCodificada = encodeURIComponent(mensagem.trim());
    return `https://wa.me/${numeroLimpo}${mensagemCodificada ? `?text=${mensagemCodificada}` : ""}`;
  }, []);

  // Gera QR Code
  const gerarQRCode = useCallback(async (link: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: "#7c3aed", // cor primária do tema
          light: "#ffffff"
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive"
      });
    }
  }, []);

  // Handler para mudanças nos campos
  const handleInputChange = useCallback((field: keyof WhatsAppData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Remove erro específico quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Gera link e QR Code
  const handleGerarLink = useCallback(async () => {
    const errosValidacao: { numero?: string; mensagem?: string } = {};
    
    const erroNumero = validarNumero(data.numero);
    const erroMensagem = validarMensagem(data.mensagem);
    
    if (erroNumero) errosValidacao.numero = erroNumero;
    if (erroMensagem) errosValidacao.mensagem = erroMensagem;
    
    setErrors(errosValidacao);
    
    if (Object.keys(errosValidacao).length > 0) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const link = gerarLinkWhatsApp(data.numero, data.mensagem);
      setGeneratedLink(link);
      await gerarQRCode(link);
      
      toast({
        title: "Sucesso!",
        description: "Link do WhatsApp gerado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar link do WhatsApp",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }, [data, validarNumero, validarMensagem, gerarLinkWhatsApp, gerarQRCode]);

  // Copia link para área de transferência
  const handleCopiarLink = useCallback(async () => {
    if (!generatedLink) return;
    
    setIsCopying(true);
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  }, [generatedLink]);

  // Abre link no navegador
  const handleTestarNavegador = useCallback(() => {
    if (!generatedLink) return;
    
    window.open(generatedLink, "_blank", "noopener,noreferrer");
    
    toast({
      title: "Link aberto",
      description: "Abrindo WhatsApp Web em nova aba",
    });
  }, [generatedLink]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Integração WhatsApp</h2>
        <p className="text-muted-foreground mt-2">
          Configure links personalizados do WhatsApp para seus clientes
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Campo Número */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número do WhatsApp</Label>
              <Input
                id="numero"
                type="text"
                value={data.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
                placeholder="+5511987654321"
                className={errors.numero ? "border-destructive" : ""}
                aria-describedby={errors.numero ? "numero-error" : undefined}
              />
              {errors.numero && (
                <p id="numero-error" className="text-sm text-destructive">
                  {errors.numero}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formato: +55 (código do país) + DDD + número
              </p>
            </div>

            {/* Campo Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem Padrão</Label>
              <Textarea
                id="mensagem"
                value={data.mensagem}
                onChange={(e) => handleInputChange("mensagem", e.target.value)}
                placeholder="Digite sua mensagem padrão..."
                rows={4}
                className={errors.mensagem ? "border-destructive" : ""}
                aria-describedby={errors.mensagem ? "mensagem-error" : undefined}
              />
              {errors.mensagem && (
                <p id="mensagem-error" className="text-sm text-destructive">
                  {errors.mensagem}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {data.mensagem.length}/1000 caracteres
              </p>
            </div>

            {/* Botão Gerar Link */}
            <Button
              onClick={handleGerarLink}
              disabled={isGenerating}
              className="w-full"
              aria-label="Gerar link do WhatsApp"
            >
              {isGenerating ? "Gerando..." : "Gerar Link"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Link Gerado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedLink ? (
              <>
                {/* Link Gerado */}
                <div className="space-y-2">
                  <Label>Link do WhatsApp</Label>
                  <div className="flex gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopiarLink}
                      disabled={isCopying}
                      aria-label="Copiar link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopiarLink}
                    disabled={isCopying}
                    className="flex-1"
                    aria-label="Copiar link para área de transferência"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {isCopying ? "Copiando..." : "Copiar Link"}
                  </Button>
                  
                  <Button
                    onClick={handleTestarNavegador}
                    className="flex-1"
                    aria-label="Abrir WhatsApp em nova aba"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Testar no Navegador
                  </Button>
                </div>

                {/* QR Code */}
                {qrCodeDataUrl && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </Label>
                    <div className="flex justify-center">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code do link do WhatsApp"
                        className="border rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Escaneie com o celular para abrir diretamente no WhatsApp
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Configure os dados acima e clique em "Gerar Link"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}