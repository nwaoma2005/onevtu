import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Wifi, Tv, Zap, Copy, Menu, User, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import { walletAPI, transactionAPI } from '../services/api';
import { getUser } from '../utils/auth';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showFundWallet, setShowFundWallet] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const navigate = useNavigate();

  const quickServices = [
    { path: '/buy-airtime', icon: Smartphone, label: 'Buy Airtime', color: 'from-blue-500 to-blue-600' },
    { path: '/buy-data', icon: Wifi, label: 'Buy Data', color: 'from-purple-500 to-purple-600' },
    { path: '/cable-tv', icon: Tv, label: 'Cable TV', color: 'from-pink-500 to-pink-600' },
    { path: '/electricity', icon: Zap, label: 'Electricity', color: 'from-yellow-500 to-orange-600' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        walletAPI.getBalance(),
        transactionAPI.getAll({ limit: 5 })
      ]);
      
      setWallet(walletRes.data);
      setTransactions(txRes.data.transactions || []);
    } catch (error) {
      setNotification({ message: 'Failed to load data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    setNotification({ message: 'Referral code copied!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    
    if (amount < 100) {
      setNotification({ message: 'Minimum funding amount is ₦100', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      await walletAPI.fundWallet({ amount });
      setNotification({ 
        message: `Wallet funding initiated! ₦${amount}`, 
        type: 'success' 
      });
      setShowFundWallet(false);
      setFundAmount('');
      fetchData();
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Funding failed',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'airtime': return <Smartphone className="text-current" size={20} />;
      case 'data': return <Wifi className="text-current" size={20} />;
      case 'cable-tv': return <Tv className="text-current" size={20} />;
      case 'electricity': return <Zap className="text-current" size={20} />;
      default: return <Smartphone className="text-current" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-blue-100 mb-2">Total Balance</p>
                  <h2 className="text-4xl font-bold mb-4">
                    ₦{wallet?.balance?.toLocaleString() || '0.00'}
                  </h2>
                  <button 
                    onClick={() => setShowFundWallet(true)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    Fund Wallet
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                  <p className="text-blue-100 mb-2">Referral Code</p>
                  <div className="flex items-center gap-3">
                    <code className="text-2xl font-mono font-bold">{user?.referralCode || 'N/A'}</code>
                    <button 
                      onClick={copyReferralCode}
                      className="p-2 hover:bg-white/20 rounded-lg transition"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Services */}
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickServices.map(service => (
                  <button
                    key={service.path}
                    onClick={() => navigate(service.path)}
                    className="bg-white rounded-xl p-6 hover:shadow-lg transition group"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                      <service.icon className="text-white" size={24} />
                    </div>
                    <p className="font-semibold text-sm">{service.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Recent Transactions</h3>
                <button 
                  onClick={() => navigate('/transactions')}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No transactions yet</p>
                    <p className="text-sm mt-2">Start by buying airtime or data!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.map(tx => (
                      <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {getServiceIcon(tx.serviceType)}
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{tx.serviceType.replace('-', ' ')} - {tx.network || tx.provider}</p>
                            <p className="text-sm text-gray-600">{tx.recipient}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₦{tx.amount?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            tx.status === 'success' ? 'bg-green-100 text-green-700' : 
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Fund Wallet Modal */}
      {showFundWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Fund Wallet</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
                min="100"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1000, 2000, 5000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setFundAmount(amount.toString())}
                  className="py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-sm text-blue-800 font-medium">Payment Gateway</p>
              <p className="text-xs text-blue-600 mt-1">This will redirect you to secure payment page</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFundWallet(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFundWallet}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;