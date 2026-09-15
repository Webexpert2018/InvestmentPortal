'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, FileText, CheckCircle2, Clock, Eye } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function DocumentSignaturesPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDocumentSignatureCampaigns();
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
      toast.error('Failed to load document signatures');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-1 font-goudy tracking-tight">Document Signatures</h1>
            <p className="text-gray-500 font-medium">Manage and track documents sent for signature.</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/document-signatures/new')}
            className="bg-[#2A6CB5] hover:bg-[#1F538D] text-white px-6 font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Send New Document
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A6CB5]"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No documents sent yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Send a document to investors to collect their signatures electronically.</p>
            <Button
              onClick={() => router.push('/dashboard/document-signatures/new')}
              className="bg-[#FFC63F] hover:bg-[#F1DD58] text-[#1F1F1F] px-6 font-bold shadow-sm transition-all"
            >
              Send Your First Document
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Accordion type="multiple" className="w-full">
              {campaigns.map((campaign) => (
                <AccordionItem key={campaign.id} value={campaign.id} className="border-b border-gray-100 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div className="bg-[#F0F4F8] p-3 rounded-lg text-[#2A6CB5]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{campaign.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Sent on {new Date(campaign.created_at).toLocaleDateString()} • {campaign.recipients.length} Recipients
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 bg-gray-50/50">
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-700 text-sm">Recipient Status</h4>
                        <a 
                          href={`${BASE_URL}/api/document-signatures/${campaign.id}/original-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[#2A6CB5] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Original Document
                        </a>
                      </div>
                      <table className="w-full text-sm text-left table-fixed">
                        <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 w-[25%]">Investor Name</th>
                            <th className="px-4 py-3 w-[35%]">Email</th>
                            <th className="px-4 py-3 w-[20%]">Status</th>
                            <th className="px-4 py-3 w-[20%] text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {campaign.recipients.map((recipient: any) => (
                            <tr key={recipient.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900 truncate">
                                {recipient.investor_name || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-gray-500 truncate">
                                {recipient.investor_email}
                              </td>
                              <td className="px-4 py-3">
                                {recipient.status === 'SIGNED' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Signed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3.5 h-3.5" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {recipient.status === 'SIGNED' ? (
                                  <a 
                                    href={`${BASE_URL}/api/document-signatures/${campaign.id}/signed-pdf/${recipient.investor_id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-[#2A6CB5] hover:text-[#1F538D] hover:bg-[#2A6CB5]/10"
                                  >
                                    View Signature
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Waiting...</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
