
import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Transaction } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import TransactionTypeSelector from './TransactionTypeSelector';
import AmountInput from './AmountInput';
import CategoryDateFields from './CategoryDateFields';
import DescriptionField from './DescriptionField';
import GoalSelector from './GoalSelector';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode: 'create' | 'edit';
  defaultType?: 'income' | 'expense';
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
  defaultType = 'expense',
}) => {
  const { t } = usePreferences();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Initialize form
  const { form, selectedType, handleTypeChange, onSubmit } = useTransactionForm({
    initialData: initialData || undefined,
    mode,
    onComplete: async () => {
      // Show success message
      toast({
        title: mode === 'create' ? t('transactions.added') : t('transactions.updated'),
        description: mode === 'create' ? t('transactions.addSuccess') : t('transactions.updateSuccess'),
      });
      
      // Close dialog
      onOpenChange(false);
      
      // Data is already updated by the AppContext after add/update operations
      // No need for additional refresh calls here
    },
    defaultType,
  });

  // Only render the form content when dialog is open to prevent unnecessary calculations
  if (!open) {
    return null;
  }

  const formTitle = mode === 'create'
    ? selectedType === 'income'
      ? t('transactions.addIncome')
      : t('transactions.addExpense')
    : t('transactions.edit.title');

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <TransactionTypeSelector form={form} onTypeChange={handleTypeChange} />
        <AmountInput form={form} />
        <CategoryDateFields form={form} transactionType={selectedType} />
        <DescriptionField form={form} />

        {selectedType === 'income' && (
          <GoalSelector form={form} />
        )}

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className={selectedType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {mode === 'create' ? t('common.add') : t('common.save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );

  if (isMobile && mode === 'edit') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[90vh] overflow-hidden">
          <SheetHeader className="bg-background p-6 border-b">
            <SheetTitle className="text-xl">{formTitle}</SheetTitle>
          </SheetHeader>
          <div className="p-6 overflow-y-auto">{formContent}</div>
          <SheetFooter className="hidden" />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-background p-6 border-b">
          <DialogTitle className="text-xl">{formTitle}</DialogTitle>
        </DialogHeader>
        <div className="p-6 max-h-[calc(85vh-120px)] overflow-y-auto">{formContent}</div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;
