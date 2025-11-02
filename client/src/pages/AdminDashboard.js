import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ limit: 100 })
      ]);
      
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Load error:', error);
      if (error.response?.status === 403) {
        alert('Access denied. Admin only.');
        navigate('/dashboard');
      }
    }
  };

  const handleCreditWallet = async () => {
    if (!selectedUser || !amount) {
      alert('Select user and enter amount');
      return;
    }

    setLoading(true);
    try {
      await adminAPI.creditWallet({
        userId: selectedUser._id,
        amount: parseFloat(amount),
        note
      });
      
      alert(`₦${amount} credited to ${selectedUser.name}`);
      setAmount('');
      setNote('');
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Credit failed');
    } finally {
      setLoading(false);
    }
  };

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold">{stats.totalTransactions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Credit Wallet */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Credit User Wallet</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2">Select User</label>
            <select
              className="w-full p-3 border rounded"
              onChange={(e) => setSelectedUser(users.find(u => u._id === e.target.value))}
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} - {user.email} (₦{user.walletBalance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2">Amount</label>
            <input
              type="number"
              className="w-full p-3 border rounded"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-2">Note (Optional)</label>
            <input
              type="text"
              className="w-full p-3 border rounded"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for credit"
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={handleCreditWallet}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Credit Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-right p-3">Balance</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.phone}</td>
                  <td className="p-3 text-right">₦{user.walletBalance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;