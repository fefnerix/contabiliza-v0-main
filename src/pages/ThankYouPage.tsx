import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <CardTitle className="text-2xl text-green-700 mb-2">
              ¡Gracias por activar tu cuenta!
            </CardTitle>
            <p className="text-muted-foreground">
              Tu solicitud de activación fue recibida con éxito.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Próximos pasos:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Nuestro equipo activará tu cuenta en hasta 24 horas</li>
                <li>2. Recibirás un correo electrónico de confirmación</li>
                <li>3. Inicia sesión con el correo y la contraseña proporcionados</li>
                <li>4. ¡Disfruta de todas las funciones premium!</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Button 
                asChild
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Link to="/login">
                  Ir al Inicio de Sesión
                  <ArrowRight className="ml-2 w-4 w-4" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                asChild
                className="w-full"
              >
                <Link to="/">Volver al Inicio</Link>
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p>
                ¿Necesitas ayuda? Ponte en contacto con nuestro soporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYouPage; 