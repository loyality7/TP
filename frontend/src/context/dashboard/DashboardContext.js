import React, { createContext, useState } from 'react';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [activeView, setActiveView] = useState('overview');
  const [filters, setFilters] = useState({});

  return (
    <DashboardContext.Provider value={{ activeView, setActiveView, filters, setFilters }}>
      {children}
    </DashboardContext.Provider>
  );
};
