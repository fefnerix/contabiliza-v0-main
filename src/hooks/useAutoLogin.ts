
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';

export const useAutoLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const performAutoLogin = async (email: string) => {
    if (!email || email === 'user@example.com') {
      toast({
        title: "Correo electrónico no encontrado",
        description: "No fue posible hacer inicio de sesión automático. Inicia sesión manualmente.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      toast({
        title: "¡Cuenta creada con éxito!",
                  description: "Redirigiendo para iniciar sesión...",
      });
      
      // Redirecionar para login manual após pagamento
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            email, 
            message: "Sua conta foi criada! Faça login com sua senha." 
          } 
        });
      }, 2000);
    } catch (error: any) {
      console.error('Erro no redirecionamento:', error);
      toast({
        title: "Redirigiendo para iniciar sesión",
                  description: "Complete su inicio de sesión para acceder a su cuenta.",
      });
      
      setTimeout(() => {
        navigate('/login', { state: { email } });
      }, 2000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { performAutoLogin, isLoggingIn };
};
