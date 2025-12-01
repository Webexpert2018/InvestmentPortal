'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function CompliancePage() {
  const pendingReviews = [
    { id: 1, user: 'John Smith', type: 'KYC Document', submitted: '2024-11-19', priority: 'high' },
    { id: 2, user: 'Sarah Johnson', type: 'Proof of Address', submitted: '2024-11-18', priority: 'medium' },
    { id: 3, user: 'Michael Brown', type: 'Identity Verification', submitted: '2024-11-18', priority: 'high' },
  ];

  const recentActions = [
    { id: 1, action: 'Approved KYC', user: 'Emily Davis', reviewer: 'Admin User', date: '2024-11-19' },
    { id: 2, action: 'Rejected Document', user: 'David Wilson', reviewer: 'Admin User', date: '2024-11-18' },
    { id: 3, action: 'Approved Transaction', user: 'Lisa Anderson', reviewer: 'Admin User', date: '2024-11-18' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Compliance</h1>
          <p className="text-gray-600 mt-2">Monitor and manage compliance requirements</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-500 mt-1">Documents awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved Today</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-gray-500 mt-1">Documents approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-gray-500 mt-1">Urgent reviews</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-gray-400" />
                    <div>
                      <div className="font-semibold">{review.user}</div>
                      <div className="text-sm text-gray-500">{review.type}</div>
                      <div className="text-xs text-gray-400">Submitted: {review.submitted}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={review.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                      {review.priority}
                    </Badge>
                    <Button size="sm" className="bg-orange-500">Review</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <div className="font-medium">{action.action}</div>
                    <div className="text-sm text-gray-500">User: {action.user}</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{action.reviewer}</div>
                    <div>{action.date}</div>
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
