import React, { useState, useEffect } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Download, Filter, Calendar, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { apiService } from '../../../services/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    limit: 10
  });

  // Add this useEffect to fetch data when component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiService.get(`/vendor/wallet/transactions?page=${pagination.currentPage}&limit=${pagination.limit}`);
        const data = response.data;
        
        setTransactions(data.transactions);
        setCurrentBalance(data.currentBalance);
        setPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          hasMore: data.pagination.hasMore,
          limit: data.pagination.limit
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, [pagination.currentPage, pagination.limit]);

  // Add pagination handlers
  const handlePreviousPage = () => {
    if (pagination.currentPage > 1) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  // Add this function to format the transaction amount with the appropriate sign
  const formatAmount = (type, amount) => {
    return type === 'credit' 
      ? `+$${amount.toFixed(2)}`
      : `-$${amount.toFixed(2)}`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium text-gray-600">Current Balance</h2>
                <p className="text-3xl font-semibold text-gray-900">₹{currentBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table modifications */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-600">{transaction.description}</td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        transaction.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatAmount(transaction.type, transaction.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        transaction.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={handlePreviousPage}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={pagination.currentPage === 1}>
              Previous
            </button>
            <button 
              onClick={handleNextPage}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={!pagination.hasMore}>
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Transactions; 