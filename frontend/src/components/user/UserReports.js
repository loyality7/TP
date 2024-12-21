import React, { useState } from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import SideBar from './SideBar';

const UserReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex">
      <SideBar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 lg:ml-64">
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Grid container spacing={3}>
            {/* Main content */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h5" gutterBottom>
                  User Reports
                </Typography>
                {/* Add report content/table here */}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default UserReports;
