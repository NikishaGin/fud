import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  filterPopover: { open: false, column: null, anchorElId: null },
  toasts: [],
  hasPendingEdits: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openFilterPopover(state, { payload }) {
      state.filterPopover = { open: true, column: payload.column, anchorElId: payload.anchorElId }
    },
    closeFilterPopover(state) {
      state.filterPopover = { open: false, column: null, anchorElId: null }
    },
    pushToast(state, { payload }) {
      state.toasts.push({ id: Date.now(), ...payload })
    },
    popToast(state) {
      state.toasts.shift()
    },
    setHasPendingEdits(state, { payload }) {
      state.hasPendingEdits = payload
    }
  }
})

export const {openFilterPopover, closeFilterPopover, pushToast, popToast, setHasPendingEdits} = uiSlice.actions

export default uiSlice.reducer
