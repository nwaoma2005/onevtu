import React, { useState, useEffect } from 'react';
import { Menu, User, Copy, Save } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('profile');

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
    } catch (error) {
      console.error('Failed to fetch wallet');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(profileData);
      setAuth(localStorage.getItem('token'), response.data.user);
      setUser(response.data.user);
      setNotification({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Update failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ message: 'Passwords do not match!', type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setNotification({ message: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await authAPI.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setNotification({ message: 'Password updated successfully!', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Password update failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    
    if (amount < 100) {
      setNotification({ message: 'Minimum funding amount is ₦100', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await walletAPI.fundWallet({ amount });
      
      // In production, this would redirect to payment gateway
      // For now, we'll simulate success
      setNotification({ 
        message: `Wallet funding initiated! ₦${amount}`, 
        type: 'success' 
      });
      
      setShowFundModal(false);
      setFundAmount('');
      fetchWallet();
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Funding failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    setNotification({ message: 'Referral code copied!', type: 'success' });
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
              <p className="text-gray-600">Manage your account settings</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-4 font-medium transition ${
                      activeTab === 'profile'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`px-6 py-4 font-medium transition ${
                      activeTab === 'security'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Security
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`px-6 py-4 font-medium transition ${
                      activeTab === 'wallet'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Wallet
                  </button>
                  <button
                    onClick={() => setActiveTab('referral')}
                    className={`px-6 py-4 font-medium transition ${
                      activeTab === 'referral'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    Referral
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <Save size={20} />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {activeTab === 'security' && (
                  <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                )}

                {activeTab === 'wallet' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                      <p className="text-blue-100 mb-2">Available Balance</p>
                      <h3 className="text-4xl font-bold mb-4">₦{wallet?.balance?.toLocaleString() || '0.00'}</h3>
                      <button
                        onClick={() => setShowFundModal(true)}
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                      >
                        Fund Wallet
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-bold mb-4">Payment Methods</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <span>Paystack</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <span>Bank Transfer</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'referral' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                      <h3 className="text-xl font-bold mb-4">Your Referral Code</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <code className="text-3xl font-mono font-bold flex-1">{user?.referralCode || 'N/A'}</code>
                        <button
                          onClick={copyReferralCode}
                          className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition"
                        >
                          <Copy size={24} />
                        </button>
                      </div>
                      <p className="text-green-100">
                        Share your referral code and earn commission on every transaction!
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-600 mb-2">Total Referrals</p>
                        <p className="text-3xl font-bold">0</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-600 mb-2">Total Earnings</p>
                        <p className="text-3xl font-bold">₦0</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showFundModal && (
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
              {[1000, 5000, 10000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setFundAmount(amount.toString())}
                  className="py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFundModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFundWallet}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;