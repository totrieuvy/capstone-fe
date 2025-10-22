// src/redux/features/SelectedGroomingItem.ts
import { createSlice } from "@reduxjs/toolkit";
import { type PayloadAction } from "@reduxjs/toolkit";

// Định nghĩa kiểu cho Slot thời gian
interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Cập nhật interface SelectedGroomingItem để bao gồm selectedTime
interface SelectedGroomingItem {
  id: string;
  name: string;
  type: "service" | "combo";
  description?: string;
  displayPrice?: string;
  durationMinutes?: number;
  selectedTime?: TimeSlot | null; // <-- Thêm trường này, có thể là null ban đầu
}

// Giữ nguyên interface GroomingState
interface GroomingState {
  selectedItem: SelectedGroomingItem | null;
}

const initialState: GroomingState = {
  selectedItem: null,
};

export const groomingSlice = createSlice({
  name: "grooming",
  initialState,
  reducers: {
    // Cập nhật selectGroomingItem để khởi tạo selectedTime là null
    selectGroomingItem: (state, action: PayloadAction<Omit<SelectedGroomingItem, "selectedTime">>) => {
      state.selectedItem = { ...action.payload, selectedTime: null }; // Khởi tạo selectedTime là null
    },
    // Thêm reducer mới để chọn thời gian
    selectGroomingTime: (state, action: PayloadAction<TimeSlot>) => {
      if (state.selectedItem) {
        state.selectedItem.selectedTime = action.payload;
      }
    },
    // Cập nhật clearSelectedGroomingItem
    clearSelectedGroomingItem: (state) => {
      state.selectedItem = null; // Khi clear item thì selectedTime cũng tự động mất
    },
  },
});

// Export thêm action mới
export const { selectGroomingItem, selectGroomingTime, clearSelectedGroomingItem } = groomingSlice.actions;

export default groomingSlice.reducer;
