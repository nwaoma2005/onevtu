import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Menu, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import { servicesAPI, walletAPI } from '../services/api';
import { getUser } from '../utils/auth';

const BuyData = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dataPlans, setDataPlans] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    network: '',
    phone: '',
    planId: '',
    selectedPlan: null
  });

  const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    if (formData.network) {
      fetchDataPlans(formData.network);
    }
  }, [formData.network]);

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet');
    }
  };

  const fetchDataPlans = async (network) => {
    setLoadingPlans(true);
    try {
      const response = await servicesAPI.getDataPlans(network);
      setDataPlans(response.data.plans || []);
    } catch (error) {
      setNotification({ message: 'Failed to load data plans', type: 'error' });
      setDataPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleNetworkChange = (network) => {
    setFormData({
      ...formData,
      network,
      planId: '',
      selectedPlan: null
    });
  };

  const handlePlanSelect = (plan) => {
    setFormData({
      ...formData,
      planId: plan.id,
      selectedPlan: plan
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.selectedPlan) {
      setNotification({ message: 'Please select a data plan', type: 'error' });
      return;
    }

    if (formData.selectedPlan.price > wallet?.balance) {
      setNotification({ message: 'Insufficient wallet balance!', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await servicesAPI.buyData({
        network: formData.network,
        phone: formData.phone,
        planId: formData.planId,
        amount: formData.selectedPlan.price
      });

      setNotification({ 
        message: `Data purchase successful! ${formData.selectedPlan.name} sent to ${formData.phone}`, 
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
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wifi className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Buy Data</h2>
                  <p className="text-gray-600">Choose from affordable data plans</p>
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
                        onClick={() => handleNetworkChange(net)}
                        className={`p-4 border-2 rounded-lg transition ${
                          formData.network === net
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="font-semibold">{net}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.network && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Data Plan</label>
                    {loadingPlans ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading plans...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {dataPlans.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No plans available</p>
                        ) : (
                          dataPlans.map(plan => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => handlePlanSelect(plan)}
                              className={`w-full p-4 border-2 rounded-lg transition text-left ${
                                formData.planId === plan.id
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">{plan.name}</p>
                                  <p className="text-sm text-gray-600">{plan.validity}</p>
                                </div>
                                <p className="font-bold text-purple-600">₦{plan.price.toLocaleString()}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="08012345678"
                    required
                    maxLength="11"
                  />
                </div>

                {formData.selectedPlan && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Data Plan</span>
                      <span className="font-semibold">{formData.selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-semibold">₦{formData.selectedPlan.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Charges</span>
                      <span className="font-semibold">₦0</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-purple-600">₦{formData.selectedPlan.price.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.network || !formData.phone || !formData.selectedPlan}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Buy Data'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BuyData;