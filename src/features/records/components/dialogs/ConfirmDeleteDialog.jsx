// src/features/records/components/dialogs/ConfirmDeleteDialog.jsx
import * as React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';

export function ConfirmDeleteDialog({
                                        open,
                                        title = 'Удалить запись?',
                                        message = 'Это действие необратимо. Подтвердить удаление?',
                                        onCancel,
                                        onConfirm,
                                        confirmText = 'Удалить',
                                        cancelText = 'Отмена',
                                        isProcessing = false,
                                    }) {
    return (
        <Dialog
            open={open}
            onClose={(_, reason) => { if (reason !== 'backdropClick') onCancel?.(); }}
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>{message}</DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={isProcessing}>
                    {cancelText}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onConfirm}
                    disabled={isProcessing}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
