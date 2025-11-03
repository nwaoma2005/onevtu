import React, { useState, useEffect } from 'react';
import { Menu, User, Copy, Save, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import { authAPI, walletAPI } from '../services/api';
import { getUser, setAuth } from '../utils/auth';

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(getUser());
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('wallet'); // Start on wallet tab
  const [debugInfo, setDebugInfo] = useState(''); // Show debug info

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [fundAmount, setFundAmount] = useState('');
  const [showFundModal, setShowFundModal] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getBalance();
      setWallet(response.data);
      setDebugInfo('Wallet loaded: ₦' + response.data.balance);
    } catch (error) {
      setDebugInfo('Error loading wallet: ' + error.message);
      console.error('Failed to fetch wallet', error);
    }
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    
    if (!amount || amount < 100) {
      alert('Minimum funding amount is ₦100');
      return;
    }

    setLoading(true);
    setDebugInfo('Initiating payment...');

    try {
      // Call backend to initialize payment
      const response = await walletAPI.fundWallet({ amount });
      
      setDebugInfo('Response received: ' + JSON.stringify(response.data));

      // Check response structure
      if (response.data.success === false) {
        // API returned error
        alert('Error: ' + (response.data.message || 'Payment initialization failed'));
        setDebugInfo('Error: ' + response.data.message);
        return;
      }

      // Check for payment URL
      const paymentUrl = response.data.data?.authorization_url || 
                        response.data.authorization_url ||
                        response.data.data?.link;

      if (paymentUrl) {
        setDebugInfo('Redirecting to: ' + paymentUrl);
        // Give user time to see message
        setTimeout(() => {
          window.location.href = paymentUrl;
        }, 1000);
      } else {
        // No payment URL found
        alert('Payment URL not received. Response: ' + JSON.stringify(response.data));
        setDebugInfo('No payment URL in response: ' + JSON.stringify(response.data));
      }

    } catch (error) {
      console.error('Fund wallet error:', error);
      
      let errorMsg = 'Unknown error';
      if (error.response) {
        errorMsg = error.response.data?.message || error.response.statusText;
        setDebugInfo('API Error: ' + JSON.stringify(error.response.data));
      } else if (error.request) {
        errorMsg = 'No response from server';
        setDebugInfo('No response from server');
      } else {
        errorMsg = error.message;
        setDebugInfo('Error: ' + error.message);
      }

      alert('Payment failed: ' + errorMsg);
      
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    alert('Referral code copied: ' + user?.referralCode);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      setAuth(localStorage.getItem('token'), response.data.user);
      setUser(response.data.user);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Update failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authAPI.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      alert('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert('Password update failed: ' + (error.response?.data?.message || error.message));
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
              <div className="text-right">
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="font-bold text-lg">₦{wallet?.balance?.toLocaleString() || '0.00'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {/* Debug Info - Visible on mobile */}
          {debugInfo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
                <div className="text-xs text-yellow-800 break-all">{debugInfo}</div>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">Profile Settings</h2>
              <p className="text-sm text-gray-600">Manage your account</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm mb-4">
              <div className="border-b overflow-x-auto">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'profile'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'security'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Security
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'wallet'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Wallet
                  </button>
                  <button
                    onClick={() => setActiveTab('referral')}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                      activeTab === 'referral'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    Referral
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'wallet' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                      <p className="text-blue-100 mb-2 text-sm">Available Balance</p>
                      <h3 className="text-3xl font-bold mb-4">₦{wallet?.balance?.toLocaleString() || '0.00'}</h3>
                      <button
                        onClick={() => setShowFundModal(true)}
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition text-sm"
                      >
                        Fund Wallet
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold mb-3 text-sm">Payment Methods</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Paystack</span>
                          <span className="text-green-600 text-xs font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'referral' && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                      <h3 className="text-lg font-bold mb-4">Your Referral Code</h3>
                      <div className="flex items-center gap-2 bg-white/20 p-3 rounded-lg mb-3">
                        <code className="text-xl font-mono font-bold flex-1">{user?.referralCode || 'N/A'}</code>
                        <button
                          onClick={copyReferralCode}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                      <p className="text-green-100 text-sm">
                        Share your referral code and earn commission!
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {activeTab === 'security' && (
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                        minLength="8"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showFundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Fund Wallet</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount (Min: ₦100)</label>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                placeholder="Enter amount"
                min="100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setFundAmount(amount.toString())}
                  className="py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm"
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg mb-4">
              <p className="text-xs text-blue-800 font-medium">Paystack Payment</p>
              <p className="text-xs text-blue-600 mt-1">You'll be redirected to pay</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFundModal(false);
                  setFundAmount('');
                  setDebugInfo('');
                }}
                disabled={loading}
                className="flex-1 py-3 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFundWallet}
                disabled={loading || !fundAmount}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;