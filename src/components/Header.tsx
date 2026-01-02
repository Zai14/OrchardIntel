import React, { useState } from 'react';
import { Apple, Leaf, Stethoscope, User, LogOut, MoreVertical, Database, Brain } from 'lucide-react';

interface HeaderProps {
  user?: any;
  onSignOut?: () => void;
  onMenuItemClick?: (section: 'dataset' | 'train') => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSignOut, onMenuItemClick }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (section: 'dataset' | 'train') => {
    if (onMenuItemClick) {
      onMenuItemClick(section);
    }
    setShowMenu(false);
  };

  return (
    <header className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1" />
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-100">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>

              {/* ✅ THREE DOTS MENU */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-green-500 rounded-lg transition-colors duration-200"
                >
                  <MoreVertical className="w-5 h-5 text-white" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <button
                      onClick={() => handleMenuClick('dataset')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-200 text-gray-700"
                    >
                      <Database className="w-4 h-4" />
                      <span className="text-sm font-medium">Dataset Management</span>
                    </button>

                    <button
                      onClick={() => handleMenuClick('train')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-2 border-b border-gray-200 text-gray-700"
                    >
                      <Brain className="w-4 h-4" />
                      <span className="text-sm font-medium">Model Training</span>
                    </button>

                    <button
                      onClick={onSignOut}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-2 text-red-600 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="relative">
            <Apple className="w-10 h-10 text-white" />
            <Leaf className="w-5 h-5 text-green-200 absolute -top-1 -right-1" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            OrchardIntel
          </h1>
          <Stethoscope className="w-8 h-8 text-green-200" />
        </div>
        
        <p className="text-center text-green-100 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          AI-powered React app for apple leaf disease detection with dataset management, model training simulation, Planet map viewer for climate risk analysis
        </p>
        
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-6 text-sm text-green-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span>{user ? 'Real CNN Training' : 'Demo Mode'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>6 Disease Classes</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span>{user ? 'Cloud Storage' : 'Instant Results'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};