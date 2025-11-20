import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  preferences: [],
  isFirstTime: true,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserPreferences: (state, action) => {
      state.preferences = action.payload;
      state.isFirstTime = false;
    },
    clearUserPreferences: (state) => {
      state.preferences = [];
      state.isFirstTime = true;
    },
  },
});

export const { setUserPreferences, clearUserPreferences } = userSlice.actions;
export default userSlice.reducer; 