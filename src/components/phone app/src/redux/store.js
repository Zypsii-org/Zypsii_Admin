import { configureStore } from '@reduxjs/toolkit';
import storiesReducer from './reducers/storiesReducer';
import scheduleReducer from './slices/scheduleSlice';
import mainLandingReducer from './slices/mainLandingSlice';

const store = configureStore({
  reducer: {
    stories: storiesReducer,
    schedule: scheduleReducer,
    mainLanding: mainLandingReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      thunk: true
    }),
});

export { store }; 