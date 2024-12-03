import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#4caf50', '#ff9800', '#f44336'];

const TestDistribution = ({ distribution = {} }) => {
  const {
    easy = 0,
    medium = 0,
    hard = 0
  } = distribution;

  const data = [
    { name: 'Easy', value: easy || 0 },
    { name: 'Medium', value: medium || 0 },
    { name: 'Hard', value: hard || 0 },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Test Distribution
        </Typography>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TestDistribution; 