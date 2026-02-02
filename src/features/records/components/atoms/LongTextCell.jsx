import React from 'react';
import {Box, IconButton, LinearProgress, Popover, Tooltip} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export const LongTextCell = ({ value, isPending }) => {
    const [open, setOpen] = React.useState(false);
    const [overflowed, setOverflowed] = React.useState(false);
    const anchorRef = React.useRef(null);
    const contentRef = React.useRef(null);

    const MAX_PREVIEW_LINES = 4;
    const LINE_HEIGHT = 1.4;

    const display = value == null ? '—' : (typeof value === 'string' ? value : String(value));
    const rightPad = isPending ? 7 : (overflowed ? 5 : 0);

    // определяем есть ли переполнение
    React.useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        const check = () => setOverflowed(el.scrollHeight > el.clientHeight + 1); // +1 на всякий случай
        check();

        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [display]);


    return (
        <Box ref={anchorRef} sx={{ position: 'relative', width: '100%', py: 0.75 }}>
            <Box
                ref={contentRef}
                sx={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    lineHeight: LINE_HEIGHT,
                    pr: rightPad,
                    display: '-webkit-box',
                    WebkitLineClamp: MAX_PREVIEW_LINES,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    maxHeight: `calc(${MAX_PREVIEW_LINES} * ${LINE_HEIGHT}em)`,
                }}
            >
                {display}
            </Box>

            {overflowed && (
                <Tooltip title="Показать полностью" arrow>
                    <IconButton
                        className="cell-eye-btn"
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                        sx={{
                            position: 'absolute',
                            top: 6,
                            right: isPending ? 28 : 6,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 0,
                            zIndex: 2,
                            '&:hover': { bgcolor: 'background.paper', borderColor: 'primary.main' },
                        }}
                    >
                        <VisibilityOutlinedIcon fontSize="inherit" />
                    </IconButton>
                </Tooltip>
            )}

            {isPending && (
                <Box sx={{ position: 'absolute', right: 6, top: 8, width: 16 }}>
                    <LinearProgress variant="indeterminate" />
                </Box>
            )}

            <Popover
                open={open}
                onClose={() => setOpen(false)}
                anchorEl={anchorRef.current}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { maxWidth: 720 } } }}
            >
                <Box component="pre" sx={{ m: 0, p: 2, maxWidth: 720, maxHeight: '60vh', overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5 }}>
                    {display}
                </Box>
            </Popover>
        </Box>
    );
};

