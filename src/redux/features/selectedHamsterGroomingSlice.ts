// src/redux/features/selectedHamsterGroomingSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { type PayloadAction } from "@reduxjs/toolkit";

// Simplified interface for the slice state
interface SelectedHamster {
  id: string;
  name: string;
  species: string;
  profilePicture: string; // Optional but useful for display
}

interface SelectedHamsterGroomingState {
  selectedHamster: SelectedHamster | null;
}

const initialState: SelectedHamsterGroomingState = {
  selectedHamster: null,
};

export const selectedHamsterGroomingSlice = createSlice({
  name: "selectedHamsterGrooming",
  initialState,
  reducers: {
    selectHamsterForGrooming: (state, action: PayloadAction<SelectedHamster>) => {
      state.selectedHamster = action.payload;
    },
    clearSelectedHamsterForGrooming: (state) => {
      state.selectedHamster = null;
    },
  },
});

export const { selectHamsterForGrooming, clearSelectedHamsterForGrooming } = selectedHamsterGroomingSlice.actions;

export default selectedHamsterGroomingSlice.reducer;
