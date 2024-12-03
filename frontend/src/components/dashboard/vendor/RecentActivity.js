import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { format } from 'date-fns';

const RecentActivity = ({ activities = [] }) => {
  if (!activities.length) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Box p={2}>
            <Typography variant="body2" color="textSecondary">
              No recent activity
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {activities.map((activity, index) => (
            <ListItem key={activity.id || index}>
              <ListItemAvatar>
                <Avatar>
                  <Person />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={activity.candidateName}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="textPrimary"
                    >
                      {activity.testTitle} - Score: {activity.score}%
                    </Typography>
                    {` - ${format(new Date(activity.completedAt), 'PPp')}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 