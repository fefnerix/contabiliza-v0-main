/** Rótulos em espanhol para exportação e visualização no admin */
export const ACTIVATION_FORM_FIELD_LABELS: Record<string, string> = {
  fullName: "1.1 Nombre completo",
  email: "1.2 Correo electrónico",
  whatsapp: "1.3 WhatsApp",
  country: "1.4 País",
  currency: "1.5 Moneda del plan",
  currencyOther: "1.5 Moneda (otra)",
  ageRange: "1.6 Rango de edad",
  gender: "1.7 Género",
  knowsJhonnySince: "1.8 Conoce a Jhonny desde",
  familySituation: "1.9 Situación familiar",
  householdIncomeUsd: "1.10 Ingreso familiar (USD)",
  occupation: "2.1 Ocupación",
  educationLevel: "2.2 Nivel de formación",
  incomeSource: "2.3 Fuente de ingreso",
  incomeStability: "2.4 Estabilidad del ingreso",
  personalMonthlyIncome: "2.5 Ingreso mensual personal",
  incomeSourcesCount: "2.6 Fuentes de ingreso",
  worksWithPurpose: "2.7 Trabaja con propósito",
  wantsCareerChange: "2.8 Quiere cambio de carrera",
  targetArea: "2.9 Área objetivo",
  entrepreneurshipPlan: "2.10 Plan de emprendimiento",
  entrepreneurshipIdea: "2.10 Idea de negocio",
  monetizableSkills: "2.11 Habilidades monetizables",
  housingExpense: "3.1 Vivienda",
  foodExpense: "3.2 Alimentación",
  transportExpense: "3.3 Transporte",
  servicesExpense: "3.4 Servicios",
  educationExpense: "3.5 Educación",
  healthExpense: "3.6 Salud",
  entertainmentExpense: "3.7 Entretenimiento",
  subscriptionsExpense: "3.8 Suscripciones",
  fixedOtherExpense: "3.9 Otros fijos",
  unexpectedExpense: "3.10 Imprevistos",
  monthEndSituation: "3.11 Fin de mes",
  hasDebts: "4.1 ¿Tiene deudas?",
  debtTrend: "4.2 Tendencia de deuda",
  savesToday: "4.3 ¿Ahorra hoy?",
  monthlySavingsAmount: "4.4 Monto de ahorro mensual",
  emergencyFund: "4.5 Fondo de emergencia",
  investsToday: "4.6 ¿Invierte hoy?",
  investmentType: "4.7 Tipo de inversión",
  targetMonthlyIncome12m: "5.1 Ingreso mensual meta 12m",
  targetSavedOrInvested12m: "5.2 Meta ahorro/inversión 12m",
  targetReason: "5.3 Motivo de la meta",
  targetImpact: "5.4 Impacto esperado",
  weeklyDedication: "6.1 Dedicación semanal",
  learningWillingness: "6.2 Disposición a aprender",
  riskProfile: "6.3 Perfil de riesgo",
  biggestMoneyFrustration: "7.1 Mayor frustración con el dinero",
  whatDidNotWork: "7.2 Qué no funcionó antes",
  biggestFear: "7.3 Mayor miedo",
  concernIfNoChange: "7.4 Preocupación si no cambia",
  faithMoneyRelationship: "7.5 Relación fe y dinero",
  messageToJhonny: "8.1 Mensaje para Jhonny",
  contabilizaCommitment: "8.2 Compromiso Contabiliza",
  usesSameWhatsapp: "8.3 Mismo WhatsApp",
  activationCurrency: "8.4 Moneda de activación",
  activationCurrencyOther: "8.4 Moneda activación (otra)",
  debts: "4 Deudas (detalle)",
  submittedAt: "Enviado el",
};

export const formatActivationFieldValue = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const flattenActivationFormData = (formData: Record<string, unknown> | null): Record<string, string> => {
  if (!formData) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(formData)) {
    out[key] = formatActivationFieldValue(value);
  }
  return out;
};
