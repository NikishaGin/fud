// import React from 'react';
// import {Box, IconButton, Tooltip} from "@mui/material";
// import FilterListIcon from "@mui/icons-material/FilterList";
//
// export const HeaderWithFilter = ({params, onOpen}) => {
//     return (
//         <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
//             <span>{params.colDef.headerName}</span>
//             <Tooltip title="Фильтр">
//                 <IconButton
//                     size="small"
//                     onClick={() => onOpen(params.field)}
//                     id={`hdr-${params.field}`}
//                     sx={{ml: 0.5}}
//                 >
//                     <FilterListIcon fontSize="inherit"/>
//                 </IconButton>
//             </Tooltip>
//         </Box>
//     );
// };

// src/features/records/components/atoms/HeaderWithFilter.jsx
import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

export const HeaderWithFilter = ({
                                     params,
                                     onOpen,
                                     isFiltered = false,   // НОВОЕ: признак активного фильтра
                                     onClear,              // НОВОЕ: сбросить фильтр колонки
                                     anchorElId,           // НОВОЕ: id для Popover-якоря (чтобы совпадал с DataTable)
                                 }) => {
    const field = params?.colDef?.field;
    const title = params?.colDef?.headerName ?? field;
    const id = anchorElId ?? `hdr-${field}`;

    return (
        <Box
            id={id}
            data-filtered={isFiltered ? 'true' : 'false'}       // НОВОЕ: для CSS-подсветки
            sx={{ display: 'flex', alignItems: 'center'}}
        >
            <Box
                component="span"
                sx={{ fontWeight: 600, mr: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
                {isFiltered && (
                    <Box
                        component="span"
                        aria-label="Фильтр активен"
                        sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: (t) => t.palette.warning.main }}
                    />
                )}
                {title}
            </Box>

            {isFiltered && (
                <Tooltip title="Сбросить фильтр">
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onClear?.(); }} // не открывать сортировку/меню грида
                        sx={{ ml: -0.5 }}
                    >
                        <ClearIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip title="Открыть фильтр">
                <IconButton
                    size="small"
                    onClick={() => onOpen(field)}
                    sx={{ ml: 0.25 }}
                >
                    <FilterListIcon fontSize="inherit" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};


