import React from 'react';
 
const DashboardStats = ({ stats = { overview: {}, performance: {} } }) => {
  const { overview = {} } = stats;

  const statCards = [
    {
      title: 'Total Tests Created',
      value: overview.totalTests || 0,
      icon: '📝',
      trend: '+12%'
    },
    {
      title: 'Active Tests',
      value: overview.activeTests || 0,
      icon: '✅',
      trend: '+5%'
    },
    {
      title: 'Total Candidates',
      value: overview.totalCandidates || 0,
      icon: '👥',
      trend: '+18%'
    },
    {
      title: 'Tests Taken',
      value: overview.testsTaken || 0,
      icon: '📈',
      trend: '+25%'
    },
    {
      title: 'Pending Invitations',
      value: overview.pendingInvitations || 0,
      icon: '📨',
      trend: '-2%'
    },
    {
      title: 'Total Revenue',
      value: `$${overview.totalRevenue || 0}`,
      icon: '💰',
      trend: '+15%'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              <span className={`text-sm ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend}
              </span>
            </div>
            <span className="text-2xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats; 