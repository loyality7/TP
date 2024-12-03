import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { Check } from 'lucide-react';

const Subscription = () => {
  const currentPlan = {
    name: 'Professional',
    price: 299,
    period: 'month',
    features: [
      'Unlimited assessments',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Priority support'
    ]
  };

  const plans = [
    {
      name: 'Basic',
      price: 99,
      period: 'month',
      features: [
        'Up to 50 assessments',
        'Basic analytics',
        'Email support'
      ]
    },
    currentPlan,
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'year',
      features: [
        'Unlimited everything',
        'Custom integration',
        'Dedicated support',
        'SLA guarantee'
      ]
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Subscription</h1>
        </div>

        {/* Current Plan */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-800 mb-1">Current Plan: {currentPlan.name}</h2>
                <p className="text-sm text-gray-500">Your subscription renews on April 15, 2024</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">
                  Active
                </span>
                <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Cancel Plan
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.name === currentPlan.name ? 'ring-2 ring-emerald-500' : ''}>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {typeof plan.price === 'number' ? (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-800">${plan.price}</span>
                      <span className="text-gray-500 ml-1">/{plan.period}</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-gray-800">{plan.price}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.name === currentPlan.name ? (
                  <button className="w-full px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium">
                    Current Plan
                  </button>
                ) : (
                  <button className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600">
                    Upgrade
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Subscription; 