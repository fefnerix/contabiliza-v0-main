
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingCTA = () => {
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('planos');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <section className="py-20 w-full">
      <div className="w-full px-4">
        <motion.div
          className="bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl p-12 md:p-16 text-center text-white max-w-6xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            ¡Comienza tu jornada financiera hoy!
          </h2>
          
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Únete a miles de personas que ya transformaron sus vidas financieras. 
            Tu libertad financiera está a un clic de distancia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-4 sm:py-6 font-semibold w-64 sm:w-auto mx-auto sm:mx-0 flex items-center justify-center gap-2"
              onClick={scrollToPlans}
            >
              <span>Estoy listo para ahorrar</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            </Button>
          </div>
          
          <div className="mt-8 text-sm opacity-75">
            ✓ Sin tarjeta de crédito necesaria
            <span className="mx-2">•</span>
            ✓ Comienza en menos de 2 minutos
            <span className="mx-2">•</span>
            ✓ Cancela cuando quieras
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingCTA;
