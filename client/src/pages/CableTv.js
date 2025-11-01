import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Menu, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import { servicesAPI, walletAPI } from '../services/api';
import { getUser } from '../utils/auth';

const CableTV = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cablePlans, setCablePlans] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    provider: '',
    smartCardNumber: '',
    planId: '',
    selectedPlan: null
  });

  const providers = [
    { id: 'dstv', name: 'DSTV' },
    { id: 'gotv', name: 'GOTV' },
    { id: 'startimes', name: 'StarTimes' }
  ];

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    if (formData.provider) {
      fetchCablePlans(formData.provider);
    }
  }, [formData.provider]);

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch wallet');
    }
  };

  const fetchCablePlans = async (provider) => {
    setLoadingPlans(true);
    try {
      const response = await servicesAPI.getCablePlans(provider);
      setCablePlans(response.data.plans || []);
    } catch (error) {
      setNotification({ message: 'Failed to load cable plans', type: 'error' });
      setCablePlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleProviderChange = (provider) => {
    setFormData({
      ...formData,
      provider,
      planId: '',
      selectedPlan: null
    });
    setCustomerInfo(null);
  };

  const handlePlanSelect = (plan) => {
    setFormData({
      ...formData,
      planId: plan.id,
      selectedPlan: plan
    });
  };

  const verifySmartCard = async () => {
    if (!formData.smartCardNumber || !formData.provider) {
      setNotification({ message: 'Please select provider and enter smart card number', type: 'error' });
      return;
    }

    setVerifying(true);
    try {
      const response = await servicesAPI.verifySmartCard({
        provider: formData.provider,
        smartCardNumber: formData.smartCardNumber
      });
      
      setCustomerInfo(response.data.customer);
      setNotification({ message: 'Smart card verified successfully!', type: 'success' });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Verification failed',
        type: 'error'
      });
      setCustomerInfo(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.selectedPlan) {
      setNotification({ message: 'Please select a package', type: 'error' });
      return;
    }

    if (formData.selectedPlan.price > wallet?.balance) {
      setNotification({ message: 'Insufficient wallet balance!', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await servicesAPI.payCableTV({
        provider: formData.provider,
        smartCardNumber: formData.smartCardNumber,
        planId: formData.planId,
        amount: formData.selectedPlan.price
      });

      setNotification({ 
        message: `Cable TV subscription successful! ${formData.selectedPlan.name} activated`, 
        type: 'success' 
      });

      setTimeout(() => {
        navigate('/transactions');
      }, 2000);

    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Subscription failed. Please try again.',
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
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Tv className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cable TV Subscription</h2>
                  <p className="text-gray-600">Renew your cable subscription</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Provider</label>
                  <div className="grid grid-cols-3 gap-3">
                    {providers.map(prov => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => handleProviderChange(prov.id)}
                        className={`p-4 border-2 rounded-lg transition ${
                          formData.provider === prov.id
                            ? 'border-pink-600 bg-pink-50'
                            : 'border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <p className="font-semibold">{prov.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Smart Card Number / IUC Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.smartCardNumber}
                      onChange={(e) => setFormData({...formData, smartCardNumber: e.target.value})}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Enter smart card number"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifySmartCard}
                      disabled={verifying || !formData.provider || !formData.smartCardNumber}
                      className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {customerInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-800">Customer: {customerInfo.name}</p>
                    <p className="text-sm text-green-600">Status: {customerInfo.status}</p>
                  </div>
                )}

                {formData.provider && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Package</label>
                    {loadingPlans ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading packages...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cablePlans.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No packages available</p>
                        ) : (
                          cablePlans.map(plan => (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => handlePlanSelect(plan)}
                              className={`w-full p-4 border-2 rounded-lg transition text-left ${
                                formData.planId === plan.id
                                  ? 'border-pink-600 bg-pink-50'
                                  : 'border-gray-200 hover:border-pink-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">{plan.name}</p>
                                <p className="font-bold text-pink-600">₦{plan.price.toLocaleString()}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {formData.selectedPlan && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Package</span>
                      <span className="font-semibold">{formData.selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-semibold">₦{formData.selectedPlan.price.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-pink-600">₦{formData.selectedPlan.price.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.provider || !formData.smartCardNumber || !formData.selectedPlan}
                  className="w-full bg-gradient-to-r from-pink-600 to-red-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CableTV;