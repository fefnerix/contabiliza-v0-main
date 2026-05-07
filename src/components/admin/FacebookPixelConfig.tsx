import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, AlertCircle, TestTube } from 'lucide-react';

interface FacebookPixelSettings {
  facebook_pixel_enabled: boolean;
  facebook_pixel_id: string;
  facebook_pixel_events: string[];
}

const DEFAULT_EVENTS = [
  'PageView',
  'Lead', 
  'CompleteRegistration',
  'Purchase',
  'AddToCart',
  'InitiateCheckout',
  'ViewContent',
  'Search',
  'Contact'
];

export function FacebookPixelConfig() {
  const [settings, setSettings] = useState<FacebookPixelSettings>({
    facebook_pixel_enabled: false,
    facebook_pixel_id: '',
    facebook_pixel_events: DEFAULT_EVENTS
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  // Carregar configurações do Supabase
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('poupeja_settings')
        .select('key, value, value_type')
        .in('key', ['facebook_pixel_enabled', 'facebook_pixel_id', 'facebook_pixel_events']);

      if (error) throw error;

      const newSettings: FacebookPixelSettings = {
        facebook_pixel_enabled: false,
        facebook_pixel_id: '',
        facebook_pixel_events: DEFAULT_EVENTS
      };

      data?.forEach(item => {
        if (item.key === 'facebook_pixel_enabled') {
          newSettings.facebook_pixel_enabled = item.value === 'true';
        } else if (item.key === 'facebook_pixel_id') {
          newSettings.facebook_pixel_id = item.value || '';
        } else if (item.key === 'facebook_pixel_events') {
          try {
            newSettings.facebook_pixel_events = JSON.parse(item.value || '[]');
          } catch {
            newSettings.facebook_pixel_events = DEFAULT_EVENTS;
          }
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configurações do Facebook Pixel',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (settings.facebook_pixel_enabled && !isValidPixelId(settings.facebook_pixel_id)) {
      toast({
        title: 'Erro de Validação',
        description: 'ID do Pixel deve conter 15-20 dígitos numéricos',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const updates = [
        {
          key: 'facebook_pixel_enabled',
          value: settings.facebook_pixel_enabled.toString(),
          value_type: 'boolean',
          category: 'marketing'
        },
        {
          key: 'facebook_pixel_id',
          value: settings.facebook_pixel_id,
          value_type: 'string',
          category: 'marketing'
        },
        {
          key: 'facebook_pixel_events',
          value: JSON.stringify(settings.facebook_pixel_events),
          value_type: 'json',
          category: 'marketing'
        }
      ];

      const { error } = await supabase
        .from('poupeja_settings')
        .upsert(updates, { onConflict: 'category,key' });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações do Facebook Pixel salvas com sucesso!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações do Facebook Pixel',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const testPixel = async () => {
    if (!settings.facebook_pixel_enabled || !settings.facebook_pixel_id) {
      toast({
        title: 'Erro',
        description: 'Ative o Pixel e configure o ID antes de testar',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    try {
      // Verificar se estamos em produção
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('staging')) {
        toast({
          title: 'Aviso',
          description: 'Teste do Pixel só funciona em produção',
          variant: 'destructive'
        });
        return;
      }

      // Verificar se fbq está disponível
      if (typeof window.fbq === 'undefined') {
        toast({
          title: 'Erro',
          description: 'Facebook Pixel não está carregado. Verifique se está ativo.',
          variant: 'destructive'
        });
        return;
      }

      // Disparar evento de teste
      window.fbq('track', 'PageView');
      
      toast({
        title: 'Sucesso',
        description: 'Evento PageView disparado com sucesso!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao testar Pixel:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao testar Facebook Pixel',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const isValidPixelId = (id: string): boolean => {
    return /^\d{15,20}$/.test(id);
  };

  const handleEventToggle = (event: string) => {
    setSettings(prev => ({
      ...prev,
      facebook_pixel_events: prev.facebook_pixel_events.includes(event)
        ? prev.facebook_pixel_events.filter(e => e !== event)
        : [...prev.facebook_pixel_events, event]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
              f
            </div>
            Facebook Pixel
          </CardTitle>
          <CardDescription>
            Configure o Facebook Pixel para rastreamento e remarketing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ativar Pixel */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="pixel-enabled">Ativar Facebook Pixel</Label>
              <p className="text-sm text-muted-foreground">
                Habilita o rastreamento do Facebook Pixel no site
              </p>
            </div>
            <Switch
              id="pixel-enabled"
              checked={settings.facebook_pixel_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, facebook_pixel_enabled: checked }))
              }
            />
          </div>

          <Separator />

          {/* Pixel ID */}
          <div className="space-y-2">
            <Label htmlFor="pixel-id">Pixel ID</Label>
            <Input
              id="pixel-id"
              placeholder="Ex: 123456789012345"
              value={settings.facebook_pixel_id}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, facebook_pixel_id: e.target.value }))
              }
              disabled={!settings.facebook_pixel_enabled}
            />
            <p className="text-sm text-muted-foreground">
              ID do Facebook Pixel (15-20 dígitos numéricos)
            </p>
            {settings.facebook_pixel_enabled && settings.facebook_pixel_id && (
              <div className="flex items-center gap-2">
                {isValidPixelId(settings.facebook_pixel_id) ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">ID válido</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">ID inválido</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Eventos Padrão */}
          <div className="space-y-3">
            <Label>Eventos Padrão</Label>
            <p className="text-sm text-muted-foreground">
              Selecione os eventos que serão rastreados automaticamente
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_EVENTS.map(event => (
                <div key={event} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`event-${event}`}
                    checked={settings.facebook_pixel_events.includes(event)}
                    onChange={() => handleEventToggle(event)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`event-${event}`} className="text-sm">
                    {event}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {settings.facebook_pixel_events.map(event => (
                <Badge key={event} variant="secondary" className="text-xs">
                  {event}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
            
            <Button 
              onClick={testPixel} 
              disabled={testing || !settings.facebook_pixel_enabled || !settings.facebook_pixel_id}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Testar
            </Button>
          </div>

          {/* Status */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Status do Pixel</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Pixel Ativo:</span>
                <Badge variant={settings.facebook_pixel_enabled ? "default" : "secondary"}>
                  {settings.facebook_pixel_enabled ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>ID Configurado:</span>
                <Badge variant={settings.facebook_pixel_id ? "default" : "secondary"}>
                  {settings.facebook_pixel_id ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Eventos:</span>
                <Badge variant="outline">
                  {settings.facebook_pixel_events.length} configurados
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
