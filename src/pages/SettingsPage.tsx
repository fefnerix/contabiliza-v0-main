
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PreferencesTab from '@/components/settings/PreferencesTab';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SettingsPage = () => {
  const { t } = usePreferences();
  const { toast } = useToast();

  const exportMyData = async () => {
    const { data, error } = await supabase.functions.invoke('export-my-data');
    if (error) {
      toast({ title: 'Erro ao exportar dados', description: error.message, variant: 'destructive' });
      return;
    }
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Exportação concluída', description: 'Seu arquivo JSON foi gerado.' });
  };

  const deleteMyAccount = async () => {
    const confirmed = window.confirm(
      'Tem certeza? Esta ação é irreversível. Você perderá acesso à conta e seus dados serão removidos.',
    );
    if (!confirmed) return;

    const { error } = await supabase.functions.invoke('delete-my-data');
    if (error) {
      toast({ title: 'Não foi possível excluir conta', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Conta excluída', description: 'Seus dados foram removidos com sucesso.' });
  };

  return (
    <MainLayout>
      <div className="w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Configuraciones</h1>
        
        <PreferencesTab />

        <Card className="mt-6">
          <CardContent className="pt-6 space-y-3">
            <Button variant="outline" onClick={exportMyData}>
              Exportar meus dados
            </Button>
            <Button variant="destructive" onClick={deleteMyAccount}>
              Excluir minha conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
