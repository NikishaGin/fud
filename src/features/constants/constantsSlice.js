// import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
// import { getCurators, getDepartmentsByCurator } from '../records/api'
//
// export const fetchCurators = createAsyncThunk('const/fetchCurators', async () => {
//     return await getCurators()
// })
//
// export const fetchDepartmentsByCurator = createAsyncThunk(
//     'const/fetchDeps',
//     async (curatorId) => ({ curatorId, items: await getDepartmentsByCurator(curatorId) })
// )
//
// const initialState = {
//     curators: [],                 // [{id,name}]
//     departmentsByCurator: {},     // { [curatorId]: [{id,name,head}] }
//     status: 'idle',
// }
//
// const slice = createSlice({
//     name: 'const',
//     initialState,
//     reducers: {},
//     extraReducers: b => {
//         b.addCase(fetchCurators.fulfilled, (s, { payload }) => { s.curators = payload })
//             .addCase(fetchDepartmentsByCurator.fulfilled, (s, { payload }) => {
//                 s.departmentsByCurator[payload.curatorId] = payload.items
//             })
//     }
// })
//
// export default slice.reducer
//
// const selectSelf = s => s.const
// export const selectCurators = createSelector(selectSelf, s => s.curators)
// export const makeSelectDepartmentsByCurator = (curatorId) =>
//     createSelector(selectSelf, s => s.departmentsByCurator[curatorId] ?? [])
