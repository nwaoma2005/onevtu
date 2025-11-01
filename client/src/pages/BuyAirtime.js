import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Menu, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import { servicesAPI, walletAPI } from '../services/api';
import { getUser } from '../utils/auth';

const BuyAirtime = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    network: '',
    phone: '',
    amount: ''
  });

  const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
  const quickAmounts = [100, 200, 500, 1000];

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (amount < 50) {
      setNotification({ message: 'Minimum amount is ₦50', type: 'error' });
      return;
    }

    if (amount > wallet?.balance) {
      setNotification({ message: 'Insufficient wallet balance!', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await servicesAPI.buyAirtime({
        network: formData.network,
        phone: formData.phone,
        amount: amount
      });

      setNotification({ 
        message: `Airtime purchase successful! ₦${amount} sent to ${formData.phone}`, 
        type: 'success' 
      });

      setTimeout(() => {
        navigate('/transactions');
      }, 2000);

    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Purchase failed. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

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
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="font-bold text-lg">₦{wallet?.balance?.toLocaleString() || '0.00'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Smartphone className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Buy Airtime</h2>
                  <p className="text-gray-600">Instant airtime top-up</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Network</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {networks.map(net => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setFormData({...formData, network: net})}
                        className={`p-4 border-2 rounded-lg transition ${
                          formData.network === net
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="font-semibold">{net}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="08012345678"
                    required
                    maxLength="11"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount"
                    min="50"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({...formData, amount: amt.toString()})}
                      className="py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                    >
                      ₦{amt}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">₦{formData.amount || 0}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Charges</span>
                    <span className="font-semibold">₦0</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-blue-600">₦{formData.amount || 0}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !formData.network || !formData.phone || !formData.amount}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Buy Airtime'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BuyAirtime;