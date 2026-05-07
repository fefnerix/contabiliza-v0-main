import { fbTrack } from '@/components/common/InjectFacebookPixel';

// Helper para disparar eventos específicos do sistema
export const trackFacebookEvents = {
  // Evento de Lead - quando usuário preenche formulário de contato/cadastro
  lead: (source: string = 'contact_form', value?: number) => {
    fbTrack('Lead', {
      content_name: 'Formulário de Contato',
      content_category: 'lead_generation',
      source: source,
      value: value
    });
  },

  // Evento de CompleteRegistration - quando cadastro é concluído
  completeRegistration: (method: string = 'email') => {
    fbTrack('CompleteRegistration', {
      content_name: 'Cadastro de Usuário',
      content_category: 'user_registration',
      registration_method: method
    });
  },

  // Evento de Purchase - quando assinatura é concluída
  purchase: (value: number, currency: string = 'BRL', planName?: string) => {
    fbTrack('Purchase', {
      content_name: planName || 'Assinatura Premium',
      content_category: 'subscription',
      value: value,
      currency: currency
    });
  },

  // Evento de AddToCart - quando usuário adiciona item ao carrinho (assinatura)
  addToCart: (planName: string, value: number, currency: string = 'BRL') => {
    fbTrack('AddToCart', {
      content_name: planName,
      content_category: 'subscription',
      value: value,
      currency: currency
    });
  },

  // Evento de InitiateCheckout - quando usuário inicia processo de checkout
  initiateCheckout: (planName: string, value: number, currency: string = 'BRL') => {
    fbTrack('InitiateCheckout', {
      content_name: planName,
      content_category: 'subscription',
      value: value,
      currency: currency
    });
  },

  // Evento de ViewContent - quando usuário visualiza conteúdo específico
  viewContent: (contentName: string, contentType: string = 'page') => {
    fbTrack('ViewContent', {
      content_name: contentName,
      content_category: contentType
    });
  },

  // Evento de Search - quando usuário faz busca
  search: (searchTerm: string, category?: string) => {
    fbTrack('Search', {
      search_string: searchTerm,
      content_category: category || 'general'
    });
  },

  // Evento de Contact - quando usuário entra em contato
  contact: (contactMethod: string = 'form', subject?: string) => {
    fbTrack('Contact', {
      content_name: 'Contato do Usuário',
      content_category: 'customer_service',
      contact_method: contactMethod,
      subject: subject
    });
  },

  // Evento customizado para transações financeiras
  financialTransaction: (type: 'income' | 'expense', amount: number, category?: string) => {
    fbTrack('CustomEvent', {
      event_name: 'FinancialTransaction',
      transaction_type: type,
      amount: amount,
      category: category,
      content_category: 'financial_management'
    });
  },

  // Evento customizado para metas
  goalAchievement: (goalName: string, goalValue: number, achievementDate: string) => {
    fbTrack('CustomEvent', {
      event_name: 'GoalAchievement',
      goal_name: goalName,
      goal_value: goalValue,
      achievement_date: achievementDate,
      content_category: 'goal_tracking'
    });
  }
};

// Hook para facilitar o uso dos eventos
export const useFacebookTracking = () => {
  return trackFacebookEvents;
};
