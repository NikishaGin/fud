import React from 'react';
import {Autocomplete, TextField} from "@mui/material";
import {useGridApiContext} from "@mui/x-data-grid-pro";

export const DtiMultiEditCell = (props) => {
    const {id, field, value, colDef} = props; // value — массив id или null
    const apiRef = useGridApiContext();
    const options = colDef.valueOptions || []; // [{label, value: id}]
    const [open, setOpen] = React.useState(true);

    const selectedOptions = Array.isArray(value)
        ? options.filter(o => value.includes(o.value))
        : [];

    return (
        <Autocomplete
            multiple
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={options}
            value={selectedOptions}
            onChange={(_, newOptions) => {
                const ids = newOptions.map(o => o.value);
                apiRef.current.setEditCellValue({id, field, value: ids}, event);
            }}
            getOptionLabel={(o) => o.label ?? ''}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            renderInput={(params) => <TextField {...params} size="small"/>}
            fullWidth
            disableCloseOnSelect
        />
    );
};

