// src/features/records/components/dialogs/AddFunctionDialog.jsx
import * as React from 'react';
import {
    Autocomplete, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    Divider, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField,
    Tooltip, Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SingleSelectAuto from "../atoms/SingleSelectAuto.jsx";

// ==== Утилиты санитизации/валидации =========================================
const collapseSpaces = (s) => s.replace(/\s+/g, ' ').trim();
const isOnlyDashesOrUnderscores = (s) => /^[-_]+$/.test(s || '');
const sanitizeTextOrNull = (raw) => {
    if (raw == null) return null;
    const v = collapseSpaces(String(raw));
    if (!v) return null;
    if (isOnlyDashesOrUnderscores(v)) return null;
    return v;
};
const isValidText = (raw) => sanitizeTextOrNull(raw) != null;

// ===== UI: лейбл с подсказкой ===============================================
const LabelWithInfo = ({text, hint}) => (
    <Box component="span" sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}>
        {text}
        <Tooltip title={hint} placement="top" arrow>
            <InfoOutlinedIcon
                fontSize="inherit"
                sx={{fontSize: 16, color: 'text.secondary', cursor: 'help'}}
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
            />
        </Tooltip>
    </Box>
);
const L = (text, hint) => <LabelWithInfo text={text} hint={hint}/>;

