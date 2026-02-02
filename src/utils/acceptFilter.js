
import { Stage } from '../features/records/components/accept/AcceptCell.jsx';

export const getLatestStage = (row) => {
    if (Array.isArray(row?.accept) && row.accept.length) {
        const latest = row.accept.reduce((acc, x) =>
            new Date(x?.stamp ?? 0) > new Date(acc?.stamp ?? 0) ? x : acc
        );
        return latest?.stage ?? (row?.acceptStage ?? Stage.DRAFT);
    }
    return row?.acceptStage ?? Stage.DRAFT;
};

// ТОЛЬКО customerId
export const rowAcceptKeys = (row) => {
    const stage = getLatestStage(row);
    const cid = row?.customerId;
    return [cid ? `${stage}|${String(cid)}` : `${stage}|—`];
};

export const parseAcceptKey = (key) => {
    const [stage, idOrDash] = String(key).split('|');
    return { stage, idOrDash };
};

