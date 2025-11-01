import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Menu, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import { servicesAPI, walletAPI } from '../services/api';
import { getUser } from '../utils/auth';

const Electricity = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [meterInfo, setMeterInfo] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    provider: '',
    meterType: 'prepaid',
    meterNumber: '',
    amount: ''
  });

  const providers = ['IBEDC', 'EKEDC', 'AEDC', 'PHED', 'KAEDC', 'JED', 'EEDC'];
  const quickAmounts = [1000, 2000, 5000, 10000];

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

  const verifyMeter = async () => {
    if (!formData.meterNumber || !formData.provider || !formData.meterType) {
      setNotification({ message: 'Please fill all meter details', type: 'error' });
      return;
    }

    setVerifying(true);
    try {
      const response = await servicesAPI.verifyMeter({
        provider: formData.provider,
        meterNumber: formData.meterNumber,
        meterType: formData.meterType
      });
      
      setMeterInfo(response.data.customer);
      setNotification({ message: 'Meter verified successfully!', type: 'success' });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Verification failed',
        type: 'error'
      });
      setMeterInfo(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (amount < 1000) {
      setNotification({ message: 'Minimum amount is ₦1,000', type: 'error' });
      return;
    }

    if (amount > wallet?.balance) {
      setNotification({ message: 'Insufficient wallet balance!', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await servicesAPI.payElectricity({
        provider: formData.provider,
        meterNumber: formData.meterNumber,
        meterType: formData.meterType,
        amount: amount
      });

      setNotification({ 
        message: `Electricity payment successful! ₦${amount} units loaded`, 
        type: 'success' 
      });

      setTimeout(() => {
        navigate('/transactions');
      }, 2000);

    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Payment failed. Please try again.',
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
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Electricity Bill Payment</h2>
                  <p className="text-gray-600">Pay your electricity bills</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Meter Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['prepaid', 'postpaid'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, meterType: type})}
                        className={`p-4 border-2 rounded-lg transition capitalize ${
                          formData.meterType === type
                            ? 'border-orange-600 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <p className="font-semibold">{type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select Disco</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({...formData, provider: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose your electricity provider</option>
                    {providers.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Meter Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.meterNumber}
                      onChange={(e) => setFormData({...formData, meterNumber: e.target.value})}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter meter number"
                      required
                    />
                    <button
                      type="button"
                      onClick={verifyMeter}
                      disabled={verifying || !formData.provider || !formData.meterNumber}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>

                {meterInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-800">Customer: {meterInfo.name}</p>
                    <p className="text-sm text-green-600">Address: {meterInfo.address}</p>
                    <p className="text-sm text-green-600">Meter Type: {formData.meterType}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter amount"
                    min="1000"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormData({...formData, amount: amt.toString()})}
                      className="py-2 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm"
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                {formData.amount && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Amount</span>
                      <span className="font-semibold">₦{parseFloat(formData.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Service Charge</span>
                      <span className="font-semibold">₦0</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-bold">Total</span>
                      <span className="font-bold text-orange-600">₦{parseFloat(formData.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.provider || !formData.meterNumber || !formData.amount}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Pay Bill'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Electricity;