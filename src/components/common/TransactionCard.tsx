import React, { useState } from 'react';
import { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/utils/transactionUtils';
import { MoreHorizontal, Target, ArrowUp, ArrowDown, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import CategoryIcon from '../categories/CategoryIcon';
import { translateCategoryName } from '@/utils/categoryI18n';
import { EditTransactionDialog } from '@/components/transactions/EditTransactionDialog';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  hideValues?: boolean;
  index?: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  hideValues = false,
  index = 0
}) => {
  const { goals } = useAppContext();
  const { t, currency } = usePreferences();

  // Helper to get goal name
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.name : null;
  };

  // Helper to render masked values
  const renderHiddenValue = () => {
    return '******';
  };

  const iconColor =
    transaction.type === 'income' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
  const isIncome = transaction.type === 'income';
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className="group bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Header: Type Icon + Amount */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isIncome ? "bg-primary/15" : "bg-destructive/15"
            )}>
              {isIncome ? (
                <ArrowUp className="w-5 h-5 text-primary" />
              ) : (
                <ArrowDown className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div>
              <span className={cn(
                "text-lg font-semibold",
                isIncome ? "text-primary" : "text-destructive"
              )}>
                {isIncome ? '+' : '-'}
                {hideValues ? renderHiddenValue() : formatCurrency(transaction.amount, currency)}
              </span>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              aria-label={t('transactions.edit.title', 'Editar transacción')}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">{t('common.edit')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="text-destructive"
                  >
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Category and Description */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <CategoryIcon
              icon={transaction.type === 'income' ? 'trending-up' : transaction.type === 'expense' ? transaction.category.toLowerCase().includes('food') ? 'utensils' : 'shopping-bag' : 'circle'}
              color={iconColor}
              size={16}
            />
            <Badge variant="outline" className={cn(
              "text-xs",
              isIncome
                ? "bg-primary/8 text-primary border-primary/25"
                : "bg-destructive/8 text-destructive border-destructive/25"
            )}>
              {translateCategoryName(transaction.category, transaction.type, 'es-419')}
            </Badge>
          </div>

          {transaction.description && (
            <p className="text-sm text-foreground font-medium">
              {transaction.description}
            </p>
          )}
        </div>

        {/* Goal (if exists) */}
        {transaction.goalId && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {getGoalName(transaction.goalId)}
            </span>
          </div>
        )}
      </motion.div>

      {onDelete && (
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('transactions.confirmDelete')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onDelete(transaction.id);
                  setDeleteConfirmOpen(false);
                }}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <EditTransactionDialog
        transaction={{
          id: transaction.id,
          type: transaction.type,
          amount: transaction.amount,
          category_id: transaction.category_id ?? null,
          description: transaction.description ?? null,
          date: transaction.date.includes('T') ? transaction.date.split('T')[0] : transaction.date,
        }}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
};

export default TransactionCard;