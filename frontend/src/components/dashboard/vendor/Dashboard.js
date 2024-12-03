import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Box, Grid, Typography, CircularProgress, CssBaseline } from '@mui/material';
import { useQuery } from 'react-query';
import apiService from '../../../services/api';
import DashboardStats from './DashboardStats';
import RecentActivity from './RecentActivity';
import TestDistribution from './TestDistribution';
import PerformanceMetrics from './PerformanceMetrics';
import Layout from '../../layout/Layout';

const Dashboard = () => {
  const auth = useAuth();
  const { isAuthenticated, token } = auth;

  const { data: dashboardData, isLoading, error } = useQuery(
    'vendorDashboard',
    async () => {
      if (!isAuthenticated || !token) {
        throw new Error('Not authenticated');
      }
      
      const response = await apiService.get('/vendor/dashboard');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard response:', response);
      }

      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to fetch dashboard data');
      }
      
      const data = response?.data || {};
      
      return {
        overview: {
          totalTests: 0,
          activeTests: 0,
          totalCandidates: 0,
          pendingInvitations: 0,
          ...(data.overview || {})
        },
        performance: {
          averageScore: 0,
          passRate: 0,
          totalAttempts: 0,
          ...(data.performance || {})
        },
        testDistribution: data.testDistribution || {},
        recentActivity: data.recentActivity || []
      };
    },
    {
      retry: 1,
      enabled: isAuthenticated,
      onError: (error) => {
        console.error('Dashboard fetch error:', error);
      }
    }
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          width="100%"
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={3} width="100%">
          <Typography color="error">
            Error loading dashboard: {error.message}
          </Typography>
        </Box>
      );
    }

    return (
      <Box 
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Vendor Dashboard
        </Typography>
        
        <Grid 
          container 
          spacing={3} 
          sx={{ 
            width: '100%',
            margin: 0,
            position: 'relative'
          }}
        >
          {/* Stats Overview */}
          <Grid item xs={12}>
            <DashboardStats stats={dashboardData} />
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={8}>
            <PerformanceMetrics metrics={dashboardData.performance} />
          </Grid>

          {/* Test Distribution */}
          <Grid item xs={12} md={4}>
            <TestDistribution distribution={dashboardData.testDistribution} />
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12}>
            <RecentActivity activities={dashboardData.recentActivity} />
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <>
      <CssBaseline />
      <Layout>
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          {renderContent()}
        </Box>
      </Layout>
    </>
  );
};

export default Dashboard;
