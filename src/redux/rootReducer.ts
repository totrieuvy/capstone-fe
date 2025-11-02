import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./features/userSlice";
import cartReducer from "./features/cartSlice";
import groomingReducer from "./features/SelectedGroomingItem";
import selectedHamsterGroomingReducer from "./features/selectedHamsterGroomingSlice";
import medicalReducer from "./features/SelectedMedicalItem";
import selectedHamsterMedicalReducer from "./features/selectedHamsterMedicalSlice";

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  grooming: groomingReducer,
  selectedHamsterGrooming: selectedHamsterGroomingReducer,
  medical: medicalReducer,
  selectedHamsterMedical: selectedHamsterMedicalReducer,
});
export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
