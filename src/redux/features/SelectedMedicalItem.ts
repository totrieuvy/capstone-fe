// src/redux/features/SelectedMedicalItem.ts
import { createSlice } from "@reduxjs/toolkit";
import { type PayloadAction } from "@reduxjs/toolkit";

// Định nghĩa kiểu cho Slot thời gian
interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Interface cho SelectedMedicalItem
interface SelectedMedicalItem {
  id: string;
  name: string;
  type: "service";
  description?: string;
  displayPrice?: string;
  durationMinutes?: number;
  selectedTime?: TimeSlot | null;
}

// Interface cho MedicalState
interface MedicalState {
  selectedItem: SelectedMedicalItem | null;
}

const initialState: MedicalState = {
  selectedItem: null,
};

export const medicalSlice = createSlice({
  name: "medical",
  initialState,
  reducers: {
    // Select medical item
    selectMedicalItem: (state, action: PayloadAction<Omit<SelectedMedicalItem, "selectedTime">>) => {
      state.selectedItem = { ...action.payload, selectedTime: null };
    },
    // Select medical time
    selectMedicalTime: (state, action: PayloadAction<TimeSlot>) => {
      if (state.selectedItem) {
        state.selectedItem.selectedTime = action.payload;
      }
    },
    // Clear selected medical item
    clearSelectedMedicalItem: (state) => {
      state.selectedItem = null;
    },
  },
});

export const { selectMedicalItem, selectMedicalTime, clearSelectedMedicalItem } = medicalSlice.actions;

export default medicalSlice.reducer;