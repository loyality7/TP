import React, { useState, useEffect } from 'react';
import Layout from '../../layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
import { Wallet as WalletIcon, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import walletService from '../../../services/walletService';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const balanceData = await walletService.getBalance();
      const transactionsData = await walletService.getTransactions();
      
      console.log('Balance Data:', balanceData);
      console.log('Transactions Data:', transactionsData);
      
      setBalance(balanceData.balance);
      setTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Wallet Data Error:', error);
      toast.error('Failed to fetch wallet data');
    }
  };

  const handleAddMoney = async (amount) => {
    try {
      const order = await walletService.createOrder(amount);
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "TestPro",
        description: "Wallet Recharge",
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await walletService.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Payment successful!');
            fetchWalletData();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: "Vendor Name",
          email: "vendor@example.com"
        },
        theme: {
          color: "#10B981"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">Wallet</h1>
          <button
            onClick={() => handleAddMoney(500)} // Example amount of ₹500
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Add Money
          </button>
        </div>

        {/* Balance Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-gray-500">Available Balance</h2>
                <div className="text-3xl font-semibold text-gray-800 mt-1">
                  ₹{balance.toFixed(2)}
                </div>
              </div>
              <WalletIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`font-medium ${
                    transaction.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Wallet; 