"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Database, Home, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Original Dashboard',
      icon: Home,
      description: 'Demo dashboard with sample data'
    },
    {
      href: '/real-data-dashboard',
      label: 'Real Data Dashboard',
      icon: Database,
      description: 'Live analytics from actual RTO data'
    },
    {
      href: '/competitor-analysis',
      label: 'Competitor Analysis',
      icon: Target,
      description: 'Strategic benchmarking and market intelligence'
    },
    {
      href: '/forecasting',
      label: 'Market Forecasting',
      icon: TrendingUp,
      description: 'Predictive analytics and trend projections'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Two Wheeler Analytics</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`flex items-center space-x-2 ${
                        isActive 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.href === '/real-data-dashboard' && (
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                          Live Data
                        </Badge>
                      )}
                      {item.href === '/competitor-analysis' && (
                        <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800 text-xs">
                          New
                        </Badge>
                      )}
                      {item.href === '/forecasting' && (
                        <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 text-xs">
                          New
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-sm text-gray-500">
              Powered by real RTO data
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.href === '/real-data-dashboard' && (
                    <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800 text-xs">
                      Live
                    </Badge>
                  )}
                  {item.href === '/competitor-analysis' && (
                    <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-800 text-xs">
                      New
                    </Badge>
                  )}
                  {item.href === '/forecasting' && (
                    <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800 text-xs">
                      New
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 