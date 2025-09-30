import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// 👉 Khai báo interface cho User
export interface User {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
}

// 👉 State có thể là User hoặc null
type UserState = User | null;

// 👉 State khởi tạo
const initialState: UserState = null;

// 👉 Tạo slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (_state, action: PayloadAction<User>) => action.payload,
    logout: () => null,
  },
});

// 👉 Export actions và reducer
export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
