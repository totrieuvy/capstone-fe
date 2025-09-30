import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN" | "VETERINARIAN" | "STAFF" | "SHIPPER";
  status: "ACTIVE" | "INACTIVE";
}

type UserState = User | null;

const initialState: UserState = null;

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (_state, action: PayloadAction<User>) => action.payload,
    logout: () => null,
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
