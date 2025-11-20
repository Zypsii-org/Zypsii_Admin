// ScheduleContext.js
import React, { createContext, useContext, useState } from 'react';

const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
  const [scheduleData, setScheduleData] = useState([
    {
        id: 1,
        title: 'Bikers club',
        from: 'Chennai---',
        to: 'Mysore',
        date: '02-02-25',
        riders: 20,
        joined: true,
        imageUrl: 'https://img.freepik.com/free-photo/straight-road-middle-desert-with-magnificent-mountains-sunset_181624-37698.jpg?semt=ais_hybrid',
        day1Locations: ['Thirumazhisai', 'Sriperumbudur', 'Vellore', 'Vaniyambadi', 'Krishnagiri'],
        day2Locations: ['Krishnagiri', 'Salem', 'Erode'],
      },
      {
        id: 2,
        title: 'R15 club',
        from: 'Coimbatore---',
        to: 'Goa',
        date: '10-12-24',
        riders: 2,
        joined: true,
        imageUrl: 'https://img.freepik.com/free-photo/straight-road-middle-desert-with-magnificent-mountains-sunset_181624-37698.jpg?semt=ais_hybrid',
        day1Locations: ['Chennai', 'Tiruvannamalai', 'Vellore'],
        day2Locations: ['Erode', 'Coimbatore'],
      },
      {
        id: 3,
        title: 'R16 club',
        from: 'Coimbatore---',
        to: 'Goa',
        date: '17-12-24',
        riders: 2,
        joined: true,
        imageUrl: 'https://img.freepik.com/free-photo/straight-road-middle-desert-with-magnificent-mountains-sunset_181624-37698.jpg?semt=ais_hybrid',
        day1Locations: ['Madurai', 'Dindigul', 'Karur'],
        day2Locations: ['Salem', 'Coimbatore'],
      },
      {
        id: 4,
        title: 'Bikers club',
        from: 'Chennai---',
        to: 'Mysore',
        date: '14-02-25',
        riders: 20,
        joined: true,
        imageUrl: 'https://img.freepik.com/free-photo/straight-road-middle-desert-with-magnificent-mountains-sunset_181624-37698.jpg?semt=ais_hybrid',
        day1Locations: ['Thiruvallur', 'Pondicherry'],
        day2Locations: ['Cuddalore', 'Chidambaram'],
      },
      {
        id: 5,
        title: 'Route 46',
        from: 'Chennai---',
        to: 'Mysore',
        date: '12-02-25',
        riders: 20,
        joined: true,
        imageUrl: 'https://img.freepik.com/free-photo/straight-road-middle-desert-with-magnificent-mountains-sunset_181624-37698.jpg?semt=ais_hybrid',
        day1Locations: ['Bangalore', 'Hosur'],
        day2Locations: ['Coimbatore', 'Mysore'],
      },
  ]);

  return (
    <ScheduleContext.Provider value={{ scheduleData, setScheduleData }}>
      {children}
    </ScheduleContext.Provider>
  );
};

// useSchedule.js
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
