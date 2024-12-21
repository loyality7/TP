import React, { useState } from 'react';
import SideBar from './SideBar';

const Ai = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <SideBar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className={`${isSidebarOpen ? 'lg:ml-64' : ''} p-6`}>
        <h1 className="text-2xl font-semibold text-gray-800">Test AI</h1>
        {/* Add your AI component content here */}
      </div>
    </div>
  );
};

export default Ai;