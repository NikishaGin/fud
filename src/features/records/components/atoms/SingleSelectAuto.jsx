// src/features/records/components/atoms/SingleSelectAuto.jsx
import * as React from 'react';
import PropTypes from 'prop-types';
import { Autocomplete, TextField } from '@mui/material';

export default function SingleSelectAuto({
                                             label,
                                             value,            // примитив id/ключ
                                             onChange,         // (newValue: примитив | '')
                                             options,          // [{label, value}]
                                             required = false,
                                             disabled = false,
                                             autoFocus = false,
                                         }) {
    // найти объект из options по текущему value
    const getOpt = React.useCallback(
        (v) => options.find((o) => String(o.value) === String(v)) ?? null,
        [options]
    );

    return (
        <Autocomplete
            autoFocus={autoFocus}
            value={getOpt(value)}
            onChange={(_, opt) => onChange(opt ? opt.value : '')}
            options={options}
            isOptionEqualToValue={(o, v) => String(o.value) === String(v?.value)}
            getOptionLabel={(o) => o?.label ?? ''}
            clearOnBlur={false}
            handleHomeEndKeys
            disablePortal={false}
            slotProps={{
                popper: { sx: { zIndex: (t) => t.zIndex.modal + 1 } },
                paper: { elevation: 8 },
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    required={required}
                    label={label}
                    size="small"
                    placeholder="Поиск…"
                />
            )}
            fullWidth
        />
    );
}

SingleSelectAuto.propTypes = {
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.any })).isRequired,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    autoFocus: PropTypes.bool,
};
