import React from 'react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user session/token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Settings</h1>

      {/* User Info Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Account Information</h2>
        <div className="space-y-3 text-gray-600">
          <p><span className="font-medium">Name:</span> Rakesh Maurya</p>
          <p><span className="font-medium">Role:</span> Administrator</p>
          <p><span className="font-medium">Email:</span> admin@bookleaf.com</p>
        </div>
      </div>

      {/* AI Preferences Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">AI Preferences</h2>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">AI Auto-Drafting</span>
          <input type="checkbox" className="toggle-switch" defaultChecked />
        </div>
      </div>

      {/* Logout Section */}
      <div className="pt-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Logout Securely
        </button>
      </div>
    </div>
  );
};

export default Settings;