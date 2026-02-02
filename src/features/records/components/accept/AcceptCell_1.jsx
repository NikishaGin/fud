// src/features/records/components/accept/AcceptCell.jsx
import * as React from 'react';
import {
    Box, Chip, Stack, Typography, IconButton, Popover, Divider,
    TextField, Button, Tooltip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import LinearProgress from '@mui/material/LinearProgress';

/** Доменные константы стадий */
export const Stage = {
    DRAFT: 'DRAFT',
    PENDING_BY_HEAD_INSPECTION: 'PENDING_BY_HEAD_INSPECTION',
    PANDING_FINAL_MIUDOL: 'PANDING_FINAL_MIUDOL',
    PANDING_FINAL_CA: 'PANDING_FINAL_CA',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

/** Человеко-читаемые подписи стадий */
export const STAGE_LABEL = {
    [Stage.DRAFT]: 'Черновик',
    [Stage.PENDING_BY_HEAD_INSPECTION]: 'На акцепте (НИ)',
    [Stage.PANDING_FINAL_MIUDOL]: 'На акцепте (ЦА)',
    [Stage.PANDING_FINAL_CA]: 'На акцепте (НУ)',
    [Stage.APPROVED]: 'Акцептовано',
    [Stage.REJECTED]: 'Отклонено',
};

/** Прогресс 0–100 по стадии */
const STAGE_TO_PROGRESS = {
    [Stage.DRAFT]: 5,
    [Stage.PENDING_BY_HEAD_INSPECTION]: 35,
    [Stage.PANDING_FINAL_MIUDOL]: 70,
    [Stage.PANDING_FINAL_CA]: 50,
    [Stage.APPROVED]: 100,
    [Stage.REJECTED]: 100,
};

/** Цвета Chip */
const STAGE_TO_COLOR = {
    [Stage.DRAFT]: 'default',
    [Stage.PENDING_BY_HEAD_INSPECTION]: 'info',
    [Stage.PANDING_FINAL_MIUDOL]: 'warning',
    [Stage.PANDING_FINAL_CA]: 'warning',
    [Stage.APPROVED]: 'success',
    [Stage.REJECTED]: 'error',
};

const canAdvance = (stage) => stage !== Stage.APPROVED;
const canRejectFrom = (stage) => stage !== Stage.APPROVED && stage !== Stage.REJECTED;

const formatDate = (value) => {
    const date = new Date(value);
    return date.toLocaleString('ru-RU', { locale: 'Europe/Moscow' });
};

function getRole(roles = []) {
    let role = roles.includes('ADMIN')
        ? 'Администратор'
        : roles.includes('MIUDOL')
            ? 'МИУДОЛ'
            : roles.includes('UOPB') ? 'ЦА - УОПБ' : 'ЦА - УРЗ';

    role += roles.includes('HEAD_INSPECTION')
        ? ' (начальник инспекции)'
        : roles.includes('CURATOR')
            ? ' (куратор)'
            : roles.includes('HEAD_DEPARTMENT')
                ? ' (начальник отдела)'
                : '';
    return role;
}

/**
 * @param {{
 *   row?: any,
 *   onSave?: (next:any, prev:any) => void,
 *   history-log?: Array<any>,
 * }} props
 */
export default function AcceptCell({ row = {}, onSave, history = [] }) {
    // раздельные якоря
    const [historyAnchorEl, setHistoryAnchorEl] = React.useState(null);
    const [rejectAnchorEl, setRejectAnchorEl] = React.useState(null);

    const [rejectOpen, setRejectOpen] = React.useState(false);
    const [rejectComment, setRejectComment] = React.useState('');

    // текущая стадия
    const stage = history?.[0]?.stage ?? row?.acceptStage ?? Stage.DRAFT;

    const allDisabled = row?.emptyRow === true;
    const canUseActions = !!row?.isActionAccept;
    const hasRowId = row?.id != null;

    const isHistoryOpen = Boolean(historyAnchorEl);

    // История
    const handleOpenHistory = (e) => {
        setHistoryAnchorEl(e.currentTarget);
        // если вдруг открыт поповер отклонения — закрываем
        setRejectOpen(false);
        setRejectAnchorEl(null);
    };
    const handleCloseHistory = () => setHistoryAnchorEl(null);

    // Отклонение
    const handleOpenReject = (e) => {
        setRejectAnchorEl(e.currentTarget);
        setRejectOpen(true);
        // закрываем историю, чтобы поповеры не накладывались
        setHistoryAnchorEl(null);
    };
    const handleCloseReject = () => {
        setRejectOpen(false);
        setRejectAnchorEl(null);
    };

    const handleAdvanceStage = () => {
        if (!hasRowId || !onSave) return;
        const prev = {};
        const next = { id: row.id, oldAcceptStage: stage };
        onSave(next, prev);
    };

    const handleRejectStage = () => {
        if (!hasRowId || !onSave) return;
        const prev = { oldAcceptStage: stage, acceptComment: '' };
        const next = { id: row.id, oldAcceptStage: Stage.REJECTED, acceptComment: rejectComment.trim() };
        onSave(next, prev);
        setRejectComment('');
        handleCloseReject();
    };

    const stageProgress = STAGE_TO_PROGRESS[stage] ?? 0;
    const stageLabel = STAGE_LABEL[stage] ?? String(stage);
    const stageColor = STAGE_TO_COLOR[stage] ?? 'default';

    const allowAdvance = canAdvance(stage) && hasRowId;
    const allowReject = canRejectFrom(stage) && stage !== Stage.DRAFT && hasRowId;

    const advanceAria = stage === Stage.REJECTED ? 'return-to-draft' : 'advance-stage';
    const advanceTooltip = stage === Stage.REJECTED ? 'Вернуть в Черновик' : 'Далее по цепочке';

    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
            <Box sx={{ flex: 1 }}>
                <LinearProgress
                    variant="determinate"
                    value={stageProgress}
                    sx={{ height: 8, borderRadius: 1 }}
                    aria-label="accept-progress"
                />

                <Stack direction="row" alignItems="center" justifyContent="space-between" mt={0.5}>
                    <Chip
                        size="small"
                        label={stageLabel}
                        color={stageColor}
                        sx={allDisabled ? { opacity: 0.6 } : undefined}
                    />

                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {/* История */}
                        <Tooltip title="История акцептов">
                          <span>
                            <IconButton
                                size="small"
                                aria-label="open-history"
                                onClick={handleOpenHistory}
                                disabled={!hasRowId}
                            >
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        {/* Вперёд / вернуть */}
                        {allowAdvance && (
                            <Tooltip title={advanceTooltip}>
                <span>
                  {canUseActions && (
                      <IconButton
                          size="small"
                          aria-label={advanceAria}
                          onClick={handleAdvanceStage}
                          disabled={allDisabled}
                      >
                          {stage === Stage.REJECTED ? (
                              <RestartAltIcon fontSize="small" />
                          ) : (
                              <DoneAllOutlinedIcon fontSize="small" />
                          )}
                      </IconButton>
                  )}
                </span>
                            </Tooltip>
                        )}

                        {/* Отклонить */}
                        {allowReject && (
                            <Tooltip title="Отклонить">
                <span>
                  <IconButton
                      size="small"
                      aria-label="reject"
                      onClick={handleOpenReject}
                      disabled={allDisabled}
                  >
                    <CancelOutlinedIcon fontSize="small" />
                  </IconButton>
                </span>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>
            </Box>

            {/* Поповер истории */}
            <Popover
                open={isHistoryOpen}
                anchorEl={historyAnchorEl}
                onClose={handleCloseHistory}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { p: 1.5, width: 420 } }}
            >
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <HistoryEduOutlinedIcon />
                    <Typography variant="subtitle1" fontWeight={700}>
                        История акцептов
                    </Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />

                <Stack spacing={1.25}>
                    {Array.isArray(history) && history.length ? (
                        history.map((h, idx) => {
                            const roles = Array.isArray(h?.user?.roles)
                                ? h.user.roles.map(({ value: role }) => role)
                                : [];
                            const author = getRole(roles, h?.stage);

                            return (
                                <Box key={idx}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {STAGE_LABEL[h?.stage] ?? String(h?.stage ?? '')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                        {h?.stamp ? formatDate(h.stamp) : ''} {author ? `• ${author}` : ''}
                                    </Typography>
                                    {h?.comment ? (
                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                            Комментарий: {h.comment}
                                        </Typography>
                                    ) : null}
                                </Box>
                            );
                        })
                    ) : (
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            История пока пуста
                        </Typography>
                    )}
                </Stack>
            </Popover>

            {/* Поповер отклонения */}
            <Popover
                open={rejectOpen}
                anchorEl={rejectAnchorEl}
                onClose={handleCloseReject}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { p: 2, width: 360 } }}
            >
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Указать причину отклонения
                </Typography>

                <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Коротко опишите причину"
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    aria-label="reject-comment"
                />

                <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1.5}>
                    <Button onClick={handleCloseReject}>Отмена</Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={!rejectComment.trim() || !hasRowId}
                        onClick={handleRejectStage}
                    >
                        Отклонить
                    </Button>
                </Stack>
            </Popover>
        </Stack>
    );
}
