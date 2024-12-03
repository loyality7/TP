import React from 'react';
import Layout from '../../layout/Layout';
import { Card, CardContent } from '../../common/Card';
import { Calendar, Search, Filter, CreditCard, CheckCircle, XCircle } from 'lucide-react';

const PaymentHistory = () => {
  const transactions = [
    {
      id: 'TXN-2024-001',
      date: '2024-03-15',
      amount: 299.00,
      status: 'Successful',
      method: 'Visa ending in 4242',
      type: 'Subscription Payment'
    },
    {
      id: 'TXN-2024-002',
      date: '2024-02-15',
      amount: 299.00,
      status: 'Successful',
      method: 'Visa ending in 4242',
      type: 'Subscription Payment'
    },
    {
      id: 'TXN-2024-003',
      date: '2024-01-15',
      amount: 299.00,
      status: 'Failed',
      method: 'Visa ending in 4242',
      type: 'Subscription Payment'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Payment History</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Transaction ID</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Payment Method</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-medium text-gray-800">{transaction.id}</span>
                    </td>
                    <td className="p-4 text-gray-600">{transaction.date}</td>
                    <td className="p-4 text-gray-600">{transaction.type}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{transaction.method}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-800">${transaction.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {transaction.status === 'Successful' ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-emerald-600">{transaction.status}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">{transaction.status}</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Spent</h3>
              <div className="text-2xl font-semibold text-gray-800">$897.00</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Last Payment</h3>
              <div className="text-2xl font-semibold text-gray-800">$299.00</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Next Payment</h3>
              <div className="text-2xl font-semibold text-gray-800">Apr 15, 2024</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentHistory; 