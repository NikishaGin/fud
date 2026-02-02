import React from 'react';
import {alpha} from "@mui/material/styles";

export const ComplexityChipCell = (theme, v) => {
    const color =
        v === 'SIMPLE' ? theme.palette.success.main :
            v === 'MIDDLE' ? theme.palette.warning.main :
                v === 'HARD' ? theme.palette.error.main : null

    if (!color) {
        return {
            bgcolor: theme.palette.action.hover,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
        }
    }
    return {bgcolor: alpha(color, 0.12), color, borderColor: alpha(color, 0.35)}
};


export const EffectivenessCell = (theme, v) => {
    const color =
        v === 'KEEP' ? theme.palette.success.main :
            v === 'OPTIMIZE' ? theme.palette.warning.main :
                v === 'REMOVE' ? theme.palette.error.main : null

    if (!color) {
        return {
            bgcolor: theme.palette.action.hover,
            color: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
        }
    }
    return {bgcolor: alpha(color, 0.12), color, borderColor: alpha(color, 0.35)}
};