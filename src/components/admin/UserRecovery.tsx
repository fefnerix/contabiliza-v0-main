
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, UserCheck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface RecoveryResult {
  recovered_count: number;
}

const UserRecovery: React.FC = () => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<RecoveryResult | null>(null);
  const [lastRecoveryTime, setLastRecoveryTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const runUserRecovery = async () => {
    setIsRecovering(true);
    try {
      // Call the function directly using rpc with any type since it's not in the generated types yet
      const { data, error } = await (supabase as any).rpc('recover_missing_users');
      
      if (error) {
        toast({
          title: "Error en la recuperación",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Handle the response data safely
      const recoveredCount = Array.isArray(data) && data.length > 0 ? data[0] : 0;
      const recoveryResult = { recovered_count: recoveredCount };
      setLastRecovery(recoveryResult);
      setLastRecoveryTime(new Date());
      
      toast({
        title: "Recuperación de usuarios completada",
        description: `${recoveryResult.recovered_count} usuarios recuperados`,
      });
    } catch (error) {
      console.error('Recovery error:', error);
      toast({
        title: "Error inesperado",
        description: "Error al ejecutar recuperación de usuarios",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Recuperación de Usuarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-medium text-orange-900 mb-2">¿Qué hace esta función:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Identifica usuarios en auth.users que no existen en poupeja_users</li>
            <li>• Crea automáticamente los registros faltantes</li>
            <li>• Útil cuando el trigger de creación automática falla</li>
            <li>• Corrige problemas de sincronización entre las tablas</li>
          </ul>
        </div>

        {lastRecovery && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Última Recuperación</h4>
              <Badge variant="outline">
                {lastRecoveryTime?.toLocaleString()}
              </Badge>
            </div>
            <div className="text-center">
              <div className="bg-green-50 p-3 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">
                    {lastRecovery.recovered_count}
                  </span>
                </div>
                <div className="text-xs text-green-700">Usuarios Recuperados</div>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={runUserRecovery}
          disabled={isRecovering}
          className="w-full"
          size="lg"
        >
          {isRecovering ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Recuperando usuarios...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Ejecutar Recuperación de Usuarios
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>Ejecuta esta función si sospechas que algunos usuarios registrados no aparecen en la plataforma.</p>
          <p className="mt-1">⚠️ Esta función es segura y puede ejecutarse en cualquier momento.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRecovery;
