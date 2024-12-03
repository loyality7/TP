import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { CreditCard, Plus, Edit2, Lock } from 'lucide-react';

const Billing = () => {
  const paymentMethods = [
    {
      id: 1,
      type: 'Visa',
      last4: '4242',
      expiry: '12/24',
      isDefault: true
    },
    {
      id: 2,
      type: 'Mastercard',
      last4: '8888',
      expiry: '09/25',
      isDefault: false
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Billing & Payment Methods</h1>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Payment Method
          </button>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="border-b p-6">
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {paymentMethods.map((method) => (
              <div key={method.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        {method.type} ending in {method.last4}
                      </h3>
                      {method.isDefault && (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-gray-50 rounded-lg">
                    <Edit2 className="h-4 w-4 text-gray-400" />
                  </button>
                  {!method.isDefault && (
                    <button className="text-sm text-blue-500 hover:text-blue-600">
                      Make Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader className="border-b p-6">
            <div className="flex justify-between items-center">
              <CardTitle>Billing Address</CardTitle>
              <button className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-gray-800">John Doe</p>
              <p className="text-gray-600">123 Business Street</p>
              <p className="text-gray-600">Suite 100</p>
              <p className="text-gray-600">San Francisco, CA 94107</p>
              <p className="text-gray-600">United States</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock className="h-4 w-4" />
          <span>Your payment information is stored securely</span>
        </div>
      </div>
    </Layout>
  );
};

export default Billing; 