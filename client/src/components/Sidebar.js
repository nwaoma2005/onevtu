import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Smartphone, Wifi, Tv, Zap, History, Settings, LogOut, Shield } from 'lucide-react';
import { clearAuth } from '../utils/auth';
import { authAPI } from '../services/api';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data.user);
      console.log('User loaded:', response.data.user); // Debug
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: Wallet, label: 'Dashboard' },
    { path: '/buy-airtime', icon: Smartphone, label: 'Buy Airtime' },
    { path: '/buy-data', icon: Wifi, label: 'Buy Data' },
    { path: '/cable-tv', icon: Tv, label: 'Cable TV' },
    { path: '/electricity', icon: Zap, label: 'Electricity' },
    { path: '/transactions', icon: History, label: 'Transactions' },
    { path: '/profile', icon: Settings, label: 'Profile' },
  ];

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setSidebarOpen(false)} 
      />
      
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center gap-2 p-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Wallet className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OneVTU
          </span>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Welcome back</p>
            <p className="font-semibold text-gray-800">{user.name}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-2 px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded">
                ADMIN
              </span>
            )}
          </div>
        )}

        <nav className="p-4 space-y-2">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Admin Panel Link - Only visible to admins */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition border-2 ${
                location.pathname === '/admin'
                  ? 'bg-yellow-400 text-black border-yellow-500 font-bold'
                  : 'text-yellow-600 border-yellow-400 hover:bg-yellow-50'
              }`}
            >
              <Shield size={20} />
              <span className="font-medium">Admin Panel</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition mt-4"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;