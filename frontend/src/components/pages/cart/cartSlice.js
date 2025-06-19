import { createSlice } from "@reduxjs/toolkit";
import {
    getCart,
    addOrUpdateCartItem,
    updateCartItem,
    removeCartItem,
} from "./cartService";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],
        totalPrice: 0,
        status: "idle",     // idle | loading | succeeded | failed
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        // getCart
        builder
            .addCase(getCart.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(getCart.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload.items;
                state.totalPrice = action.payload.totalPrice;
            })
            .addCase(getCart.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Failed to fetch cart";
            });

        // addOrUpdateCartItem
        builder
            .addCase(addOrUpdateCartItem.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(addOrUpdateCartItem.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload.items;
                state.totalPrice = action.payload.totalPrice;
            })
            .addCase(addOrUpdateCartItem.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Failed to add/update item";
            });

        // updateCartItem
        builder
            .addCase(updateCartItem.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(updateCartItem.fulfilled, (state, action) => {
                state.status = "succeeded";
                const updatedItem = action.payload;
                const index = state.items.findIndex(item => item._id === updatedItem._id);
                if (index !== -1) {
                    state.items[index] = updatedItem;
                }
                state.totalPrice = action.payload.totalPrice;
            })
            .addCase(updateCartItem.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Failed to update item";
            });

        // removeCartItem
        builder
            .addCase(removeCartItem.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(removeCartItem.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload.items;
                state.totalPrice = action.payload.totalPrice;
            })
            .addCase(removeCartItem.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Failed to remove item";
            });
    },
});

export default cartSlice.reducer;
