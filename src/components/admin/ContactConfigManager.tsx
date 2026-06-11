
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Phone, Mail, MessageCircle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const ContactConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    whatsappBotPhone: '',
    whatsappSupportPhone: '',
    supportEmail: '',
    whatsappMessage: '',
  });

  const loadContactConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('Error al cargar configuraciones de contacto:', error);
        return;
      }
      
      if (data?.success && data?.settings) {
        const contactSettings = data.settings.contact || {};
        setFormData({
          whatsappBotPhone: contactSettings.contact_phone?.value || '',
          whatsappSupportPhone: contactSettings.contact_whatsapp?.value || '',
          supportEmail: contactSettings.support_email?.value || '',
          whatsappMessage: contactSettings.whatsapp_message?.value || '¡Hola! Necesito ayuda con Contabiliza.',
        });
      }
    } catch (err) {
      console.error('Error al cargar configuraciones de contacto:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadContactConfig();
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'contact',
          updates: {
            contact_phone: formData.whatsappBotPhone,
            contact_whatsapp: formData.whatsappSupportPhone,
            support_email: formData.supportEmail,
            whatsapp_message: formData.whatsappMessage,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Configuración de contacto guardada!",
          description: "Toda la información de contacto fue actualizada.",
        });
        
        // Recargar configuraciones después de guardar
        await loadContactConfig();
      }
    } catch (error: any) {
      console.error('Error al guardar configuraciones de contacto:', error);
      toast({
        title: "Error al guardar",
        description: error.message || 'No fue posible guardar la configuración de contacto.',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando configuración de contacto...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            Acceso Denegado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No tienes permisos para acceder a la configuración de contacto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Configuración de Contacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium mb-2">📞 Configuración de Contacto</p>
              <div className="text-green-700 text-sm space-y-2">
                <p>Configura los canales de comunicación disponibles para los usuarios.</p>
                <p>Esta información será usada en los botones de contacto y redireccionamientos.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </h3>

          <div className="space-y-2">
            <Label htmlFor="whatsappBotPhone">Contabiliza AI — registrar transacciones</Label>
            <Input
              id="whatsappBotPhone"
              value={formData.whatsappBotPhone}
              onChange={(e) => handleInputChange("whatsappBotPhone", e.target.value)}
              placeholder="5511936235098"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Número del bot (topbar del dashboard). Solo dígitos con código de país.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappSupportPhone">WhatsApp de soporte</Label>
            <Input
              id="whatsappSupportPhone"
              value={formData.whatsappSupportPhone}
              onChange={(e) => handleInputChange("whatsappSupportPhone", e.target.value)}
              placeholder="5524981537082"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Atención humana (botón en la barra lateral).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappMessage">Mensaje predeterminado (activación / pagos)</Label>
            <Input
              id="whatsappMessage"
              value={formData.whatsappMessage}
              onChange={(e) => handleInputChange('whatsappMessage', e.target.value)}
              placeholder="¡Hola! Necesito ayuda con Contabiliza."
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Mensaje que será pre-llenado cuando el usuario abra WhatsApp
            </p>
          </div>

          {formData.whatsappBotPhone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm font-medium mb-1">Vista previa — bot (registro):</p>
              <p className="text-blue-700 text-xs font-mono break-all">
                https://wa.me/{formData.whatsappBotPhone}
              </p>
            </div>
          )}
          {formData.whatsappSupportPhone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
              <p className="text-blue-800 text-sm font-medium mb-1">Vista previa — soporte:</p>
              <p className="text-blue-700 text-xs font-mono break-all">
                https://wa.me/{formData.whatsappSupportPhone}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="supportEmail">Email de Soporte</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) => handleInputChange('supportEmail', e.target.value)}
              placeholder="soporte@poupeja.com"
              disabled={isUpdating}
            />
            <p className="text-xs text-gray-500">
              Email donde los usuarios pueden enviar dudas y problemas
            </p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactConfigManager;
