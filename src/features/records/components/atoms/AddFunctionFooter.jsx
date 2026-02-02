// import React from 'react';
// import {GridFooterContainer} from "@mui/x-data-grid-pro";
// import {Box, Button} from "@mui/material";
//
// export const AddFunctionFooter = ({onAdd, count}) => {
//     return (
//         <GridFooterContainer
//             sx={{borderTop: '1px solid', borderColor: 'divider', px: 1}}>
//             <Box
//                 sx={{
//                     flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.25,
//                     bgcolor: 'transparent',
//                 }}>
//                 <Box sx={{fontSize: 13, color: 'text.secondary'}}>Записей: {count}</Box>
//
//                 <Button variant="contained" onClick={onAdd} sx={{borderRadius: 2}}>
//                     Добавить функцию
//                 </Button>
//             </Box>
//         </GridFooterContainer>
//     );
// };
//


// src/features/records/components/atoms/AddFunctionFooter.jsx
import React from 'react';
import { GridFooterContainer } from '@mui/x-data-grid-pro';
import { Box, Button } from '@mui/material';
import {AiAgentButton, BrightPrimaryButtonStable} from '../../../ai-agent/ai-agent-mvp7.jsx';

export const AddFunctionFooter = ({
                                      onAdd,
                                      count,
                                      hasAnyFilters = false,
                                      onClearAll,
									  onOpenAgent,
                                  }) => {
    return (
        <GridFooterContainer sx={{ borderTop: '1px solid', borderColor: 'divider', px: 1 }}>
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    py: 1.25,
                    bgcolor: 'transparent',
                }}
            >
                {/* Левая часть: счётчик + (условно) кнопка сброса */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ fontSize: 13, color: 'text.secondary' }}>Записей: {count}</Box>

                    {hasAnyFilters && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={onClearAll}
                        >
                            Сбросить фильтры
                        </Button>
                    )}
                </Box>

				
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AiAgentButton onOpen={onOpenAgent}/>
                    <BrightPrimaryButtonStable onClick={onAdd}>
                        Добавить функцию
                    </BrightPrimaryButtonStable>
                </Box>
				
            </Box>
        </GridFooterContainer>
    );
};
