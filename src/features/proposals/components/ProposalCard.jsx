// src/features/proposals/ProposalCard.jsx
import * as React from 'react'
import {
    Paper,
    Stack,
    Typography,
    Chip,
    LinearProgress,
    Divider,
    Button, Tooltip, IconButton, Popover, Box, TextField /*, Button, Menu, MenuItem*/
} from '@mui/material'
import {useRoleDetection} from "../../../app/user/userSlice.js";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HistoryEduOutlinedIcon from "@mui/icons-material/HistoryEduOutlined";
import {STAGE_LABEL} from "../../records/components/accept/AcceptCell.jsx";
import {useState} from "react";



// Статусы предложений
export const ProposalStatus = {
    INTAKE: 'INTAKE',         // В обработке
    REVIEW: 'REVIEW',         // На рассмотрении
    ACCEPTED: 'ACCEPTED',     // Принято
    REJECTED: 'REJECTED',     // Отклонено
}

export const STATUS_LABEL = {
    [ProposalStatus.INTAKE]: 'В обработке',
    [ProposalStatus.REVIEW]: 'На рассмотрении',
    [ProposalStatus.ACCEPTED]: 'Принято',
    [ProposalStatus.REJECTED]: 'Отклонено',
}

export const STATUS_COLOR = {
    [ProposalStatus.INTAKE]: 'default',
    [ProposalStatus.REVIEW]: 'info',
    [ProposalStatus.ACCEPTED]: 'success',
    [ProposalStatus.REJECTED]: 'error',
}

export const STATUS_PROGRESS = {
    [ProposalStatus.INTAKE]: 15,
    [ProposalStatus.REVIEW]: 50,
    [ProposalStatus.ACCEPTED]: 100,
    [ProposalStatus.REJECTED]: 100,
}



function Line({ label, value }) {
    return (
        <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="caption" sx={{ color: 'text.secondary', width: 180, fontWeight: 700 }}>
                {label}
            </Typography>
            <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-word' }}>
                {value ?? '—'}
            </Typography>
        </Stack>
    )
}


function ButtonOpenComment({ onClick }) {
    return (
        <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Комментарий">
              <span>
                <IconButton
                    size="small"
                    aria-label="open-comment"
                    onClick={onClick}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
        </Stack>
    )
}


function ReasonRejected({ comment, open, anchorEl, handleClose }) {
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { p: 1.5, width: 420 } }}
        >
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <HistoryEduOutlinedIcon />
                <Typography variant="subtitle1" fontWeight={700}>
                    Причина отклонения
                </Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />

            <Stack spacing={1.25}>
                {comment}
            </Stack>
        </Popover>
    );
}


function FormCommentRejected({ open, handleClose, anchorEl, onSubmit }) {
    const [comment, setComment] = useState('')

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
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
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="reject-comment"
            />

            <Stack direction="row" justifyContent="flex-end" spacing={1} mt={1.5}>
                <Button onClick={handleClose}>Отмена</Button>
                <Button
                    variant="contained"
                    color="error"
                    disabled={!comment.trim()}
                    onClick={() => onSubmit(comment)}
                >
                    Отклонить
                </Button>
            </Stack>
        </Popover>
    )
}



export default function ProposalCard({ proposal, onChangeStatus }) {
    const { isAdmin } = useRoleDetection();
    const status = proposal.status || ProposalStatus.INTAKE;

    const [openComment, setOpenComment] = useState(false);
    const [openFormComment, setOpenFormComment] = useState(false);

    const [commentAnchorEl, setCommentAnchorEl] = useState(null);
    const [formCommentAnchorEl, setFormCommentAnchorEl] = useState(null);



    const handleOpenComment = (e) => {
        setCommentAnchorEl(e.currentTarget);
        setOpenComment(s => !s)
    }

    const handleCloseComment = () => {
        setOpenComment(false)
        setCommentAnchorEl(null)
    }

    const handleReject = (e) => {
        setFormCommentAnchorEl(e.currentTarget);
        setOpenFormComment(true)
    }

    const handleCloseFormComment = () => {
        setOpenFormComment(false)
        setFormCommentAnchorEl(null)
    }

    const handleRejectSubmit = (comment) => {
        onChangeStatus(ProposalStatus.REJECTED, comment)
        handleCloseFormComment()
    }


    return (
        <Paper
            variant="outlined"
            sx={(t) => ({
                height: '100%',
                p: 1.25,
                borderColor: t.palette.divider,
                borderRadius: 2,
                background: t.palette.mode === 'light'
                    ? 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0))'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.00))',
            })}
        >
            {/* Верхняя строка: ID + статус */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    ID {proposal.id}
                </Typography>
                <Chip
                    size="small"
                    icon={
                        (status === ProposalStatus.REJECTED)
                            && <ButtonOpenComment onClick={handleOpenComment} />
                    }
                    label={STATUS_LABEL[status]}
                    color={STATUS_COLOR[status]}
                />

                <ReasonRejected
                    comment={proposal.comment}
                    open={openComment}
                    anchorEl={commentAnchorEl}
                    handleClose={handleCloseComment}
                />

                <FormCommentRejected
                    open={openFormComment}
                    handleClose={handleCloseFormComment}
                    anchorEl={formCommentAnchorEl}
                    onSubmit={handleRejectSubmit}
                />
            </Stack>

            <LinearProgress variant="determinate" value={STATUS_PROGRESS[status]} sx={{ height: 6, borderRadius: 1, mb: 1 }} />

            <Divider sx={{ mb: 1 }} />

            {/* Короткая сводка */}
            <Stack spacing={0.5} sx={{ mb: 0.5 }}>
                <Line label="Кто предлагает" value={proposal?.whoOffers} />
                <Line label="Исполнитель функции" value={proposal?.executor} />
                <Line label="Блок функции" value={proposal?.functionBlock} />
                <Line label="Функция" value={proposal?.function} />
                <Line label="Кто использует" value={proposal?.whoUses} />
            </Stack>

            <Stack spacing={0.5} sx={{ mb: 0.5 }}>
                <Line label="Как использует?" value={proposal?.howUses} />
                <Line label="Зачем использует?" value={proposal?.whyUses} />
                <Line label="Основание" value={proposal?.reason} />
            </Stack>


            {(isAdmin && [ProposalStatus.INTAKE, ProposalStatus.REVIEW].includes(status)) && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {(status === ProposalStatus.INTAKE)
                            ? (
                                <Button size="small" onClick={() => onChangeStatus?.(ProposalStatus.REVIEW)}>На рассмотрение</Button>
                            )
                            : ((status === ProposalStatus.REVIEW) && (
                                <>
                                    <Button size="small" color="success" onClick={() => onChangeStatus?.(ProposalStatus.ACCEPTED)}>Принято</Button>
                                    <Button size="small" color="error" onClick={handleReject}>Отклонено</Button>
                                </>
                            ))}
                    </Stack>
                </>
            )}
        </Paper>
    )
}
