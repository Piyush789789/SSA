import React from 'react';
import { formatCurrency } from '@/utils';
import { ConfirmDialog } from '@/components/fees/ConfirmDialog';

/** Confirms deleting a fee head. `onConfirm(feeHead)` may be async; its error message is shown in the dialog. */
export const DeleteFeeHeadDialog = ({ isOpen, feeHead, onClose, onConfirm }) => (
  <ConfirmDialog
    isOpen={isOpen && Boolean(feeHead)}
    title="Delete Fee Head?"
    message="Unpaid bills created from this fee head are removed too. Fee heads with collected payments cannot be deleted."
    detail={feeHead ? `${feeHead.title} (${formatCurrency(feeHead.amount)})` : null}
    confirmLabel="Delete"
    onClose={onClose}
    onConfirm={() => onConfirm(feeHead)}
  />
);
