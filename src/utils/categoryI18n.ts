export type CatKind = 'expense' | 'income';

const MAP_ES419: Record<CatKind, Record<string, string>> = {
  expense: {
    'Alimentação': 'Alimentación',
    'Educação': 'Educación',
    'Lazer': 'Entretenimiento',
    'Moradia': 'Vivienda',
    'Saúde': 'Salud',
    'Transporte': 'Transporte',
    'Outros': 'Otros',
  },
  income: {
    'Freelance': 'Freelance',
    'Investimentos': 'Inversiones',
    'Salário': 'Salario',
    'Outros': 'Otros',
  },
};

export function translateCategoryName(
  original: string,
  kind: CatKind,
  locale = 'es-419'
): string {
  console.log('Translating:', { original, kind, locale });
  if (locale.startsWith('es')) {
    const translated = MAP_ES419[kind]?.[original];
    console.log('Result:', translated || original);
    return translated || original;
  }
  return original;
}
