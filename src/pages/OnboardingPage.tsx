import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/AppContext";
import { markOnboardingDone } from "@/utils/onboarding";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DebtItem = {
  name: string;
  totalAmount: string;
  monthlyPayment: string;
  paymentStatus: "" | "Sí" | "Voy atrasado" | "No la estoy pagando";
};

type ActivationFormData = {
  fullName: string;
  email: string;
  whatsapp: string;
  country: string;
  currency: string;
  currencyOther: string;
  ageRange: string;
  gender: string;
  knowsJhonnySince: string;
  familySituation: string;
  householdIncomeUsd: string;
  occupation: string;
  educationLevel: string;
  incomeSource: string;
  incomeStability: string;
  personalMonthlyIncome: string;
  incomeSourcesCount: string;
  worksWithPurpose: string;
  wantsCareerChange: string;
  targetArea: string;
  entrepreneurshipPlan: string;
  entrepreneurshipIdea: string;
  monetizableSkills: string;
  housingExpense: string;
  foodExpense: string;
  transportExpense: string;
  servicesExpense: string;
  educationExpense: string;
  healthExpense: string;
  entertainmentExpense: string;
  subscriptionsExpense: string;
  fixedOtherExpense: string;
  unexpectedExpense: string;
  monthEndSituation: string;
  hasDebts: "Sí" | "No" | "";
  debtTrend: string;
  savesToday: string;
  monthlySavingsAmount: string;
  emergencyFund: string;
  investsToday: string;
  investmentType: string;
  targetMonthlyIncome12m: string;
  targetSavedOrInvested12m: string;
  targetReason: string;
  targetImpact: string;
  weeklyDedication: string;
  learningWillingness: string;
  riskProfile: string;
  biggestMoneyFrustration: string;
  whatDidNotWork: string;
  biggestFear: string;
  concernIfNoChange: string;
  faithMoneyRelationship: string;
  messageToJhonny: string;
  contabilizaCommitment: string;
  usesSameWhatsapp: string;
  activationCurrency: string;
  activationCurrencyOther: string;
};

const TOTAL_STEPS = 3;

const COUNTRIES = [
  "Colombia", "México", "Estados Unidos", "España", "Chile", "Perú", "Argentina",
  "Ecuador", "Venezuela", "República Dominicana", "Costa Rica", "Panamá",
  "Guatemala", "Honduras", "El Salvador", "Bolivia", "Paraguay", "Uruguay",
  "Brasil", "Otro",
];

const CURRENCY_OPTIONS = [
  "Dólar estadounidense (USD)",
  "Peso colombiano (COP)",
  "Peso mexicano (MXN)",
  "Peso argentino (ARS)",
  "Peso chileno (CLP)",
  "Sol peruano (PEN)",
  "Real brasileño (BRL)",
  "Euro (EUR)",
  "Otra (especifica cuál)",
];

const COUNTRY_BY_CODE: Record<string, string> = {
  CO: "Colombia",
  MX: "México",
  US: "Estados Unidos",
  ES: "España",
  CL: "Chile",
  PE: "Perú",
  AR: "Argentina",
  EC: "Ecuador",
  VE: "Venezuela",
  DO: "República Dominicana",
  CR: "Costa Rica",
  PA: "Panamá",
  GT: "Guatemala",
  HN: "Honduras",
  SV: "El Salvador",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  BR: "Brasil",
};

const CURRENCY_OPTION_BY_CODE: Record<string, string> = {
  USD: "Dólar estadounidense (USD)",
  COP: "Peso colombiano (COP)",
  MXN: "Peso mexicano (MXN)",
  ARS: "Peso argentino (ARS)",
  CLP: "Peso chileno (CLP)",
  PEN: "Sol peruano (PEN)",
  BRL: "Real brasileño (BRL)",
  EUR: "Euro (EUR)",
};

const emptyDebt = (): DebtItem => ({ name: "", totalAmount: "", monthlyPayment: "", paymentStatus: "" });

