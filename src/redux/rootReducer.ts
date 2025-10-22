import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import cartReducer from "./features/cartSlice";
import groomingReducer from "./features/SelectedGroomingItem";
import selectedHamsterGroomingReducer from "./features/selectedHamsterGroomingSlice";

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  grooming: groomingReducer,
  selectedHamsterGrooming: selectedHamsterGroomingReducer,
});
export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
