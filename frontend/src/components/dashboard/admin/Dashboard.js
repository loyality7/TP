import React from 'react';
import Card from '../../common/Card';

const AdminDashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Tests" value="0" />
        <Card title="Active Users" value="0" />
        <Card title="Pending Reviews" value="0" />
      </div>
    </div>
  );
};

export default AdminDashboard;
