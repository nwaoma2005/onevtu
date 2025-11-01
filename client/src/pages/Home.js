import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Wifi, Tv, Zap, GraduationCap, Wallet, Users, Clock, Shield } from 'lucide-react';
import Header from '../components/Header';

const Home = () => {
  const navigate = useNavigate();

  const services = [
    { icon: Smartphone, title: 'Airtime Top-Up', desc: 'Instant airtime for all networks', color: 'from-blue-500 to-blue-600' },
    { icon: Wifi, title: 'Data Bundles', desc: 'Affordable data plans for all networks', color: 'from-purple-500 to-purple-600' },
    { icon: Tv, title: 'Cable TV', desc: 'DSTV, GOTV, StarTimes subscriptions', color: 'from-pink-500 to-pink-600' },
    { icon: Zap, title: 'Electricity Bills', desc: 'Pay electricity bills instantly', color: 'from-yellow-500 to-orange-600' },
    { icon: GraduationCap, title: 'Education', desc: 'WAEC, NECO, JAMB pins', color: 'from-green-500 to-green-600' },
    { icon: Wallet, title: 'Bulk SMS', desc: 'Send bulk SMS at great rates', color: 'from-indigo-500 to-indigo-600' },
  ];

  const stats = [
    { icon: Users, value: '50K+', label: 'Active Users' },
    { icon: Clock, value: '99.9%', label: 'Uptime' },
    { icon: Shield, value: '100%', label: 'Secure' },
  ];

  const steps = [
    { step: '01', title: 'Create Account', desc: 'Sign up in seconds with your email or phone number' },
    { step: '02', title: 'Fund Wallet', desc: 'Add money to your wallet using any payment method' },
    { step: '03', title: 'Start Buying', desc: 'Purchase airtime, data, and pay bills instantly' },
  ];

  return (
    <div>
      <Header />

      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              One Platform for All Your Top-Ups
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Buy airtime, data, pay bills and more in seconds. Fast, reliable, and secure.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-2xl transition transform hover:scale-105"
            >
              Start Now - It's Free
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-center">
                <stat.icon className="mx-auto mb-3" size={40} />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 text-lg">Everything you need in one place</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-xl transition group cursor-pointer">
                <div className={`w-14 h-14 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <service.icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg">Get started in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-4 opacity-20">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="text-white" size={18} />
                </div>
                <span className="text-xl font-bold">OneVTU</span>
              </div>
              <p className="text-gray-400">Your trusted partner for all virtual top-up services.</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Airtime</li>
                <li>Data Bundles</li>
                <li>Cable TV</li>
                <li>Electricity</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Contact</li>
                <li>FAQ</li>
                <li>Terms</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Live Chat</li>
                <li>WhatsApp</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 OneVTU. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;