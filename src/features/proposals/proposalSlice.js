import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {
    getWhoOffers,
    getExecutors,
    getWhoUses,
    getRecommendations,
    createRecommendation,
    statusChange,
    deleteRecommendation,
} from "../records/api.js";
import {useSelector} from "react-redux";



export const fetchGetWhoOffers = createAsyncThunk(
    'proposal/fetchGetWhoOffers',
    async () => {
        const response = await getWhoOffers();
        return response.data;
    },
);

export const fetchGetExecutors = createAsyncThunk(
    'proposal/fetchGetExecutors',
    async () => {
        const response = await getExecutors();
        return response.data;
    },
);

export const fetchGetWhoUses = createAsyncThunk(
    'proposal/fetchGetWhoUses',
    async () => {
        const response = await getWhoUses();
        return response.data;
    },
);

export const fetchGetRecommendations = createAsyncThunk(
    'proposal/fetchGetRecommendations',
    async () => {
        const response = await getRecommendations();
        return response.data;
    },
);

export const fetchCreate = createAsyncThunk(
    'proposal/fetchCreate',
    async (data) => {
        const response = await createRecommendation(data);
        return response.data;
    },
)

export const fetchStatusChange = createAsyncThunk(
    'proposal/fetchStatusChange',
    async ({ index, id, status, comment }) => {
        const response = await statusChange(id, status, comment);
        return { index, data: response.data };
    }
)



const initialState = {
    loading: false,
    recommendations: [],
    who_offers: [],
    executors: [],
    who_uses: [],
};

const proposalSlice = createSlice({
    name: "proposal",
    initialState,
    extraReducers: builder => {
        builder
            .addCase(fetchGetWhoOffers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGetExecutors.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGetWhoUses.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGetRecommendations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGetWhoOffers.fulfilled, (state, {payload}) => {
                state.loading = false;
                state.who_offers = payload;
            })
            .addCase(fetchGetExecutors.fulfilled, (state, {payload}) => {
                state.loading = false;
                state.executors = payload;
            })
            .addCase(fetchGetWhoUses.fulfilled, (state, {payload}) => {
                state.loading = false;
                state.who_uses = payload;
            })
            .addCase(fetchGetRecommendations.fulfilled, (state, {payload}) => {
                state.loading = false;
                state.recommendations = payload;
            })
            .addCase(fetchGetWhoOffers.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error.message)
            })
            .addCase(fetchGetExecutors.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error.message)
            })
            .addCase(fetchGetWhoUses.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error.message)
            })
            .addCase(fetchGetRecommendations.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error.message)
            })
            .addCase(fetchCreate.fulfilled, (state, {payload}) => {
                state.recommendations = [ ...state.recommendations, payload ];
            })
            .addCase(fetchStatusChange.fulfilled, (state, {payload}) => {
                const { index, data } = payload;
                state.recommendations[index] = data;
            })
    }
});

export const useRecommendations = () => useSelector(state => state.proposal.recommendations);

export const useLoading = () => useSelector(state => state.proposal.loading);

export const useOptionsForSelect = () => ({
    whoOffers: useSelector(state => state.proposal.who_offers),
    executors: useSelector(state => state.proposal.executors),
    whoUses: useSelector(state => state.proposal.who_uses),
})

export default proposalSlice.reducer;