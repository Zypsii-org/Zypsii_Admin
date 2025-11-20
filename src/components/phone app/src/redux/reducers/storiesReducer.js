import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  seenStories: {},
};

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    markStorySeen: (state, action) => {
      const { userId, storyId } = action.payload;
      if (!state.seenStories[userId]) {
        state.seenStories[userId] = [];
      }
      if (!state.seenStories[userId].includes(storyId)) {
        state.seenStories[userId].push(storyId);
      }
    },
    setSeenStories: (state, action) => {
      state.seenStories = action.payload;
    },
    clearSeenStories: (state) => {
      state.seenStories = {};
    },
  },
});

export const { markStorySeen, setSeenStories, clearSeenStories } = storiesSlice.actions;
export default storiesSlice.reducer; 