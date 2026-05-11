import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { useTranslations } from '@/hooks/useTranslations';
import { updateTransaction } from '@/services/transactionService';

const editTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .min(1, 'Informe o valor')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Valor deve ser positivo',
    }),
  category_id: z.string().uuid('Selecione uma categoria'),
  description: z.string().max(200).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
});

type EditTransactionValues = z.infer<typeof editTransactionSchema>;

interface EditTransactionDialogProps {
  transaction: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category_id: string | null;
    description: string | null;
    date: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const { t } = useTranslations();
  const { toast } = useToast();
  const { dispatch, state } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories } = state;

  const form = useForm<EditTransactionValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      type: transaction.type,
      amount: String(transaction.amount),
      category_id: transaction.category_id ?? '',
      description: transaction.description ?? '',
      date: transaction.date,
    },
  });

  const watchedType = form.watch('type');
  const filteredCategories = categories.filter((c) => c.type === watchedType);

  useEffect(() => {
    if (open) {
      form.reset({
        type: transaction.type,
        amount: String(transaction.amount),
        category_id: transaction.category_id ?? '',
        description: transaction.description ?? '',
        date: transaction.date,
      });
    }
  }, [open, transaction, form]);

  useEffect(() => {
    const currentCategoryId = form.getValues('category_id');
    const stillValid = filteredCategories.some((c) => c.id === currentCategoryId);
    if (!stillValid) {
      form.setValue('category_id', '');
    }
  }, [watchedType, filteredCategories, form]);

  const onSubmit = async (values: EditTransactionValues) => {
    setIsSubmitting(true);
    try {
      const updated = await updateTransaction(transaction.id, {
        type: values.type,
        amount: parseFloat(values.amount),
        category_id: values.category_id,
        description: values.description || null,
        date: values.date,
      });

      dispatch({ type: 'UPDATE_TRANSACTION', payload: updated });

      toast({
        title: t('transactions.edit.success', '¡Transacción actualizada!'),
        description: t('transactions.edit.successDesc', 'Los cambios fueron guardados.'),
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Error updating transaction:', err);
      toast({
        title: t('common.error', 'Error'),
        description: t('transactions.edit.error', 'No se pudo actualizar. Intenta de nuevo.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('transactions.edit.title', 'Editar transacción')}
          </DialogTitle>
          <DialogDescription>
            {t('transactions.edit.description', 'Modifica los datos del registro.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.type', 'Tipo')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">
                        {t('transactions.income', 'Ingreso')}
                      </SelectItem>
                      <SelectItem value="expense">
                        {t('transactions.expense', 'Gasto')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.amount', 'Valor')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.category', 'Categoría')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('transactions.selectCategory', 'Seleccionar categoría')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('transactions.description', 'Descripción')}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({t('common.optional', 'opcional')})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('transactions.descriptionPlaceholder', 'Ej: Almuerzo de trabajo')}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('transactions.date', 'Fecha')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('common.save', 'Guardar')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
