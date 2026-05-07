
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, DollarSign, Calculator } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { formatMoney } from '@/utils/currency';

const PlanPricingManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    planPriceMonthly: '',
    planPriceAnnual: '',
  });

  const loadPricingConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-settings');
      
      if (error) {
        console.error('Error al cargar configuraciones de precios:', error);
        return;
      }
      
      if (data?.success && data?.settings) {
        const pricingSettings = data.settings.pricing || {};
        setFormData({
          planPriceMonthly: String(pricingSettings.plan_price_monthly?.value || ''),
          planPriceAnnual: String(pricingSettings.plan_price_annual?.value || ''),
        });
      }
    } catch (err) {
      console.error('Error al cargar configuraciones de precios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadPricingConfig();
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDiscount = () => {
    if (!formData.planPriceMonthly || !formData.planPriceAnnual) {
      return '0';
    }
    
    const monthly = parseFloat(String(formData.planPriceMonthly).replace(',', '.'));
    const annual = parseFloat(String(formData.planPriceAnnual).replace(',', '.'));
    
    if (monthly && annual) {
      const yearlyEquivalent = monthly * 12;
      const discount = ((yearlyEquivalent - annual) / yearlyEquivalent) * 100;
      return discount.toFixed(0);
    }
    return '0';
  };

  const handleSave = async () => {
    try {
      setIsUpdating(true);
      
      const { data, error } = await supabase.functions.invoke('update-admin-settings', {
        body: {
          category: 'pricing',
          updates: {
            plan_price_monthly: formData.planPriceMonthly,
            plan_price_annual: formData.planPriceAnnual,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "¡Configuración de precios guardada!",
          description: "Los valores de los planes fueron actualizados.",
        });
        
        // Recargar configuraciones después de guardar
        await loadPricingConfig();
      }
    } catch (error: any) {
      console.error('Error al guardar configuraciones de precios:', error);
      toast({
        title: "Error al guardar",
        description: error.message || 'No fue posible guardar la configuración de precios.',
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
            <span>Cargando configuración de precios...</span>
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
            No tienes permisos para acceder a la configuración de precios.
          </p>
        </CardContent>
      </Card>
    );
  }

  const discount = calculateDiscount();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuración de Precios de los Planes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium mb-2">💰 Configuración de Precios</p>
              <div className="text-green-700 text-sm space-y-2">
                <p>Configura los valores que serán mostrados a los usuarios en la página de planes.</p>
                <p><strong>Importante:</strong> Estos valores deben corresponder a los precios configurados en Stripe.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="planPriceMonthly">Valor del Plan Mensual (USD)</Label>
            <Input
              id="planPriceMonthly"
              value={formData.planPriceMonthly}
              onChange={(e) => handleInputChange('planPriceMonthly', e.target.value)}
              placeholder="29.90"
              disabled={isUpdating}
              type="text"
              inputMode="decimal"
            />
            <p className="text-xs text-gray-500">Valor cobrado mensualmente</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="planPriceAnnual">Valor del Plan Anual (USD)</Label>
            <Input
              id="planPriceAnnual"
              value={formData.planPriceAnnual}
              onChange={(e) => handleInputChange('planPriceAnnual', e.target.value)}
              placeholder="177.00"
              disabled={isUpdating}
              type="text"
              inputMode="decimal"
            />
            <p className="text-xs text-gray-500">Valor cobrado anualmente</p>
          </div>
        </div>

        {formData.planPriceMonthly && formData.planPriceAnnual && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">Cálculo de Descuento</h4>
            </div>
            <div className="text-blue-700 text-sm space-y-1">
              <p>Valor mensual × 12: {formatMoney(parseFloat(String(formData.planPriceMonthly).replace(',', '.')) * 12, { currency: 'USD', onlySymbol: true })}</p>
              <p>Valor anual: {formatMoney(parseFloat(String(formData.planPriceAnnual).replace(',', '.')), { currency: 'USD', onlySymbol: true })}</p>
              <p className="font-medium">Descuento anual: {discount}%</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-sm">
            <strong>Recuerda:</strong> Después de cambiar los precios aquí, también debes:
          </p>
          <ul className="text-amber-700 text-sm mt-2 space-y-1 list-disc list-inside">
            <li>Actualizar los precios en el Dashboard de Stripe</li>
            <li>Verificar si los Price IDs en la sección Stripe están correctos</li>
            <li>Probar el flujo de pago</li>
          </ul>
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

export default PlanPricingManager;
