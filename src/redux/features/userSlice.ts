import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const initialState = storedUser ? JSON.parse(storedUser) : null;

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      console.log(state);
      localStorage.setItem("user", JSON.stringify(action.payload));
      localStorage.setItem("token", action.payload.token);
      return action.payload;
    },
    logout: () => {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
