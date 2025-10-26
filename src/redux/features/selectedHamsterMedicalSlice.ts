// src/redux/features/selectedHamsterMedicalSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { type PayloadAction } from "@reduxjs/toolkit";

// Simplified interface for the slice state
interface SelectedHamster {
  id: string;
  name: string;
  species: string;
  profilePicture: string; // Optional but useful for display
}

interface SelectedHamsterMedicalState {
  selectedHamster: SelectedHamster | null;
}

const initialState: SelectedHamsterMedicalState = {
  selectedHamster: null,
};

export const selectedHamsterMedicalSlice = createSlice({
  name: "selectedHamsterMedical",
  initialState,
  reducers: {
    selectHamsterForMedical: (state, action: PayloadAction<SelectedHamster>) => {
      state.selectedHamster = action.payload;
    },
    clearSelectedHamsterForMedical: (state) => {
      state.selectedHamster = null;
    },
  },
});

export const { selectHamsterForMedical, clearSelectedHamsterForMedical } = selectedHamsterMedicalSlice.actions;

export default selectedHamsterMedicalSlice.reducer;