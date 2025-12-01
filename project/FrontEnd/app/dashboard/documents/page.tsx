'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await apiClient.getMyDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      verified: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Document Vault</h1>
            <p className="text-gray-600 mt-2">Upload and manage your KYC/AML documents</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-2">Upload New Document</p>
              <p className="text-xs text-gray-500 text-center mb-4">
                Supported: PDF, JPG, PNG (Max 10MB)
              </p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </CardContent>
          </Card>

          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {doc.documentType.replace('_', ' ').toUpperCase()}
                </CardTitle>
                {getStatusIcon(doc.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <FileText className="mr-2 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 truncate">{doc.fileName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {doc.rejectionReason && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {doc.rejectionReason}
                    </p>
                  )}
                  <Button variant="outline" size="sm" className="w-full">
                    View Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Upload your identity documents to get verified
              </p>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Upload className="mr-2 h-4 w-4" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Government-issued ID</p>
                  <p className="text-sm text-gray-500">Passport, driver's license, or national ID</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Proof of Address</p>
                  <p className="text-sm text-gray-500">Utility bill or bank statement (within 3 months)</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">IRA Certificate</p>
                  <p className="text-sm text-gray-500">Your IRA account documentation</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