// =============================================================================
export function AddFunctionDialog({
                                      open, onClose, onSave, form, setForm,
                                      curatorLabelById = [], departmentsLabelById = [], headLabelById = [],
                                      dtiLabelById = [], customersMiudolLabelById = [], executionOptions = []
                                  }) {
    // какие поля обязательные и их тип
    const requiredTextKeys = [
        'functionBlock',
        'function',
        'functionDetails',
        'reason',
        'artifact',
        'howCustomerUses',
        'whyCustomerUses',
    ];
    const requiredSelectKeys = [
        'curatorId',
        'departmentNameId',
        'departmentHeadId',
        'complexity',
        'execution',
        'customerId',
    ];

    const requiredArrayKeys = ['dtiIds'];

    // локальные ошибки по полям (только для текстовых)
    const [errors, setErrors] = React.useState({});

    // валидаторы
    const validateTextField = React.useCallback((name, value) => {
        if (!isValidText(value)) {
            return 'Поле не может быть пустым или состоять только из пробелов/“-”/“_”';
        }
        return null;
    }, []);

    // вычисляем — всё ли ок для кнопки «Сохранить»
    const isRequiredFilled = React.useMemo(() => {
        // текстовые
        for (const k of requiredTextKeys) {
            if (!isValidText(form?.[k])) return false;
        }
        // селекты
        for (const k of requiredSelectKeys) {
            const v = form?.[k];
            if (v === undefined || v === null || String(v).trim() === '') return false;
        }
        // массивы
        for (const k of requiredArrayKeys) {
            const v = form?.[k];
            if (!Array.isArray(v) || v.length === 0) return false;
        }
        return true;
    }, [form, requiredTextKeys, requiredSelectKeys, requiredArrayKeys]);

    // универсальный setter для селектов
    const setSelectField = (field) => (e) => setForm(prev => ({...prev, [field]: e.target.value}));

    // setter для текстовых: без очистки на onChange (чтобы не мешать вводу), но с валидацией
    const setTextField = (field) => (e) => {
        const raw = e.target.value;
        setForm(prev => ({...prev, [field]: raw}));
        // мгновенная валидация (по вводу)
        const msg = validateTextField(field, raw);
        setErrors(prev => ({...prev, [field]: msg}));
    };

    // на blur: схлопываем пробелы и записываем очищенное
    const onTextBlur = (field) => (e) => {
        const cleaned = sanitizeTextOrNull(e.target.value);
        setForm(prev => ({...prev, [field]: cleaned ?? ''}));
        const msg = validateTextField(field, cleaned);
        setErrors(prev => ({...prev, [field]: msg}));
    };

    // при открытии/смене формы — пересчитать ошибки (полезно при повторном открытии)
    React.useEffect(() => {
        const next = {};
        requiredTextKeys.forEach((k) => {
            next[k] = validateTextField(k, form?.[k]);
        });
        setErrors(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // ручка сохранения с финальной санитизацией
    const handleSave = () => {
        // собрать очищенную копию формы
        const cleaned = {...form};
        requiredTextKeys.forEach((k) => {
            cleaned[k] = sanitizeTextOrNull(form?.[k]) ?? ''; // сохраняем пустую строку в стейт, но не пропускаем дальше
        });

        // пересчитать ошибки
        const nextErrors = {};
        let hasErrors = false;
        requiredTextKeys.forEach((k) => {
            const msg = validateTextField(k, cleaned[k]);
            nextErrors[k] = msg;
            if (msg) hasErrors = true;
        });
        setErrors(nextErrors);

        // проверить селекты/массивы
        const selectsOk = requiredSelectKeys.every((k) => cleaned[k] !== undefined && cleaned[k] !== null && String(cleaned[k]).trim() !== '');
        const arraysOk = requiredArrayKeys.every((k) => Array.isArray(cleaned[k]) && cleaned[k].length > 0);

        if (hasErrors || !selectsOk || !arraysOk) {
            // не сохраняем — подсветка уже есть
            return;
        }

        // если нужно — можно перед сохранением схлопнуть пробелы для всех текстовых ключей, не только обязательных
        onSave();
    };

    return (
        <Dialog
            open={open}
            onClose={(_, reason) => {
                if (reason !== 'backdropClick') onClose();
            }}
            fullWidth maxWidth="lg" disableEscapeKeyDown
            PaperProps={{sx: {borderRadius: 2}}}
        >
            <DialogTitle sx={{pr: 6}}>
                Добавить функцию
                <IconButton aria-label="close" onClick={onClose} sx={{position: 'absolute', right: 12, top: 10}}>
                    <CloseIcon/>
                </IconButton>
            </DialogTitle>

            <Divider/>

            <DialogContent
                dividers
                sx={{
                    pt: 2,
                    '& .MuiInputLabel-root': {pointerEvents: 'auto'},
                    '& .MuiFormLabel-asterisk': {display: 'none'},
                }}
            >
                <Grid container spacing={2}>

                    {/* Курирующий ЗНИ */}
                    <Grid item xs={12} md={4}>
                         <SingleSelectAuto
                           required
                           label={L('Курирующий ЗНИ/ЗНУ', 'ФИО начальника инспекции/управления, заместителя начальника инспекции/управления, который курирует отдел\n' +
                               'Пример заполнения: Андрусенко Д.Л.')}
                           value={form.curatorId ?? ''}
                           onChange={(v) => setForm((s) => ({ ...s, curatorId: v }))}
                           options={curatorLabelById}
                         />
                    </Grid>

                    {/* Отдел МИУДОЛ */}
                    <Grid item xs={12} md={4}>
                         <SingleSelectAuto
                           required
                           label={L('Отдел', 'Наименование отдела, на который возложено выполнение функции\n' +
                               'Пример заполнения: Отдел мониторинга имущественного обеспечения')}
                           value={form.departmentNameId ?? ''}
                           onChange={(v) => setForm((s) => ({ ...s, departmentNameId: v }))}
                           options={departmentsLabelById}
                         />
                    </Grid>

                    {/* Начальник отдела */}
                    <Grid item xs={12} md={4}>
                         <SingleSelectAuto
                           required
                           label={L('ФИО начальника (ио) отдела', 'ФИО начальника (и.о. начальника) отдела, выполняющего функцию\n' +
                               'Пример заполнения: Гурьев Р.И.')}
                           value={form.departmentHeadId ?? ''}
                           onChange={(v) => setForm((s) => ({ ...s, departmentHeadId: v }))}
                           options={headLabelById}
                         />
                    </Grid>

                    {/* Блок функции */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Блок функции', 'Короткое наименование направления, к которому относится функция\n' +
                                'Пример заполнения: Площадка реструктуризации долга')}
                            value={form.functionBlock ?? ''}
                            onChange={setTextField('functionBlock')}
                            onBlur={onTextBlur('functionBlock')}
                            error={!!errors.functionBlock}
                            helperText={errors.functionBlock || ' '}
                        />
                    </Grid>

                    {/* Функция */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Функция', 'Наименование функции, которую выполняет отдел\n' +
                                'Пример заполнения: Регистрация уведомлений ТНО о залоге движимого имущества')}
                            value={form.function ?? ''}
                            onChange={setTextField('function')}
                            onBlur={onTextBlur('function')}
                            error={!!errors.function}
                            helperText={errors.function || ' '}
                        />
                    </Grid>

                    {/* Детализация функции */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Детализация функции', 'Пошаговое описание, что необходимо сделать для выполнения функции\n' +
                                'Пример заполнения: 1. Формирование пакета документов в ФНП.2. Получение статуса обработки. 3. Направление информации в ТНО')}
                            value={form.functionDetails ?? ''}
                            onChange={setTextField('functionDetails')}
                            onBlur={onTextBlur('functionDetails')}
                            error={!!errors.functionDetails}
                            helperText={errors.functionDetails || ' '}
                        />
                    </Grid>

                    {/* DTI (мультиселект) */}
                    <Grid item xs={12} md={4}>
                        <Autocomplete
                            multiple
                            options={dtiLabelById}
                            value={dtiLabelById.filter(o => (form.dtiIds || []).includes(o.value))}
                            onChange={(_, newOptions) =>
                                setForm(f => ({...f, dtiIds: newOptions.map(o => o.value)}))
                            }
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip {...getTagProps({index})} key={option.value} label={option.label}
                                          size="small"/>
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label={L('Проект Стратегии Д (DTI)', 'Выбор проекта Стратегии Д, у которого есть связь с выполняемой функцией \n' +
                                        'Пример заполнения: DTI-38, Эффективный залог')}
                                />
                            )}
                            fullWidth
                            disableCloseOnSelect
                            sx={{
                                '& .MuiAutocomplete-inputRoot': {alignItems: 'flex-start', paddingTop: '6px'},
                                '& .MuiChip-root': {maxWidth: '100%'}
                            }}
                        />
                    </Grid>

                    {/* Кто использует функцию */}
                    <Grid item xs={12} md={4}>
                         <SingleSelectAuto
                           required
                           label={L('Кто заказчик функцию', 'Выбор заказчика - инициатора выполнения данного функционал. Пример: для функций МИУДОЛ это отдел ФНС России, для ФНС России это руководитель, зам.руководителя, НУ / ЗНУ, другие ОГВ.')}
                           value={form.customerId ?? ''}
                           onChange={(v) => setForm((s) => ({ ...s, customerId: v }))}
                           options={customersMiudolLabelById}
                         />
                    </Grid>

                    {/* Как использует */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Как использует', 'Описание действий пользователя после выполнения функции и получения ее результатов \n' +
                                'Пример заполнения: Предоставление данных в суд, прекращение залога')}
                            placeholder="Как использует?"
                            value={form.howCustomerUses ?? ''}
                            onChange={setTextField('howCustomerUses')}
                            onBlur={onTextBlur('howCustomerUses')}
                            error={!!errors.howCustomerUses}
                            helperText={errors.howCustomerUses || ' '}
                        />
                    </Grid>

                    {/* Зачем использует? */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Зачем использует?', 'Описание цели использования результатов функции\n' +
                                'Пример заполнения: Обеспечение регистрации предмета залога с целью его реализации')}
                            value={form.whyCustomerUses ?? ''}
                            onChange={setTextField('whyCustomerUses')}
                            onBlur={onTextBlur('whyCustomerUses')}
                            error={!!errors.whyCustomerUses}
                            helperText={errors.whyCustomerUses || ' '}
                        />
                    </Grid>

                    {/* Сложность */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth required>
                            <InputLabel id="complexity-label">
                                {L('Сложность', 'Выбор оценки сложности выполнения функции (низкая, средняя, высокая).\n' +
                                    'Пример заполнения: средняя')}
                            </InputLabel>
                            <Select
                                labelId="complexity-label"
                                label="Сложность"
                                value={form.complexity ?? ''}
                                onChange={setSelectField('complexity')}
                            >
                                <MenuItem value="SIMPLE">Низкая</MenuItem>
                                <MenuItem value="MIDDLE">Средняя</MenuItem>
                                <MenuItem value="HARD">Высокая</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Основание */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Основание', 'Указание документа, на основании которого осуществляется выполнение функции (вид, дата и номер)\n' +
                                'Пример заполнения: Письмо ФНС России от 01.01.2025 № 18-01/156')}
                            value={form.reason ?? ''}
                            onChange={setTextField('reason')}
                            onBlur={onTextBlur('reason')}
                            error={!!errors.reason}
                            helperText={errors.reason || ' '}
                        />
                    </Grid>

                    {/* Периодичность выполнения */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth required>
                            <InputLabel id="exec-label">
                                {L('Периодичность выполнения', 'Выбор частоты выполнения функции\n' +
                                    'Пример заполнения: ежеквартально')}
                            </InputLabel>
                            <Select
                                labelId="exec-label"
                                label="Периодичность выполнения"
                                value={form.execution ?? ''}
                                onChange={setSelectField('execution')}
                            >
                                {executionOptions.map(({value, label}) => (
                                    <MenuItem key={value} value={value}>{label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Артефакт */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            required fullWidth multiline minRows={3}
                            label={L('Артефакт: вид + реквизиты последнего', 'Указание последнего документа, который является результатом выполнения функции\n' +
                                'Пример заполнения: Письмо МИУДОЛ от 15.02.2025 № 13-01/125')}
                            value={form.artifact ?? ''}
                            onChange={setTextField('artifact')}
                            onBlur={onTextBlur('artifact')}
                            error={!!errors.artifact}
                            helperText={errors.artifact || ' '}
                        />
                    </Grid>


                    {/* Эффективность функции */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel id="effectiveness-label">
                                {L('Эффективность функции', 'Выбор оценки полезности результатов выполнения функции от 1 до 5\n' +
                                    'Пример заполнения: 4')}
                            </InputLabel>
                            <Select
                                labelId="effectiveness-label"
                                label="Эффективность функции"
                                value={form.effectiveness ?? ''}               // '' для пустого UI, в стейте храним null
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    const v = raw === '' ? null : Number(raw);
                                    setForm((s) => ({ ...s, effectiveness: Number.isFinite(v) ? v : null }));
                                }}
                                renderValue={(v) => (v === '' || v == null ? '—' : String(v))}
                            >
                                {[1,2,3,4,5].map((n) => (
                                    <MenuItem key={n} value={n}>{n}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>



                    {/* Что сделать? */}
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel id="action-label">
                                {L('Что сделать?', 'Выбор направления развития функции - что необходимо с ней сделать (оставить, убрать, оптимизировать).\n' +
                                    'Пример заполнения: убрать')}
                            </InputLabel>
                            <Select
                                labelId="action-label"
                                label="Что сделать?"
                                value={form.action ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, action: e.target.value || null }))}
                                renderValue={(v) => (v === '' || v == null
                                    ? '—'
                                    : ({ OPTIMIZE: 'Оптимизировать', KEEP: 'Оставить', REMOVE: 'Убрать' }[v] || '—'))}
                            >
                                <MenuItem value="OPTIMIZE">Оптимизировать</MenuItem>
                                <MenuItem value="KEEP">Оставить</MenuItem>
                                <MenuItem value="REMOVE">Убрать</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>



                    {/* Комментарий */}
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label={L('Комментарий', 'Пояснение, почему было принято решение в блоке "Что сделать с функцией?" - "убрать",  "оптимизировать"\n' +
                                'Пример заполнения: Функция подлежит оптимизации, так как процесс выполнения функции можно перенести в автоматический режим.')}
                            value={form.comment ?? ''}
                            onChange={(e) => setForm((s) => ({ ...s, comment: e.target.value }))} // даём вводить как есть
                            onBlur={(e) => {
                                const cleaned = sanitizeTextOrNull(e.target.value); // твоя утилита
                                setForm((s) => ({ ...s, comment: cleaned }));       // храним null, если пусто/мусор
                            }}
                            inputProps={{ maxLength: 1000 }}
                            helperText=" "
                        />
                    </Grid>

                </Grid>
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={onClose} variant="outlined">Отмена</Button>
                <Button onClick={handleSave} variant="contained" disabled={!isRequiredFilled}>Сохранить</Button>
            </DialogActions>
        </Dialog>
    );
}