const initialFormData: ActivationFormData = {
  fullName: "",
  email: "",
  whatsapp: "",
  country: "",
  currency: "",
  currencyOther: "",
  ageRange: "",
  gender: "",
  knowsJhonnySince: "",
  familySituation: "",
  householdIncomeUsd: "",
  occupation: "",
  educationLevel: "",
  incomeSource: "",
  incomeStability: "",
  personalMonthlyIncome: "",
  incomeSourcesCount: "",
  worksWithPurpose: "",
  wantsCareerChange: "",
  targetArea: "",
  entrepreneurshipPlan: "",
  entrepreneurshipIdea: "",
  monetizableSkills: "",
  housingExpense: "",
  foodExpense: "",
  transportExpense: "",
  servicesExpense: "",
  educationExpense: "",
  healthExpense: "",
  entertainmentExpense: "",
  subscriptionsExpense: "",
  fixedOtherExpense: "",
  unexpectedExpense: "",
  monthEndSituation: "",
  hasDebts: "",
  debtTrend: "",
  savesToday: "",
  monthlySavingsAmount: "",
  emergencyFund: "",
  investsToday: "",
  investmentType: "",
  targetMonthlyIncome12m: "",
  targetSavedOrInvested12m: "",
  targetReason: "",
  targetImpact: "",
  weeklyDedication: "",
  learningWillingness: "",
  riskProfile: "",
  biggestMoneyFrustration: "",
  whatDidNotWork: "",
  biggestFear: "",
  concernIfNoChange: "",
  faithMoneyRelationship: "",
  messageToJhonny: "",
  contabilizaCommitment: "",
  usesSameWhatsapp: "",
  activationCurrency: "",
  activationCurrencyOther: "",
};

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
};

