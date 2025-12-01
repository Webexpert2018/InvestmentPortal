'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Filter, UserPlus, MoreVertical, Mail, Phone } from 'lucide-react';

export default function UserManagementPage() {
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const users = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      role: 'investor',
      status: 'active',
      portfolioValue: 127500,
      createdAt: '2024-06-15',
      lastLogin: '2024-11-19',
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '+1 (555) 234-5678',
      role: 'investor',
      status: 'active',
      portfolioValue: 85300,
      createdAt: '2024-07-20',
      lastLogin: '2024-11-18',
    },
    {
      id: '3',
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'mbrown@example.com',
      phone: '+1 (555) 345-6789',
      role: 'investor',
      status: 'pending_verification',
      portfolioValue: 0,
      createdAt: '2024-11-18',
      lastLogin: '2024-11-18',
    },
    {
      id: '4',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@example.com',
      phone: '+1 (555) 456-7890',
      role: 'investor',
      status: 'active',
      portfolioValue: 234500,
      createdAt: '2024-05-10',
      lastLogin: '2024-11-19',
    },
    {
      id: '5',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'dwilson@example.com',
      phone: '+1 (555) 567-8901',
      role: 'compliance',
      status: 'active',
      portfolioValue: 0,
      createdAt: '2024-04-01',
      lastLogin: '2024-11-19',
    },
    {
      id: '6',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.a@example.com',
      phone: '+1 (555) 678-9012',
      role: 'investor',
      status: 'suspended',
      portfolioValue: 45600,
      createdAt: '2024-08-15',
      lastLogin: '2024-10-20',
    },
  ];

  const stats = {
    totalUsers: 156,
    activeUsers: 142,
    pendingVerification: 8,
    suspended: 6,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-700';
      case 'suspended':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'compliance':
        return 'bg-blue-100 text-blue-700';
      case 'investor':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-2">Manage platform users and permissions</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">All registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Users
              </CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-gray-500 mt-1">Verified and active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending
              </CardTitle>
              <Users className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingVerification}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Suspended
              </CardTitle>
              <Users className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspended}</div>
              <p className="text-xs text-gray-500 mt-1">Suspended accounts</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>All Users</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_verification">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="rounded-lg border p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-semibold text-lg">{user.firstName} {user.lastName}</div>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{user.phone}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Portfolio: </span>
                            <span className="font-medium">${user.portfolioValue.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Login: </span>
                            <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Registered: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm" className="bg-orange-500 text-white hover:bg-orange-600">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
