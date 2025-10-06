import { createSlice } from "@reduxjs/toolkit";
import { type PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: number | string;
  name: string;
  quantity: number;
  stockQuantity: number;
  price?: number; // nếu có
  imageUrl?: string; // nếu có
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        if (existingItem.quantity < action.payload.stockQuantity) {
          existingItem.quantity += 1;
        }
      } else {
        state.items.push({ ...action.payload });
      }
    },

    updateQuantity: (state, action: PayloadAction<{ id: number | string; quantity: number }>) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item && action.payload.quantity <= item.stockQuantity && action.payload.quantity >= 0) {
        item.quantity = action.payload.quantity;
      }
      state.items = state.items.filter((item) => item.quantity > 0);
    },

    removeFromCart: (state, action: PayloadAction<number | string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