const sumNumbers = (...values: string[]) =>
  values.reduce((acc, current) => acc + (parseOptionalNumber(current) ?? 0), 0);

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppContext();
  const [step, setStep] = useState(1);
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ActivationFormData>(initialFormData);
  const [debts, setDebts] = useState<DebtItem[]>([emptyDebt()]);

  useEffect(() => {
    let mounted = true;

    const prefillFromUser = async () => {
      if (!user?.id) return;
      try {
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const metaName =
          (meta.full_name as string) ||
          (meta.name as string) ||
          (meta.fullName as string) ||
          "";
        const metaPhone =
          (meta.phone as string) ||
          (meta.whatsapp as string) ||
          "";
        const metaCountryCode = ((meta.country as string) || "").toUpperCase();
        const metaCurrencyCode = ((meta.currency as string) || "").toUpperCase();

        const { data: userRow } = await supabase
          .from("poupeja_users")
          .select("name, email, phone, country, currency")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;

        const countryValue =
          COUNTRY_BY_CODE[(userRow?.country || metaCountryCode || "").toUpperCase()] || "";
        const currencyValue =
          CURRENCY_OPTION_BY_CODE[(userRow?.currency || metaCurrencyCode || "").toUpperCase()] || "";

        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || userRow?.name || metaName,
          email: prev.email || userRow?.email || user.email || "",
          whatsapp: prev.whatsapp || userRow?.phone || metaPhone,
          country: prev.country || countryValue,
          currency: prev.currency || currencyValue,
          activationCurrency: prev.activationCurrency || currencyValue,
        }));
      } catch (prefillError) {
        console.error("onboarding prefill error", prefillError);
      }
    };

    void prefillFromUser();
    return () => {
      mounted = false;
    };
  }, [user]);

  const progress = (step / TOTAL_STEPS) * 100;
  const sectionTitles = [
    "Empecemos por ti",
    "Tu presente profesional y tus ingresos",
    "Tu radiografía de gastos",
    "Tus deudas",
    "Tu ahorro, tu colchón y tus inversiones",
    "Tu meta de 12 meses",
    "Tu mundo interior",
    "Tu activación en Contabiliza AI",
  ];
  const isLastSection = activeSection === sectionTitles.length - 1;

  const totalDebtAmount = useMemo(
    () => debts.reduce((acc, debt) => acc + (parseOptionalNumber(debt.totalAmount) ?? 0), 0),
    [debts]
  );

  const setField = (field: keyof ActivationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateDebt = (idx: number, field: keyof DebtItem, value: string) => {
    setDebts((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addDebt = () => {
    setDebts((prev) => (prev.length >= 5 ? prev : [...prev, emptyDebt()]));
  };

  const isRequiredMissing = () => {
    const requiredFields: Array<keyof ActivationFormData> = [
      "fullName", "email", "whatsapp", "country", "currency", "ageRange", "gender",
      "knowsJhonnySince", "familySituation", "householdIncomeUsd", "occupation",
      "educationLevel", "incomeSource", "incomeStability", "personalMonthlyIncome",
      "incomeSourcesCount", "worksWithPurpose", "wantsCareerChange", "targetArea",
      "entrepreneurshipPlan", "entrepreneurshipIdea", "monetizableSkills", "monthEndSituation",
      "hasDebts", "debtTrend", "savesToday", "emergencyFund", "investsToday",
      "targetMonthlyIncome12m", "targetSavedOrInvested12m", "targetReason", "targetImpact",
      "weeklyDedication", "learningWillingness", "riskProfile", "biggestMoneyFrustration",
      "whatDidNotWork", "biggestFear", "concernIfNoChange", "faithMoneyRelationship",
      "messageToJhonny", "contabilizaCommitment", "usesSameWhatsapp", "activationCurrency",
    ];
    return requiredFields.some((k) => !String(form[k]).trim());
  };

  const submitActivation = async () => {
    if (!user?.id) {
      setError("Sesión no encontrada. Inicia sesión nuevamente.");
      return;
    }
    if (isRequiredMissing()) {
      setError("Por favor completa todas las preguntas obligatorias del formulario.");
      return;
    }
    if (form.currency === "Otra (especifica cuál)" && !form.currencyOther.trim()) {
      setError("Por favor especifica la moneda en la pregunta 1.5.");
      return;
    }
    if (form.activationCurrency === "Otra (especifica cuál)" && !form.activationCurrencyOther.trim()) {
      setError("Por favor especifica la moneda en la pregunta 8.3.");
      return;
    }
    if (form.currency !== form.activationCurrency) {
      setError("La moneda de la pregunta 8.3 debe ser la misma de la pregunta 1.5.");
      return;
    }
    if (form.hasDebts === "Sí") {
      const hasValidDebt = debts.some((d) => d.name.trim() || d.totalAmount.trim() || d.monthlyPayment.trim());
      if (!hasValidDebt) {
        setError("Si tienes deudas, registra al menos una en la sección 4.");
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      const selectedCurrency =
        form.currency === "Otra (especifica cuál)" ? form.currencyOther : form.currency;
      const selectedActivationCurrency =
        form.activationCurrency === "Otra (especifica cuál)"
          ? form.activationCurrencyOther
          : form.activationCurrency;

      const fixedExpenses = sumNumbers(
        form.housingExpense,
        form.servicesExpense,
        form.educationExpense,
        form.healthExpense,
        form.subscriptionsExpense,
        form.fixedOtherExpense
      );
      const variableExpenses = sumNumbers(
        form.foodExpense,
        form.transportExpense,
        form.entertainmentExpense,
        form.unexpectedExpense
      );

      const { error: userProfileError } = await supabase.from("poupeja_users").upsert(
        {
          id: user.id,
          email: form.email.trim(),
          name: form.fullName.trim() || null,
          phone: form.whatsapp.trim() || null,
          country: form.country || null,
          currency: selectedCurrency || selectedActivationCurrency || null,
        },
        { onConflict: "id" }
      );
      if (userProfileError) throw userProfileError;

      const { error: profileError } = await supabase.from("poupeja_financial_profile").upsert(
        {
          user_id: user.id,
          monthly_income: parseOptionalNumber(form.personalMonthlyIncome),
          fixed_expenses: fixedExpenses || null,
          variable_expenses: variableExpenses || null,
          total_debt: form.hasDebts === "Sí" ? totalDebtAmount : 0,
          monthly_savings: parseOptionalNumber(form.monthlySavingsAmount),
          goal_12m: form.targetReason.trim() || null,
          goal_amount: parseOptionalNumber(form.targetSavedOrInvested12m),
          biggest_challenge: form.biggestMoneyFrustration.trim() || null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (profileError) throw profileError;

      const submittedAt = new Date().toISOString();
      const fullPayload = {
        ...form,
        currency: selectedCurrency,
        activationCurrency: selectedActivationCurrency,
        debts: form.hasDebts === "Sí" ? debts : [],
        submittedAt,
      };

      const { error: activationFormError } = await supabase
        .from("poupeja_activation_forms")
        .upsert(
          {
            user_id: user.id,
            full_name: form.fullName.trim() || null,
            email: form.email.trim() || null,
            phone: form.whatsapp.trim() || null,
            country: form.country || null,
            currency: selectedCurrency || selectedActivationCurrency || null,
            monthly_income: parseOptionalNumber(form.personalMonthlyIncome),
            goal_amount: parseOptionalNumber(form.targetSavedOrInvested12m),
            total_debt: form.hasDebts === "Sí" ? totalDebtAmount : 0,
            form_data: fullPayload,
            submitted_at: submittedAt,
          },
          { onConflict: "user_id" }
        );
      if (activationFormError) throw activationFormError;

      setStep(3);
    } catch (submitError) {
      console.error("activation form submit error", submitError);
      setError("No se pudo guardar el formulario. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const finish = () => {
    markOnboardingDone();
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6 pb-28 sm:pb-8">
        <p className="text-xs sm:text-sm text-muted-foreground text-center">Paso {step} de {TOTAL_STEPS}</p>
        <Progress value={progress} className="h-2" />

        {step === 1 && (
          <Card className="p-5 sm:p-7 space-y-4 border-border/70 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Camino de Abundancia
              </p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                Formulario de activación
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Tu punto de partida hacia la Maestría en Finanzas Espirituales y Creación de Riqueza Moral.
              </p>
            </div>
            <p>Bienvenida a tu Camino de Abundancia.</p>
            <p>
              Antes de empezar, quiero conocer tu realidad financiera de hoy. No para juzgarla, sino para ayudarte de verdad.
            </p>
            <p>
              Este formulario es la radiografía con la que mi equipo y yo vamos a diseñar tu plan personalizado para los próximos 12 meses.
            </p>
            <p>
              Tu información es 100% confidencial. Estos datos son únicamente para mi equipo y nuestro sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              Tiempo estimado: 12 a 15 minutos. Respira, ponte cómodo y responde con calma.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setActiveSection(0);
                setStep(2);
              }}
            >
              Empezar formulario
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-4 sm:p-6 space-y-6 sm:space-y-8 border-border/70 shadow-sm [&_section]:rounded-xl [&_section]:border [&_section]:border-border/70 [&_section]:bg-muted/20 [&_section]:p-4 sm:[&_section]:p-5 [&_section>h2]:mb-1 [&_section>h2]:text-base sm:[&_section>h2]:text-lg [&_section>h2]:font-semibold [&_section>h2]:tracking-tight [&_section>div]:space-y-1.5 [&_label]:text-sm [&_label]:font-medium [&_input]:h-11 [&_textarea]:min-h-[104px] [&_[role=combobox]]:h-11">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sección {activeSection + 1} de {sectionTitles.length}
              </p>
              <p className="text-sm sm:text-base font-medium text-foreground">{sectionTitles[activeSection]}</p>
              <Progress value={((activeSection + 1) / sectionTitles.length) * 100} className="h-2" />
            </div>

            {activeSection === 0 && (
            <section className="space-y-4">
              <h2>Empecemos por ti</h2>
              <div><Label>1.1 ¿Cuál es tu nombre completo?</Label><Input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} /></div>
              <div><Label>1.2 ¿Cuál es tu correo electrónico?</Label><Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} /></div>
              <div><Label>1.3 ¿Cuál es tu número de WhatsApp?</Label><Input value={form.whatsapp} onChange={(e) => setField("whatsapp", e.target.value)} placeholder="+57..." /></div>
              <div><Label>1.4 ¿En qué país vives actualmente?</Label><Select value={form.country} onValueChange={(v) => setField("country", v)}><SelectTrigger><SelectValue placeholder="Selecciona país" /></SelectTrigger><SelectContent>{COUNTRIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>1.5 ¿En qué moneda quieres trabajar tu plan? (OJO: Todas las respuestas, excepto la 1.10, deben seguir ESTA MONEDA)</Label><Select value={form.currency} onValueChange={(v) => setField("currency", v)}><SelectTrigger><SelectValue placeholder="Selecciona moneda" /></SelectTrigger><SelectContent>{CURRENCY_OPTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>{form.currency === "Otra (especifica cuál)" && <Input placeholder="Especifica moneda" value={form.currencyOther} onChange={(e) => setField("currencyOther", e.target.value)} />}</div>
              <div><Label>1.6 ¿Cuál es tu rango de edad?</Label><Select value={form.ageRange} onValueChange={(v) => setField("ageRange", v)}><SelectTrigger><SelectValue placeholder="Selecciona rango" /></SelectTrigger><SelectContent>{["25 años o menos","Entre 26 y 35 años","Entre 36 y 45 años","Entre 46 y 55 años","Entre 56 y 65 años","Más de 65 años"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>1.7 ¿Cuál es tu género?</Label><Select value={form.gender} onValueChange={(v) => setField("gender", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Femenino","Masculino"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>1.8 ¿Hace cuánto tiempo conoces a Jhonny?</Label><Select value={form.knowsJhonnySince} onValueChange={(v) => setField("knowsJhonnySince", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Hace un mes o menos","Entre uno y seis meses","Entre seis meses y un año","Más de un año"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>1.9 Situación familiar</Label><Textarea value={form.familySituation} onChange={(e) => setField("familySituation", e.target.value)} /></div>
              <div><Label>1.10 Ingreso mensual del hogar (USD)</Label><Select value={form.householdIncomeUsd} onValueChange={(v) => setField("householdIncomeUsd", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["No tengo ningún ingreso actualmente","Hasta $300","Entre $300 y $500","Entre $500 y $700","Entre $700 y $1.000","Entre $1.000 y $2.000","Entre $2.000 y $3.000","Más de $3.000"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            </section>
            )}

            {activeSection === 1 && (
            <section className="space-y-4">
              <h2>Tu presente profesional y tus ingresos</h2>
              <div><Label>2.1 ¿A qué te dedicas actualmente?</Label><Textarea value={form.occupation} onChange={(e) => setField("occupation", e.target.value)} /></div>
              <div><Label>2.2 Nivel de formación</Label><Select value={form.educationLevel} onValueChange={(v) => setField("educationLevel", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sin estudios formales completos","Bachillerato o secundaria","Técnico o tecnólogo","Universitario (en curso o terminado)","Posgrado (especialización, maestría o doctorado)"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.3 ¿Cómo generas tus ingresos hoy?</Label><Select value={form.incomeSource} onValueChange={(v) => setField("incomeSource", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Empleo fijo (salario mensual)","Trabajo independiente o por proyectos","Negocio o emprendimiento propio","Pensión o renta","Combino varias de las anteriores","Hoy no tengo ingresos propios"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.4 ¿Tu ingreso es estable o variable?</Label><Select value={form.incomeStability} onValueChange={(v) => setField("incomeStability", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Estable: gano más o menos lo mismo todos los meses","Variable: cambia bastante de un mes a otro","Mixto: una parte fija y una parte variable"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.5 Ingreso personal promedio al mes (número)</Label><Input value={form.personalMonthlyIncome} onChange={(e) => setField("personalMonthlyIncome", e.target.value)} /></div>
              <div><Label>2.6 ¿De cuántas fuentes proviene tu ingreso?</Label><Select value={form.incomeSourcesCount} onValueChange={(v) => setField("incomeSourcesCount", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Solo una (mi trabajo o actividad principal)","Una principal y algo extra de vez en cuando","Dos fuentes relativamente estables","Tres o más fuentes de ingreso"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.7 ¿Trabajas hoy en lo que realmente quieres?</Label><Select value={form.worksWithPurpose} onValueChange={(v) => setField("worksWithPurpose", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí, hago lo que amo","Más o menos: hay cosas que me gustan y otras que no","No, siento que estoy en el lugar equivocado"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.8 ¿Te gustaría cambiar de área, oficio o actividad?</Label><Select value={form.wantsCareerChange} onValueChange={(v) => setField("wantsCareerChange", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí, quiero cambiar","No, quiero crecer en lo que ya hago","Todavía no estoy segura"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.9 ¿Hacia qué área o actividad te gustaría ir, y por qué?</Label><Textarea value={form.targetArea} onChange={(e) => setField("targetArea", e.target.value)} /></div>
              <div><Label>2.10 ¿Has pensado en emprender?</Label><Select value={form.entrepreneurshipPlan} onValueChange={(v) => setField("entrepreneurshipPlan", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Ya tengo un emprendimiento en marcha","Sí, tengo una idea clara de qué quiero hacer","Sí, pero todavía no sé bien qué","No, prefiero enfocarme en otras formas de crecer"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>2.11 ¿Qué tipo de negocio o proyecto tienes en mente?</Label><Textarea value={form.entrepreneurshipIdea} onChange={(e) => setField("entrepreneurshipIdea", e.target.value)} /></div>
              <div><Label>2.12 Talentos/habilidades monetizables</Label><Textarea value={form.monetizableSkills} onChange={(e) => setField("monetizableSkills", e.target.value)} /></div>
            </section>
            )}

            {activeSection === 2 && (
            <section className="space-y-4">
              <h2>Tu radiografía de gastos</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><Label>Vivienda</Label><Input value={form.housingExpense} onChange={(e) => setField("housingExpense", e.target.value)} /></div>
                <div><Label>Alimentación</Label><Input value={form.foodExpense} onChange={(e) => setField("foodExpense", e.target.value)} /></div>
                <div><Label>Transporte</Label><Input value={form.transportExpense} onChange={(e) => setField("transportExpense", e.target.value)} /></div>
                <div><Label>Servicios</Label><Input value={form.servicesExpense} onChange={(e) => setField("servicesExpense", e.target.value)} /></div>
                <div><Label>Educación</Label><Input value={form.educationExpense} onChange={(e) => setField("educationExpense", e.target.value)} /></div>
                <div><Label>Salud</Label><Input value={form.healthExpense} onChange={(e) => setField("healthExpense", e.target.value)} /></div>
                <div><Label>Entretenimiento y ocio</Label><Input value={form.entertainmentExpense} onChange={(e) => setField("entertainmentExpense", e.target.value)} /></div>
                <div><Label>Suscripciones</Label><Input value={form.subscriptionsExpense} onChange={(e) => setField("subscriptionsExpense", e.target.value)} /></div>
                <div><Label>Otros gastos fijos</Label><Input value={form.fixedOtherExpense} onChange={(e) => setField("fixedOtherExpense", e.target.value)} /></div>
                <div><Label>Gastos variables/imprevistos</Label><Input value={form.unexpectedExpense} onChange={(e) => setField("unexpectedExpense", e.target.value)} /></div>
              </div>
              <div><Label>3.2 ¿Qué pasa normalmente con tu dinero al final del mes?</Label><Select value={form.monthEndSituation} onValueChange={(v) => setField("monthEndSituation", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["No me alcanza y termino debiendo o usando la tarjeta","Llego justa: no me sobra nada","Me sobra un poco, pero sin un plan claro","Me sobra y logro apartar o invertir una parte"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            </section>
            )}

            {activeSection === 3 && (
            <section className="space-y-4">
              <h2>Tus deudas</h2>
              <div><Label>4.1 ¿Tienes deudas actualmente?</Label><Select value={form.hasDebts} onValueChange={(v) => setField("hasDebts", v as "Sí" | "No")}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí","No"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              {form.hasDebts === "Sí" && (
                <div className="space-y-4">
                  {debts.map((debt, idx) => (
                    <Card key={`debt-${idx}`} className="p-3 sm:p-4 space-y-3">
                      <h3 className="font-medium">Deuda {idx + 1}</h3>
                      <div><Label>Nombre</Label><Input value={debt.name} onChange={(e) => updateDebt(idx, "name", e.target.value)} /></div>
                      <div><Label>Monto total que debes</Label><Input value={debt.totalAmount} onChange={(e) => updateDebt(idx, "totalAmount", e.target.value)} /></div>
                      <div><Label>Cuota mensual que pagas</Label><Input value={debt.monthlyPayment} onChange={(e) => updateDebt(idx, "monthlyPayment", e.target.value)} /></div>
                      <div><Label>¿La estás pagando al día?</Label><Select value={debt.paymentStatus} onValueChange={(v) => updateDebt(idx, "paymentStatus", v as DebtItem["paymentStatus"])}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí","Voy atrasado","No la estoy pagando"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={addDebt} disabled={debts.length >= 5}>Agregar otra deuda</Button>
                </div>
              )}
              <div><Label>4.3 ¿Sientes que tus deudas crecen mes a mes?</Label><Select value={form.debtTrend} onValueChange={(v) => setField("debtTrend", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí, cada vez debo más","Se mantienen igual","Están bajando poco a poco","No tengo deudas"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            </section>
            )}

            {activeSection === 4 && (
            <section className="space-y-4">
              <h2>Tu ahorro, tu colchón y tus inversiones</h2>
              <div><Label>5.1 ¿Ahorras actualmente?</Label><Select value={form.savesToday} onValueChange={(v) => setField("savesToday", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["No, hoy no logro ahorrar nada","A veces, sin un monto fijo","Sí, aparto un monto cada mes"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>5.2 ¿Cuánto apartas en promedio cada mes?</Label><Input value={form.monthlySavingsAmount} onChange={(e) => setField("monthlySavingsAmount", e.target.value)} /></div>
              <div><Label>5.3 ¿Tienes un fondo de emergencia?</Label><Select value={form.emergencyFund} onValueChange={(v) => setField("emergencyFund", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["No tengo nada guardado","Tengo algo, pero menos de un mes de gastos","Tengo entre uno y tres meses de gastos","Tengo más de tres meses de gastos"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>5.4 ¿Inviertes tu dinero hoy?</Label><Select value={form.investsToday} onValueChange={(v) => setField("investsToday", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["No, no invierto en nada","Tengo algo, pero no sé bien cómo funciona","Sí, invierto y entiendo en qué"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>5.5 Si inviertes, ¿en qué?</Label><Textarea value={form.investmentType} onChange={(e) => setField("investmentType", e.target.value)} /></div>
            </section>
            )}

            {activeSection === 5 && (
            <section className="space-y-4">
              <h2>Tu meta de 12 meses</h2>
              <div><Label>6.1 ¿Cuánto quieres ganar al mes dentro de 12 meses?</Label><Input value={form.targetMonthlyIncome12m} onChange={(e) => setField("targetMonthlyIncome12m", e.target.value)} /></div>
              <div><Label>6.2 ¿Cuánto quieres tener ahorrado o invertido al terminar estos 12 meses?</Label><Input value={form.targetSavedOrInvested12m} onChange={(e) => setField("targetSavedOrInvested12m", e.target.value)} /></div>
              <div><Label>6.3 ¿Por qué ese número?</Label><Textarea value={form.targetReason} onChange={(e) => setField("targetReason", e.target.value)} /></div>
              <div><Label>6.4 Si logras esa meta, ¿qué cambiaría?</Label><Textarea value={form.targetImpact} onChange={(e) => setField("targetImpact", e.target.value)} /></div>
              <div><Label>6.5 ¿Cuánto tiempo a la semana puedes dedicar a construir esto?</Label><Select value={form.weeklyDedication} onValueChange={(v) => setField("weeklyDedication", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Menos de 3 horas","Entre 3 y 7 horas","Entre 7 y 15 horas","Más de 15 horas"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>6.6 ¿Qué tan dispuesta estás a aprender algo nuevo?</Label><Select value={form.learningWillingness} onValueChange={(v) => setField("learningWillingness", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Totalmente: hago lo que sea necesario","Bastante, con la guía correcta","Con miedo, pero quiero intentarlo","Prefiero opciones que no me saquen de mi zona de confort"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>6.7 Perfil de riesgo</Label><Select value={form.riskProfile} onValueChange={(v) => setField("riskProfile", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Conservador: prefiero la seguridad, aunque crezca más lento","Moderado: busco equilibrio entre seguridad y crecimiento","Arriesgado: estoy dispuesto a arriesgar más para crecer más rápido"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
            </section>
            )}

            {activeSection === 6 && (
            <section className="space-y-4">
              <h2>Tu mundo interior</h2>
              <div><Label>7.1 Mayor dificultad con el dinero</Label><Textarea value={form.biggestMoneyFrustration} onChange={(e) => setField("biggestMoneyFrustration", e.target.value)} /></div>
              <div><Label>7.2 ¿Qué has intentado antes y por qué no funcionó?</Label><Textarea value={form.whatDidNotWork} onChange={(e) => setField("whatDidNotWork", e.target.value)} /></div>
              <div><Label>7.3 Mayor miedo en este proceso</Label><Textarea value={form.biggestFear} onChange={(e) => setField("biggestFear", e.target.value)} /></div>
              <div><Label>7.4 ¿Qué te preocupa si nada cambia?</Label><Textarea value={form.concernIfNoChange} onChange={(e) => setField("concernIfNoChange", e.target.value)} /></div>
              <div><Label>7.5 ¿Cómo describirías hoy la relación entre tu fe y tu dinero?</Label><Select value={form.faithMoneyRelationship} onValueChange={(v) => setField("faithMoneyRelationship", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Siento que mi fe y mi dinero van por caminos separados","Quiero unirlos, pero no sé cómo","Siento culpa cuando pienso en tener más dinero","Entiendo que la abundancia también es parte de mi propósito"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>7.6 Mensaje para Jhonny</Label><Textarea value={form.messageToJhonny} onChange={(e) => setField("messageToJhonny", e.target.value)} /></div>
            </section>
            )}

            {activeSection === 7 && (
            <section className="space-y-4">
              <h2>Tu activación en Contabiliza AI</h2>
              <p className="text-sm text-muted-foreground">
                Contabiliza AI es tu asistente financiero por WhatsApp. Sin Contabiliza AI, no hay diagnóstico mensual.
              </p>
              <div><Label>8.1 ¿Confirmas que vas a registrar tus gastos en Contabiliza AI de forma constante?</Label><Select value={form.contabilizaCommitment} onValueChange={(v) => setField("contabilizaCommitment", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí, me comprometo a registrarlos cada día","Sí, voy a hacerlo varias veces por semana","Voy a intentarlo y necesito ayuda para crear el hábito"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>8.2 ¿El número de WhatsApp de la Sección 1 es el mismo que vas a usar en Contabiliza AI?</Label><Select value={form.usesSameWhatsapp} onValueChange={(v) => setField("usesSameWhatsapp", v)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{["Sí, es el mismo","No, voy a usar otro número"].map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>8.3 Confirma la moneda que vas a usar en Contabiliza AI</Label><Select value={form.activationCurrency} onValueChange={(v) => setField("activationCurrency", v)}><SelectTrigger><SelectValue placeholder="Selecciona moneda" /></SelectTrigger><SelectContent>{CURRENCY_OPTIONS.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>{form.activationCurrency === "Otra (especifica cuál)" && <Input placeholder="Especifica moneda" value={form.activationCurrencyOther} onChange={(e) => setField("activationCurrencyOther", e.target.value)} />}</div>
            </section>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <div className="mx-auto flex w-full max-w-3xl gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={activeSection === 0 || saving}
                onClick={() => setActiveSection((prev) => Math.max(0, prev - 1))}
              >
                Anterior
              </Button>
              {isLastSection ? (
                <Button className="w-full" disabled={saving} onClick={() => void submitActivation()}>
                  {saving ? "Guardando..." : "Enviar formulario de activación"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  disabled={saving}
                  onClick={() => setActiveSection((prev) => Math.min(sectionTitles.length - 1, prev + 1))}
                >
                  Siguiente
                </Button>
              )}
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-4 sm:p-6 text-center space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold">Listo</h2>
            <p>Listo. Acabas de dar el primer paso.</p>
            <p>
              Con esta información, mi equipo y yo vamos a construir tu diagnóstico y tu plan personalizado de 12 meses.
            </p>
            <p className="text-muted-foreground">
              Mientras tanto, activa tu Contabiliza AI y empieza a registrar tus gastos desde hoy.
            </p>
            <p className="font-medium">No naciste para sobrevivir. Naciste para vivir en abundancia.</p>
            <p>Nos vemos dentro.</p>
            <Button className="w-full" onClick={finish}>Ir al dashboard</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
