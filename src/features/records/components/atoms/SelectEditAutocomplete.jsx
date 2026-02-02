// src/features/records/components/atoms/SelectEditAutocomplete.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Autocomplete, TextField } from '@mui/material';

function SelectEditAutocomplete({ params, options }) {
    const { id, field, value } = params;

    const getOptionFromValue = React.useCallback(
        (val) => options.find((o) => o.value === val) ?? null,
        [options]
    );

    const [open, setOpen] = React.useState(true);
    const [inputValue, setInputValue] = React.useState('');
    const [selected, setSelected] = React.useState(getOptionFromValue(value));

    // коммит выбранной опции в грид
    const commit = React.useCallback(
        (opt, evt) => {
            const nextVal = opt ? opt.value : null;
            if (nextVal === value) {
                params.api?.stopCellEditMode({ id, field });
                return;
            }
            // коммитим только валидную опцию (не null)
            if (nextVal != null) {
                params.api?.setEditCellValue({ id, field, value: nextVal }, evt);
                params.api?.stopCellEditMode({ id, field });
            }
        },
        [id, field, value, params.api]
    );

    // отмена редактирования без изменений
    const cancel = React.useCallback(() => {
        params.api?.stopCellEditMode({ id, field, ignoreModifications: true });
    }, [id, field, params.api]);

    return (
        <Autocomplete
            autoFocus
            open={open}
            onOpen={() => setOpen(true)}
            onClose={(_, reason) => {
                // если закрыли без выбора опции — откатить изменения
                if (reason !== 'selectOption') {
                    cancel();
                }
                setOpen(false);
            }}
            options={options}
            value={selected}
            onChange={(e, newOpt, reason) => {
                if (reason === 'clear') {
                    // КРЕСТИК: очищаем выбранное, чистим строку поиска, остаёмся в режиме редактирования
                    setSelected(null);
                    setInputValue('');
                    return;
                }
                if (reason === 'selectOption') {
                    setSelected(newOpt);
                    commit(newOpt, e);
                    return;
                }
                // остальные причины не коммитим
            }}
            inputValue={inputValue}
            onInputChange={(_, v) => setInputValue(v)}
            isOptionEqualToValue={(o, v) => o.value === v?.value}
            getOptionLabel={(o) => o?.label ?? ''}

            // рендерим через портал, чтобы список не прятался под гридом
            disablePortal={false}
            slotProps={{
                popper: {
                    sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
                },
                paper: { elevation: 8 },
            }}

            fullWidth
            ListboxProps={{ style: { maxHeight: 280 } }}
            renderInput={(paramsInput) => (
                <TextField
                    {...paramsInput}
                    placeholder="Поиск…"
                    size="small"
                    onKeyDown={(e) => {
                        // ESC — выйти без сохранения
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            cancel();
                        }
                        // стрелки/удаления не должны «пробиваться» в грид
                        if (
                            e.key === 'Backspace' || e.key === 'Delete' ||
                            e.key === 'Home' || e.key === 'End' ||
                            e.key === 'PageUp' || e.key === 'PageDown' ||
                            e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                            e.key === 'ArrowUp' || e.key === 'ArrowDown'
                        ) {
                            e.stopPropagation();
                        }
                        // Enter без выбранной опции — ничего не коммитим
                        if (e.key === 'Enter' && !selected) {
                            e.preventDefault();
                        }
                    }}
                />
            )}
            sx={{ '& .MuiOutlinedInput-root': { p: 0.5 } }}
        />
    );
}

SelectEditAutocomplete.propTypes = {
    params: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
};

export default SelectEditAutocomplete;
