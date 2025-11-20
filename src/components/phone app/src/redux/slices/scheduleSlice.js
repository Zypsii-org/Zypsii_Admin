import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bannerImage: null,
  tripName: '',
  travelMode: 'Bike',
  visible: 'Public',
  locationFrom: '',
  locationTo: '',
  fromDate: '',
  toDate: '',
  days: [{ id: 1, description: '', latitude: '', longitude: '' }],
  isSubmitted: false
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    updateSchedule: (state, action) => {
      return { ...state, ...action.payload };
    },
    updateDayLocation: (state, action) => {
      const { dayId, latitude, longitude } = action.payload;
      state.days = state.days.map(day => 
        day.id === dayId 
          ? { ...day, latitude: latitude.toString(), longitude: longitude.toString() }
          : day
      );
    },
    resetSchedule: () => initialState,
    setSubmitted: (state) => {
      state.isSubmitted = true;
    }
  }
});

export const { updateSchedule, updateDayLocation, resetSchedule, setSubmitted } = scheduleSlice.actions;
export default scheduleSlice.reducer; 