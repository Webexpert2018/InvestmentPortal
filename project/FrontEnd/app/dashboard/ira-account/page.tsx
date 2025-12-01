'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, DollarSign, Shield, CheckCircle, Clock, FileText } from 'lucide-react';

export default function IRAAccountPage() {
  const iraAccount = {
    accountNumber: 'IRA-2024-8456',
    accountType: 'Self-Directed IRA',
    status: 'active',
    openedDate: '2024-06-15',
    custodian: 'Bitcoin IRA Custodial Services',
    contributionLimit: 7000,
    contributedThisYear: 4500,
    totalContributions: 90910.50,
    currentValue: 127500.00,
    gain: 36589.50,
  };

  const contributions = [
    { year: 2024, amount: 4500, limit: 7000, date: '2024-11-18' },
    { year: 2023, amount: 6500, limit: 6500, date: '2023-12-20' },
    { year: 2022, amount: 6000, limit: 6000, date: '2022-11-15' },
  ];

  const documents = [
    { name: 'IRA Application Form', status: 'approved', date: '2024-06-15', type: 'application' },
    { name: 'Beneficiary Designation', status: 'approved', date: '2024-06-15', type: 'beneficiary' },
    { name: 'Investment Direction', status: 'approved', date: '2024-11-18', type: 'investment' },
    { name: 'Annual Statement 2023', status: 'approved', date: '2024-01-15', type: 'statement' },
  ];

  const taxBenefits = [
    { title: 'Tax-Deferred Growth', description: 'Your investments grow tax-free until withdrawal' },
    { title: 'Annual Contributions', description: 'Contribute up to $7,000 per year (2024 limit)' },
    { title: 'Catch-Up Contributions', description: 'Additional $1,000 if you are 50 or older' },
    { title: 'Required Distributions', description: 'RMDs begin at age 73' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">IRA Account</h1>
          <p className="text-gray-600 mt-2">Manage your Self-Directed IRA and contributions</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account Overview</CardTitle>
                <Badge className="bg-green-100 text-green-700">
                  {iraAccount.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Account Number</div>
                      <div className="font-semibold">{iraAccount.accountNumber}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Account Type</div>
                      <div className="font-semibold">{iraAccount.accountType}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Opened Date</div>
                      <div className="font-semibold">{new Date(iraAccount.openedDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="text-sm text-gray-600 mb-1">Current Value</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${iraAccount.currentValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Gain</div>
                    <div className="text-2xl font-bold text-green-600">
                      +${iraAccount.gain.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Custodian</div>
                <div className="font-semibold">{iraAccount.custodian}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2024 Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Contributed</span>
                    <span className="font-semibold">${iraAccount.contributedThisYear.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Limit</span>
                    <span className="font-semibold">${iraAccount.contributionLimit.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full"
                      style={{ width: `${(iraAccount.contributedThisYear / iraAccount.contributionLimit) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    ${(iraAccount.contributionLimit - iraAccount.contributedThisYear).toLocaleString()} remaining
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Make Contribution
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contributions.map((contribution) => (
                  <div key={contribution.year} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <div className="font-semibold">Tax Year {contribution.year}</div>
                      <div className="text-sm text-gray-500">{new Date(contribution.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${contribution.amount.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">of ${contribution.limit.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {taxBenefits.map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{benefit.title}</div>
                      <div className="text-sm text-gray-500">{benefit.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-gray-500">{new Date(doc.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">IRS Compliance & Regulations</h3>
                <p className="text-sm text-gray-700">
                  Your IRA account is subject to IRS regulations. Contributions are limited to $7,000 per year (2024) with an additional
                  $1,000 catch-up contribution if you are 50 or older. Early withdrawals before age 59½ may be subject to penalties.
                  Required Minimum Distributions (RMDs) begin at age 73.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Learn More About IRA Rules
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
