import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

const TestCard = ({ test }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold">{test?.title}</h3>
      <p className="text-gray-600">{test?.description}</p>
      <div className="mt-4">
        <Button>Start Test</Button>
      </div>
    </Card>
  );
};

export default TestCard;
