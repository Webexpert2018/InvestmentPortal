'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, FileText, Settings, Key } from 'lucide-react';

export default function AuditLogsPage() {
  const logs = [
    { id: 1, action: 'User Login', user: 'john.smith@example.com', ip: '192.168.1.1', timestamp: '2024-11-19 10:30:00', type: 'auth', status: 'success' },
    { id: 2, action: 'Document Upload', user: 'sarah.j@example.com', ip: '192.168.1.2', timestamp: '2024-11-19 10:25:00', type: 'document', status: 'success' },
    { id: 3, action: 'Failed Login Attempt', user: 'unknown@test.com', ip: '10.0.0.15', timestamp: '2024-11-19 10:20:00', type: 'auth', status: 'failed' },
    { id: 4, action: 'Settings Updated', user: 'admin@bitcoinira.com', ip: '192.168.1.10', timestamp: '2024-11-19 10:15:00', type: 'settings', status: 'success' },
    { id: 5, action: 'User Registration', user: 'mbrown@example.com', ip: '192.168.1.5', timestamp: '2024-11-19 10:10:00', type: 'auth', status: 'success' },
    { id: 6, action: 'Transaction Created', user: 'emily.davis@example.com', ip: '192.168.1.8', timestamp: '2024-11-19 10:05:00', type: 'transaction', status: 'success' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return <Key className="h-5 w-5 text-blue-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'settings':
        return <Settings className="h-5 w-5 text-gray-500" />;
      case 'transaction':
        return <User className="h-5 w-5 text-green-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600 mt-2">Track all system activities and user actions</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Failed Logins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Document Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-gray-500 mt-1">Uploads & verifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-gray-500 mt-1">Configuration changes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(log.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="font-semibold">{log.action}</div>
                      <Badge className={log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-500">User: </span>
                        {log.user}
                      </div>
                      <div>
                        <span className="text-gray-500">IP: </span>
                        {log.ip}
                      </div>
                      <div>
                        <span className="text-gray-500">Time: </span>
                        {log.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
