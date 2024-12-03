import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';

const PerformanceMetrics = ({ metrics = {} }) => {
  const {
    averageScore = 0,
    passRate = 0,
    totalAttempts = 0
  } = metrics;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Metrics
        </Typography>
        
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Average Score: {averageScore}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={averageScore} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Pass Rate: {passRate}%
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={passRate}
            color="success"
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Total Attempts: {totalAttempts}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics; 