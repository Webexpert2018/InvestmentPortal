'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Briefcase, DollarSign, Users, Calendar, Info, ShieldCheck, Plus, X, Loader2, Layers, Split, ArrowRight, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function OldFundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [fund, setFund] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'investors' | 'distributions' | 'waterfalls'>('investors');
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [actionBatchId, setActionBatchId] = useState<number | null>(null);
  const [selectedBatchData, setSelectedBatchData] = useState<any[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState<number | null>(null);
  const [selectedInvestorData, setSelectedInvestorData] = useState<any>(null);
  const [isInvestorLoading, setIsInvestorLoading] = useState(false);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);

  // Waterfall states
  const [waterfallsList, setWaterfallsList] = useState<any[]>([]);
  const [selectedWaterfall, setSelectedWaterfall] = useState<any>(null);
  const [showAddWaterfallModal, setShowAddWaterfallModal] = useState(false);
  const [waterfallName, setWaterfallName] = useState('');
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleSection, setRuleSection] = useState('');
  const [selectedRuleTemplate, setSelectedRuleTemplate] = useState<string | null>(null);
  const [draftRule, setDraftRule] = useState<any>(null);

  const handleAddWaterfall = async (addRuleImmediately: boolean = true) => {
    if (!waterfallName.trim()) {
      toast.error('Please enter a waterfall name');
      return;
    }
    try {
      const fundId = parseInt(params.id as string, 10);
      const newWf = await apiClient.createOldFundWaterfall(fundId, { name: waterfallName.trim() });
      const updatedList = [...waterfallsList, newWf];
      setWaterfallsList(updatedList);
      setSelectedWaterfall(newWf);
      setShowAddWaterfallModal(false);
      setWaterfallName('');
      toast.success('Waterfall added successfully');
      if (addRuleImmediately) {
        setRuleName('');
        setRuleSection('');
        setSelectedRuleTemplate(null);
        setShowAddRuleModal(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create waterfall');
    }
  };

  const handleRemoveWaterfall = async (waterfallId: string) => {
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.deleteOldFundWaterfall(fundId, parseInt(waterfallId, 10));
      const filtered = waterfallsList.filter(w => w.id !== waterfallId);
      setWaterfallsList(filtered);
      if (selectedWaterfall?.id === waterfallId) {
        setSelectedWaterfall(null);
      }
      toast.success('Waterfall deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete waterfall');
    }
  };

  const handleAddRule = () => {
    if (!ruleName.trim()) {
      toast.error('Please enter a rule name');
      return;
    }
    if (!selectedRuleTemplate) {
      toast.error('Please select a template for your rule');
      return;
    }
    const isSplitOrHurdle = selectedRuleTemplate === 'Splits Template' || selectedRuleTemplate === 'Splits with Hurdles Template';
    const newRule = {
      id: 'draft_' + Date.now().toString(),
      name: ruleName.trim(),
      section: ruleSection.trim(),
      template: selectedRuleTemplate,
      splits: isSplitOrHurdle ? [
        { id: 'draft_split_1', percentage: '', classes: ['gp'], method: '', subType: '' },
        { id: 'draft_split_2', percentage: '', classes: ['gp fund'], method: '', subType: '' }
      ] : [],
      hurdles: selectedRuleTemplate === 'Splits with Hurdles Template' ? [
        {
          id: 'draft_hurdle_1',
          classes: ['gp'],
          type: '',
          percentage: '',
          amount: '',
          ofClasses: ['gp'],
          asSubTypes: [],
          grossUpCashflow: false
        }
      ] : []
    };
    setDraftRule(newRule);
    setShowAddRuleModal(false);
    setRuleName('');
    setRuleSection('');
    setSelectedRuleTemplate(null);
    toast.info(`Configure values for "${newRule.name}" below and click "Save & Add Rule" to finalize.`);
  };

  const handleSaveAndAddRule = async () => {
    if (!draftRule || !selectedWaterfall) return;
    const isSplitOrHurdle = draftRule.template === 'Splits Template' || draftRule.template === 'Splits with Hurdles Template';
    if (isSplitOrHurdle && draftRule.splits) {
      for (let i = 0; i < draftRule.splits.length; i++) {
        const s = draftRule.splits[i];
        if (s.percentage === undefined || s.percentage === '' || isNaN(parseFloat(s.percentage))) {
          toast.error(`Please enter a valid percentage for split row #${i + 1}`);
          return;
        }
        if (!s.method) {
          toast.error(`Please select a method for split row #${i + 1}`);
          return;
        }
        if (!s.subType) {
          toast.error(`Please select a distribution sub-type for split row #${i + 1}`);
          return;
        }
      }
    }

    if (draftRule.template === 'Splits with Hurdles Template' && draftRule.hurdles) {
      for (let i = 0; i < draftRule.hurdles.length; i++) {
        const h = draftRule.hurdles[i];
        if (!h.classes || h.classes.length === 0) {
          toast.error(`Please select receiving classes for hurdle row #${i + 1}`);
          return;
        }
        if (!h.type) {
          toast.error(`Please select a hurdle type in row #${i + 1}`);
          return;
        }
        if (h.type === 'an IRR of...' || h.type === 'a Preferred Return of...' || h.type === 'a percentage equal to') {
          if (!h.percentage || isNaN(parseFloat(h.percentage))) {
            toast.error(`Please enter a valid percentage for hurdle row #${i + 1}`);
            return;
          }
        }
        if (h.type === 'an Equity Multiple of...') {
          if (!h.amount || isNaN(parseFloat(h.amount))) {
            toast.error(`Please enter a valid equity multiple number for hurdle row #${i + 1}`);
            return;
          }
        }
        if (h.type === 'a percentage equal to') {
          if (!h.ofClasses || h.ofClasses.length === 0) {
            toast.error(`Please select "of class(es)" for hurdle row #${i + 1}`);
            return;
          }
          if (!h.asSubTypes || h.asSubTypes.length === 0) {
            toast.error(`Please select at least one distribution sub-type check for hurdle row #${i + 1}`);
            return;
          }
        }
      }
    }

    try {
      const fundId = parseInt(params.id as string, 10);
      const savedRule = await apiClient.createOldFundWaterfallRule(fundId, parseInt(selectedWaterfall.id, 10), {
        name: draftRule.name,
        section: draftRule.section,
        template: draftRule.template,
        splits: draftRule.splits,
        hurdles: draftRule.hurdles
      });

      const updatedRules = [...(selectedWaterfall.rules || []), savedRule];
      const updatedWf = { ...selectedWaterfall, rules: updatedRules };
      setSelectedWaterfall(updatedWf);
      setWaterfallsList(waterfallsList.map(w => w.id === updatedWf.id ? updatedWf : w));
      setDraftRule(null);
      toast.success(`Rule "${savedRule.name}" added successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rule.');
    }
  };

  const handleSaveRuleChanges = async (rule: any) => {
    if (!selectedWaterfall) return;
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.updateOldFundWaterfallRule(fundId, parseInt(selectedWaterfall.id, 10), parseInt(rule.id, 10), {
        name: rule.name,
        section: rule.section,
        template: rule.template,
        splits: rule.splits,
        hurdles: rule.hurdles
      });
      toast.success(`Rule "${rule.name}" updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rule changes.');
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    if (!selectedWaterfall) return;
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.deleteOldFundWaterfallRule(fundId, parseInt(selectedWaterfall.id, 10), parseInt(ruleId, 10));
      const updatedRules = selectedWaterfall.rules.filter((r: any) => r.id !== ruleId);
      const updatedWf = { ...selectedWaterfall, rules: updatedRules };
      setSelectedWaterfall(updatedWf);
      setWaterfallsList(waterfallsList.map(w => w.id === updatedWf.id ? updatedWf : w));
      toast.success('Rule removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove rule.');
    }
  };

  const handleUpdateSplit = (ruleId: string, splitId: string, field: string, value: any) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentSplits = draftRule.splits || [];
      const updatedSplits = currentSplits.map((split: any) => {
        if (split.id !== splitId) return split;
        return { ...split, [field]: value };
      });
      setDraftRule({ ...draftRule, splits: updatedSplits });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentSplits = rule.splits || [];
      const updatedSplits = currentSplits.map((split: any) => {
        if (split.id !== splitId) return split;
        return { ...split, [field]: value };
      });
      return { ...rule, splits: updatedSplits };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };

  const handleSelectSplitClass = (ruleId: string, splitId: string, cls: string) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentSplits = draftRule.splits || [];
      const updatedSplits = currentSplits.map((split: any) => {
        if (split.id !== splitId) return split;
        return { ...split, classes: [cls] };
      });
      setDraftRule({ ...draftRule, splits: updatedSplits });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentSplits = rule.splits || [];
      const updatedSplits = currentSplits.map((split: any) => {
        if (split.id !== splitId) return split;
        return { ...split, classes: [cls] };
      });
      return { ...rule, splits: updatedSplits };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };

  const handleAddSplitRow = (ruleId: string) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentSplits = draftRule.splits || [];
      const newSplit = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
        percentage: '',
        classes: [],
        method: '',
        subType: ''
      };
      setDraftRule({ ...draftRule, splits: [...currentSplits, newSplit] });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentSplits = rule.splits || [];
      const newSplit = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
        percentage: '',
        classes: [],
        method: '',
        subType: ''
      };
      return { ...rule, splits: [...currentSplits, newSplit] };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };

  const handleRemoveSplitRow = (ruleId: string, splitId: string) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentSplits = draftRule.splits || [];
      setDraftRule({ ...draftRule, splits: currentSplits.filter((s: any) => s.id !== splitId) });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentSplits = rule.splits || [];
      return { ...rule, splits: currentSplits.filter((s: any) => s.id !== splitId) };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };

  const handleUpdateHurdle = (ruleId: string, hurdleId: string, field: string, value: any) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentHurdles = draftRule.hurdles || [];
      const updatedHurdles = currentHurdles.map((hurdle: any) => {
        if (hurdle.id !== hurdleId) return hurdle;
        return { ...hurdle, [field]: value };
      });
      setDraftRule({ ...draftRule, hurdles: updatedHurdles });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentHurdles = rule.hurdles || [];
      const updatedHurdles = currentHurdles.map((hurdle: any) => {
        if (hurdle.id !== hurdleId) return hurdle;
        return { ...hurdle, [field]: value };
      });
      return { ...rule, hurdles: updatedHurdles };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };

  const handleSelectHurdleClass = (ruleId: string, hurdleId: string, field: 'classes' | 'ofClasses', cls: string) => {
    handleUpdateHurdle(ruleId, hurdleId, field, [cls]);
  };

  const handleToggleHurdleSubType = (ruleId: string, hurdleId: string, subType: string) => {
    const getTargetRule = () => {
      if (draftRule && draftRule.id === ruleId) return draftRule;
      return selectedWaterfall?.rules?.find((r: any) => r.id === ruleId);
    };
    const rule = getTargetRule();
    if (!rule) return;
    const currentHurdles = rule.hurdles || [];
    const targetHurdle = currentHurdles.find((h: any) => h.id === hurdleId);
    if (!targetHurdle) return;

    const currentList = targetHurdle.asSubTypes || [];
    const newList = currentList.includes(subType)
      ? currentList.filter((t: string) => t !== subType)
      : [...currentList, subType];

    handleUpdateHurdle(ruleId, hurdleId, 'asSubTypes', newList);
  };

  const handleAddHurdleRow = (ruleId: string) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentHurdles = draftRule.hurdles || [];
      const newHurdle = {
        id: 'draft_hurdle_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
        classes: ['gp'],
        type: '',
        percentage: '',
        amount: '',
        ofClasses: ['gp'],
        asSubTypes: [],
        grossUpCashflow: false
      };
      setDraftRule({ ...draftRule, hurdles: [...currentHurdles, newHurdle] });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentHurdles = rule.hurdles || [];
      const newHurdle = {
        id: 'draft_hurdle_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
        classes: ['gp'],
        type: '',
        percentage: '',
        amount: '',
        ofClasses: ['gp'],
        asSubTypes: [],
        grossUpCashflow: false
      };
      return { ...rule, hurdles: [...currentHurdles, newHurdle] };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };

  const handleRemoveHurdleRow = (ruleId: string, hurdleId: string) => {
    if (draftRule && draftRule.id === ruleId) {
      const currentHurdles = draftRule.hurdles || [];
      setDraftRule({ ...draftRule, hurdles: currentHurdles.filter((h: any) => h.id !== hurdleId) });
      return;
    }

    if (!selectedWaterfall?.rules) return;
    const updatedRules = selectedWaterfall.rules.map((rule: any) => {
      if (rule.id !== ruleId) return rule;
      const currentHurdles = rule.hurdles || [];
      return { ...rule, hurdles: currentHurdles.filter((h: any) => h.id !== hurdleId) };
    });
    const updatedWf = { ...selectedWaterfall, rules: updatedRules };
    setSelectedWaterfall(updatedWf);
    setWaterfallsList(waterfallsList.map(wf => wf.id === updatedWf.id ? updatedWf : wf));
  };


  // Add distribution batch state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distributionType, setDistributionType] = useState('Available Cash');
  const [batchDescription, setBatchDescription] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchPayDate, setBatchPayDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [sendMethod, setSendMethod] = useState('Check');

  // Edit distribution batch state
  const [editDistributionType, setEditDistributionType] = useState('Available Cash');
  const [editBatchDescription, setEditBatchDescription] = useState('');
  const [editDashboardDescription, setEditDashboardDescription] = useState('');
  const [editPeriodStartDate, setEditPeriodStartDate] = useState('');
  const [editBatchEndDate, setEditBatchEndDate] = useState('');
  const [editBatchPayDate, setEditBatchPayDate] = useState('');
  const [editTotalAmount, setEditTotalAmount] = useState('');
  const [editSendMethod, setEditSendMethod] = useState('Check');
  const [pendingBatchData, setPendingBatchData] = useState<any[]>([]);

  const calculateUnpaidPref = () => {
    if (!fund || !periodStartDate || !batchEndDate) {
      toast.error('Please specify start and end dates first.');
      return;
    }

    try {
      const start = new Date(periodStartDate);
      const end = new Date(batchEndDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        toast.error('Invalid date format.');
        return;
      }

      if (end < start) {
        toast.error('End date cannot be before start date.');
        return;
      }

      // Annualized preferred return calculation: 8% of total capital
      const totalCapitalNum = parseFloat(fund.totalCapital?.replace(/[\$,]/g, '')) || 0;
      const msDiff = end.getTime() - start.getTime();
      const daysDiff = msDiff / (1000 * 60 * 60 * 24);

      const unpaidPrefVal = totalCapitalNum * 0.08 * (daysDiff / 365);

      setTotalAmount(unpaidPrefVal.toFixed(2));
      toast.success(`Calculated 8% annualized preferred return: $${unpaidPrefVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${Math.round(daysDiff)} days.`);
    } catch (err: any) {
      toast.error(err.message || 'Error calculating preferred return.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributionType || !periodStartDate || !batchEndDate || !batchPayDate || !totalAmount) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Total distribution amount must be a positive number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      const res = await apiClient.createOldFundDistribution(fundId, {
        distributionType,
        batchDescription,
        dashboardDescription,
        periodStartDate,
        batchEndDate,
        batchPayDate,
        totalAmount: amt,
        sendMethod
      });

      toast.success('Distribution batch added successfully.');
      setIsAddModalOpen(false);

      // Reset form
      setDistributionType('Available Cash');
      setBatchDescription('');
      setDashboardDescription('');
      setPeriodStartDate('');
      setBatchEndDate('');
      setBatchPayDate('');
      setTotalAmount('');
      setSendMethod('Check');

      // Refresh fund details
      await fetchOldFundDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add distribution batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvestorClick = async (profileId: number) => {
    setSelectedInvestorId(profileId);
    setIsInvestorLoading(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      const data = await apiClient.getOldFundInvestor(fundId, profileId);
      setSelectedInvestorData(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch investor details');
    } finally {
      setIsInvestorLoading(false);
    }
  };

  const handleBatchClick = async (batchId: number) => {
    // Don't navigate into Pending Approval batches — they are not yet processed
    const batch = fund?.distributions?.find((d: any) => Number(d.distributionBatchId) === Number(batchId));

    setSelectedBatchId(batchId);
    setIsBatchLoading(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      const data = await apiClient.getOldFundDistributionBatch(fundId, batchId);
      setSelectedBatchData(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch batch distributions');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleApproveBatch = async () => {
    if (selectedBatchId === null) return;
    setIsSubmitting(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.approveOldFundDistribution(fundId, selectedBatchId);
      toast.success('Distribution batch approved successfully.');

      // Refresh details
      await fetchOldFundDetails();
      // Re-fetch batch breakdown
      const data = await apiClient.getOldFundDistributionBatch(fundId, selectedBatchId);
      setSelectedBatchData(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve distribution batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleOpenEditModal = () => {
    if (selectedBatchId === null) return;
    setActionBatchId(selectedBatchId);
    const selectedBatchInfo = fund?.distributions?.find(
      (d: any) => Number(d.distributionBatchId) === Number(selectedBatchId)
    );
    if (!selectedBatchInfo) return;

    setEditDistributionType(selectedBatchInfo.distributionType || 'Available Cash');
    setEditBatchDescription(selectedBatchInfo.batchDescription || '');
    setEditDashboardDescription(selectedBatchInfo.dashboardDescription || '');
    setEditPeriodStartDate(formatInputDate(selectedBatchInfo.periodStartDate));
    setEditBatchEndDate(formatInputDate(selectedBatchInfo.periodEndDate));
    setEditBatchPayDate(formatInputDate(selectedBatchInfo.payDate));

    // format total amount: clean dollar signs/commas
    const cleanAmount = selectedBatchInfo.totalAmount?.replace(/[\$,]/g, '') || '';
    setEditTotalAmount(cleanAmount);
    setEditSendMethod(selectedBatchInfo.sendMethod || 'Check');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDistributionType || !editPeriodStartDate || !editBatchEndDate || !editBatchPayDate || !editTotalAmount) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const amt = parseFloat(editTotalAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Total distribution amount must be a positive number.');
      return;
    }

    const targetId = actionBatchId ?? selectedBatchId;
    if (targetId === null) return;

    setIsSubmitting(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.updateOldFundDistribution(fundId, targetId, {
        distributionType: editDistributionType,
        batchDescription: editBatchDescription,
        dashboardDescription: editDashboardDescription,
        periodStartDate: editPeriodStartDate,
        batchEndDate: editBatchEndDate,
        batchPayDate: editBatchPayDate,
        totalAmount: amt,
        sendMethod: editSendMethod
      });

      toast.success('Distribution batch updated successfully.');
      setIsEditModalOpen(false);
      setActionBatchId(null);

      // Refresh details and batch data
      await fetchOldFundDetails();
      if (selectedBatchId !== null) {
        const data = await apiClient.getOldFundDistributionBatch(fundId, selectedBatchId);
        setSelectedBatchData(data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update distribution batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBatch = () => {
    if (selectedBatchId !== null) setActionBatchId(selectedBatchId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBatch = async () => {
    const targetId = actionBatchId ?? selectedBatchId;
    if (targetId === null) return;
    setIsSubmitting(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.deleteOldFundDistribution(fundId, targetId);
      toast.success('Distribution batch deleted successfully.');

      // Go back to batch list
      setSelectedBatchId(null);
      setSelectedBatchData([]);
      setActionBatchId(null);
      setIsDeleteModalOpen(false);

      // Refresh details
      await fetchOldFundDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject distribution batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendForApproval = async () => {
    if (selectedBatchId === null) return;
    setIsSubmitting(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      await apiClient.submitOldFundDistribution(fundId, selectedBatchId);
      toast.success('Distribution batch sent for approval.');

      // Refresh details
      await fetchOldFundDetails();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send batch for approval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchOldFundDetails();
    }
  }, [params.id]);

  const fetchOldFundWaterfalls = async (fundId: number) => {
    try {
      const wfs = await apiClient.getOldFundWaterfalls(fundId);
      setWaterfallsList(wfs || []);
      if (selectedWaterfall) {
        const updatedSelected = wfs?.find((w: any) => w.id === selectedWaterfall.id);
        setSelectedWaterfall(updatedSelected || null);
      }
    } catch (error) {
      console.error('Error fetching waterfalls:', error);
    }
  };

  const fetchOldFundDetails = async () => {
    setIsLoading(true);
    try {
      const fundId = parseInt(params.id as string, 10);
      if (isNaN(fundId)) {
        throw new Error('Invalid fund ID');
      }
      const data = await apiClient.getOldFundById(fundId);
      setFund(data);

      await fetchOldFundWaterfalls(fundId);

      const pending = data.distributions?.find((d: any) => d.status === '2' || d.status === 'Pending for Approval');
      if (pending) {
        const batchData = await apiClient.getOldFundDistributionBatch(fundId, pending.distributionBatchId);
        setPendingBatchData(batchData);
      } else {
        setPendingBatchData([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch old fund details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const yy = String(date.getUTCFullYear()).substring(2);
      return `${mm}/${dd}/${yy}`;
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'OF';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!fund) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button
            onClick={() => router.push('/dashboard/funds')}
            className="mb-4 flex items-center gap-2 text-gray-600 font-semibold"
          >
            <ChevronLeft className="h-5 w-5" /> Back to Funds
          </button>
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
            <p className="text-gray-500 font-medium">Old platform fund not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 bg-[#F9FAFB] min-h-screen">
        {/* Header navigation */}
        <div className="mb-8">
          <div className="mb-4">
            <button
              onClick={() => router.push('/dashboard/funds')}
              className="p-1.5 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200 group flex items-center gap-1.5 w-fit"
              title="Back to Funds"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-semibold text-[#1F3B6E] pr-2">
                Back to Funds
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight truncate font-goudy">
                {fund.projectName}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Old Platform Fund &bull; Historical Record</p>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left / Main Section (Col span 2) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Overview / Banner Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#4B5563] to-[#9CA3AF] flex-shrink-0 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                {getInitials(fund.projectName)}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                    {fund.status}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-gray-100 text-gray-600">
                    {fund.projectType}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 leading-snug font-goudy">
                  {fund.projectName}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This fund represents a legacy investment structure that has been fully closed. Historical performance, capital call contributions, and distributions remain archived for tracking, compliance, and auditing purposes.
                </p>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-goudy border-b border-gray-50 pb-3">Fund Financial Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Metric 1 */}
                <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="p-2.5 bg-white rounded-xl text-gray-500 shadow-sm">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Total Capital</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{fund.totalCapital}</p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="flex items-start gap-3.5 p-4 bg-[#1F3B6E]/5 rounded-2xl border border-[#1F3B6E]/10">
                  <div className="p-2.5 bg-white rounded-xl text-[#1F3B6E] shadow-sm">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#1F3B6E]/60 font-semibold uppercase tracking-wider">Distributions To Date</p>
                    <p className="text-lg font-bold text-[#1F3B6E] mt-0.5">{fund.distributionsToDate}</p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="p-2.5 bg-white rounded-xl text-gray-500 shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Total Investors</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">{fund.totalInvestors}</p>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="flex items-start gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="p-2.5 bg-white rounded-xl text-gray-500 shadow-sm">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Project ID & Type</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      ID: {fund.projectId} &bull; <span className="uppercase text-sm">{fund.projectType}</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right Sidebar Section */}
          <div className="space-y-6">

            {/* Timeline Info Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 font-goudy border-b border-gray-50 pb-3">Lifecycle Timeline</h3>

              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase">Closing Date</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatDate(fund.closingDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase">Exit Date</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {fund.exitDate ? formatDate(fund.exitDate) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                  <ShieldCheck className="h-5 w-5 text-[#059669] mt-0.5" />
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase">Status Verification</p>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium leading-relaxed">
                      All accounts associated with this fund have been finalized, audited, and closed. No further distributions or capital calls will be initiated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Status Card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-[#1F3B6E]" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Database Status</h4>
              </div>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                This old fund is marked as <strong className="text-[#1F3B6E]">{fund.published === 'TRUE' ? 'Published' : 'Unpublished'}</strong> in the database system for administrative tracking, but is restricted from active subscription operations.
              </p>
            </div>

          </div>

        </div>

        {/* Associated Investors & Distributions Section (Expanded Full Width) */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 mt-8">

          {/* Tab switcher header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  setActiveTab('investors');
                  setSelectedClassName(null);
                  setSelectedBatchId(null);
                  setSelectedBatchData([]);
                  setSelectedInvestorId(null);
                  setSelectedInvestorData(null);
                }}
                className={`flex items-center gap-2 pb-2 border-b-2 font-bold transition-all text-base ${activeTab === 'investors'
                  ? 'border-[#1F3B6E] text-[#1F3B6E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Users className="h-5 w-5" />
                <span>Associated Investors</span>
                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {fund.investors ? fund.investors.length : 0}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('distributions');
                  setSelectedClassName(null);
                  setSelectedBatchId(null);
                  setSelectedBatchData([]);
                  setSelectedInvestorId(null);
                  setSelectedInvestorData(null);
                }}
                className={`flex items-center gap-2 pb-2 border-b-2 font-bold transition-all text-base ${activeTab === 'distributions'
                  ? 'border-[#1F3B6E] text-[#1F3B6E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Distributions</span>
                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {fund.distributions ? fund.distributions.filter((d: any) => d.status !== '0' && d.status !== 'Draft').length : 0}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('waterfalls');
                  setSelectedClassName(null);
                  setSelectedBatchId(null);
                  setSelectedBatchData([]);
                  setSelectedInvestorId(null);
                  setSelectedInvestorData(null);
                  setSelectedWaterfall(null);
                }}
                className={`flex items-center gap-2 pb-2 border-b-2 font-bold transition-all text-base ${activeTab === 'waterfalls'
                  ? 'border-[#1F3B6E] text-[#1F3B6E]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <Split className="h-5 w-5" />
                <span>Waterfalls</span>
                <span className="inline-flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {waterfallsList.length}
                </span>
              </button>
            </div>
            {activeTab === 'distributions' && selectedBatchId === null && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] text-white hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 transition-all rounded-xl text-xs font-bold shadow-sm self-end sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                Add Distributions
              </button>
            )}
          </div>

          {/* Investors Tab content */}
          {activeTab === 'investors' && (
            isInvestorLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
              </div>
            ) : selectedInvestorId !== null && selectedInvestorData ? (
              // Investor detail view (navigated like a directory)
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-3 gap-3">
                  <button
                    onClick={() => {
                      setSelectedInvestorId(null);
                      setSelectedInvestorData(null);
                    }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3B6E] hover:text-[#1F3B6E]/80 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Investors
                  </button>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Investor ID: {selectedInvestorData.profileId} &bull; {selectedInvestorData.email}
                  </span>
                </div>

                {/* Compact summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Investment on this fund</span>
                    <span className="text-xl font-bold text-gray-900">{selectedInvestorData.totalInvestment}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total Shares Held on this fund</span>
                    <span className="text-xl font-bold text-gray-900">{selectedInvestorData.totalShares}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-3 gap-4">
                  <h4 className="text-base font-bold text-[#1F3B6E] font-goudy">
                    Investment Records for {selectedInvestorData.fullName}
                  </h4>
                  <button
                    onClick={() => router.push(`/dashboard/funds/old/${params.id}/investor/${selectedInvestorId}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] text-white hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 transition-all rounded-xl text-xs font-bold shadow-sm"
                  >
                    View Global Investor Profile
                  </button>
                </div>

                {selectedInvestorData.investments && selectedInvestorData.investments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica pl-3 w-[8%]">No.</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica w-[18%] pr-4">Investment Amount</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica w-[12%] pr-4">Shares</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica w-[12%] pr-4">Ownership</th>
                          <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica w-[18%]">Placed On</th>
                          <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica w-[18%]">Received On</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica pr-3 w-[14%]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedInvestorData.investments.map((inv: any, idx: number) => (
                          <tr key={idx} className="bg-blue-50/20 hover:bg-blue-50/40 transition-all border-l-4 border-[#1F3B6E] group">
                            <td className="py-4 pl-3 text-sm font-bold text-[#1F3B6E] text-left w-[8%]">
                              #{idx + 1}
                            </td>
                            <td className="py-4 text-right text-sm font-bold text-gray-900 w-[18%] pr-4">
                              {inv.amount}
                            </td>
                            <td className="py-4 text-right text-sm font-medium text-gray-700 w-[12%] pr-4">
                              {inv.shares || '0.00'}
                            </td>
                            <td className="py-4 text-right text-sm font-medium text-gray-500 w-[12%] pr-4">
                              {inv.ownership || '0.00%'}
                            </td>
                            <td className="py-4 text-center text-sm text-gray-600 font-medium w-[18%]">
                              {formatDate(inv.placedOn)}
                            </td>
                            <td className="py-4 text-center text-sm text-gray-600 font-medium w-[18%]">
                              {formatDate(inv.receivedOn)}
                            </td>
                            <td className="py-4 text-right pr-3 w-[14%]">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 font-medium">No investment records found for this investor.</p>
                  </div>
                )}
              </div>
            ) : selectedClassName === null ? (
              // Classes table view
              fund.investors && fund.investors.length > 0 ? (
                <div className="space-y-6">
                  <div className="mb-2">
                    <h3 className="text-lg font-bold text-gray-900 font-goudy pb-2 border-b border-gray-100">Share Classes</h3>
                    <p className="text-sm font-semibold text-gray-700 mt-1">Select a class to view its associated investors.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Class Name</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Investment</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Ownership</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Shares</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">No. of Investors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(() => {
                          const counts: Record<string, { count: number; totalInvestment: number; totalShares: number }> = {};
                          fund.investors.forEach((inv: any) => {
                            const cls = inv.className || 'Default Class';
                            if (!counts[cls]) {
                              counts[cls] = { count: 0, totalInvestment: 0, totalShares: 0 };
                            }
                            counts[cls].count += 1;
                            const numAmount = parseFloat(inv.totalInvestment?.replace(/[\$,]/g, '') || '0');
                            const numShares = parseFloat(inv.totalShares || '0');
                            counts[cls].totalInvestment += numAmount;
                            counts[cls].totalShares += numShares;
                          });
                          const totalCap = parseFloat(fund?.totalCapital?.replace(/[\$,]/g, '') || '0');
                          return Object.entries(counts).map(([name, data], idx) => {
                            const classOwnershipPercent = totalCap > 0 ? ((data.totalInvestment / totalCap) * 100).toFixed(2) + '%' : '0.00%';
                            const roundedShares = Math.abs(data.totalShares - Math.round(data.totalShares)) < 0.1 ? Math.round(data.totalShares) : data.totalShares;
                            return (
                              <tr
                                key={idx}
                                onClick={() => setSelectedClassName(name)}
                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                              >
                                <td className="py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                      {name[0] || 'C'}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 leading-snug">{name}</span>
                                  </div>
                                </td>
                                <td className="py-4 text-right text-sm font-bold text-gray-900">
                                  {'$' + data.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-4 text-right text-sm font-semibold text-gray-900 font-mono">
                                  {classOwnershipPercent}
                                </td>
                                <td className="py-4 text-right text-sm font-medium text-gray-600">
                                  {roundedShares.toFixed(2)}
                                </td>
                                <td className="py-4 text-right text-sm font-semibold text-gray-900">
                                  {data.count} {data.count === 1 ? 'Investor' : 'Investors'}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 font-medium">No associated investors found for this legacy fund.</p>
                </div>
              )
            ) : (
              // Grouped investors view
              (() => {
                const filteredInvestors = fund.investors.filter((inv: any) => (inv.className || 'Default Class') === selectedClassName);
                return (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                      <button
                        onClick={() => setSelectedClassName(null)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3B6E] hover:text-[#1F3B6E]/80 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Classes
                      </button>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Class: {selectedClassName} &bull; {filteredInvestors.length} {filteredInvestors.length === 1 ? 'Investor' : 'Investors'}
                      </span>
                    </div>
                    {filteredInvestors.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Investor</th>
                              <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Profile ID</th>
                              <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Investment</th>
                              <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">% of Class</th>
                              <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Ownership</th>
                              <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Shares</th>
                              <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {filteredInvestors.map((investor: any, idx: number) => {
                              const invAmount = parseFloat(investor.totalInvestment?.replace(/[\$,]/g, '') || '0');
                              const totalCap = parseFloat(fund?.totalCapital?.replace(/[\$,]/g, '') || '0');
                              const ownershipPercent = totalCap > 0 ? ((invAmount / totalCap) * 100).toFixed(2) + '%' : '0.00%';
                              return (
                                <tr
                                  key={idx}
                                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                  onClick={() => handleInvestorClick(investor.externalId)}
                                >
                                  <td className="py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                        {getInitials(investor.fullName)}
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                          {investor.isRegistered && (
                                            <span title="Active on this Platform" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shrink-0 shadow-2xs">
                                              <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5]" />
                                            </span>
                                          )}
                                          <span className="text-sm font-semibold text-gray-900 leading-snug">{investor.fullName}</span>
                                        </div>
                                        <span className="text-xs text-gray-600 mt-0.5">{investor.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 text-left text-sm font-mono text-gray-500">
                                    {investor.externalId}
                                  </td>
                                  <td className="py-4 text-right text-sm font-semibold text-gray-900">
                                    {investor.totalInvestment}
                                  </td>
                                  <td className="py-4 text-right text-sm font-semibold text-gray-900">
                                    {investor.totalOwnership || '0.00%'}
                                  </td>
                                  <td className="py-4 text-right text-sm font-semibold text-gray-900 font-mono">
                                    {ownershipPercent}
                                  </td>
                                  <td className="py-4 text-right text-sm font-medium text-gray-600">
                                    {investor.totalShares}
                                  </td>
                                  <td className="py-4 text-right">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                      {investor.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-400 font-medium">No investors found in this class.</p>
                      </div>
                    )}
                  </div>
                );
              })()
            )
          )}

          {/* Distributions Tab content */}
          {activeTab === 'distributions' && (
            isBatchLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
              </div>
            ) : selectedBatchId !== null ? (
              // Batch detail view (navigated like a directory)
              (() => {
                const selectedBatchInfo = fund?.distributions?.find(
                  (d: any) => d.distributionBatchId === selectedBatchId
                );

                let batchTotal = 0;
                if (selectedBatchData && selectedBatchData.length > 0) {
                  selectedBatchData.forEach((row: any) => {
                    const num = parseFloat(row.calculatedAmount?.replace(/[\$,]/g, '') || '0');
                    if (!isNaN(num)) batchTotal += num;
                  });
                  batchTotal = Number(batchTotal.toFixed(2));
                }

                const formatCurrency = (val: number) => {
                  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                };

                return (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Yellow Approval Banner — top of detail view */}
                    {(selectedBatchInfo?.status === '2' || selectedBatchInfo?.status === 'Pending for Approval') && (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                            <Info className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-amber-900 leading-tight">This Distribution is awaiting approval.</p>
                            <p className="text-xs text-amber-600 font-medium">As an administrator, you must review and approve this batch before it is processed and finalized.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button onClick={handleOpenEditModal} disabled={isSubmitting} className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 disabled:opacity-50">Edit</button>
                          <button onClick={handleRejectBatch} disabled={isSubmitting} className="px-4 py-2 border border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 disabled:opacity-50">Delete</button>
                          <button onClick={handleApproveBatch} disabled={isSubmitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1 disabled:opacity-50">Approve</button>
                        </div>
                      </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-sky-50/40 border border-sky-100/50 rounded-2xl p-4 text-center">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Distributions</span>
                        <span className="block text-xl lg:text-2xl font-bold text-[#1F3B6E] mt-1">{formatCurrency(batchTotal)}</span>
                      </div>
                      <div className="bg-sky-50/40 border border-sky-100/50 rounded-2xl p-4 text-center">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Sum Of Distributions</span>
                        <span className="block text-xl lg:text-2xl font-bold text-[#1F3B6E] mt-1">{formatCurrency(batchTotal)}</span>
                      </div>
                      <div className="bg-sky-50/40 border border-sky-100/50 rounded-2xl p-4 text-center">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Out of Balance</span>
                        <span className="block text-xl lg:text-2xl font-bold text-[#1F3B6E] mt-1">--</span>
                      </div>
                      <div className="bg-sky-50/40 border border-sky-100/50 rounded-2xl p-4 text-center">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributing %</span>
                        <span className="block text-xl lg:text-2xl font-bold text-[#1F3B6E] mt-1 font-mono">100.000%</span>
                      </div>
                    </div>

                    {/* Back button + batch title row */}
                    <div className="space-y-3">
                      <div>
                        <button
                          onClick={() => { setSelectedBatchId(null); setSelectedBatchData([]); }}
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3B6E] hover:text-[#1F3B6E]/80 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back to Distributions
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-gray-900 font-goudy">{selectedBatchInfo?.distributionType || 'Distribution'}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedBatchInfo?.status === '2' || selectedBatchInfo?.status === 'Pending for Approval' ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : selectedBatchInfo?.status === '0' || selectedBatchInfo?.status === 'Draft' ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                            {selectedBatchInfo?.status === '2' || selectedBatchInfo?.status === 'Pending for Approval' ? 'Pending for Approval' : selectedBatchInfo?.status === '0' || selectedBatchInfo?.status === 'Draft' ? 'Draft' : 'Distributed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {(selectedBatchInfo?.status === '0' || selectedBatchInfo?.status === 'Draft') && (
                            <button onClick={handleSendForApproval} disabled={isSubmitting} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50">
                              <svg className="h-3 w-3 fill-current text-white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                              Send for Approval
                            </button>
                          )}
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Batch #{selectedBatchId} Detail Breakdown</span>
                        </div>
                      </div>
                    </div>

                    {selectedBatchData && selectedBatchData.length > 0 ? (() => {
                      // Calculate divisor for % share based on fund's total capital
                      const fundCapitalNum = parseFloat(fund.totalCapital?.replace(/[\$,]/g, '') || '0');
                      const totalInv = fundCapitalNum > 0 ? fundCapitalNum : selectedBatchData.reduce((sum: number, row: any) => {
                        return sum + (parseFloat(row.investmentAmount?.replace(/[\$,]/g, '') || '0'));
                      }, 0);

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica pl-3">Investor</th>
                                <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Investment Amount</th>
                                <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">% Share</th>
                                <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Calculated Amount</th>
                                <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Distributed Amount</th>
                                <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica pr-3">Send Method</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {selectedBatchData.map((row: any, idx: number) => {
                                const invNum = parseFloat(row.investmentAmount?.replace(/[\$,]/g, '') || '0');
                                const pct = totalInv > 0 ? ((invNum / totalInv) * 100).toFixed(4) : '0.0000';
                                return (
                                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 text-left pl-3">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-900 leading-snug">{row.investorName}</span>
                                        <span className="text-[11px] font-mono text-gray-500">ID: {row.investorProfileId}</span>
                                      </div>
                                    </td>
                                    <td className="py-4 text-right text-sm font-semibold text-gray-900">{row.investmentAmount}</td>
                                    <td className="py-4 text-right text-sm font-mono text-gray-600">{pct}%</td>
                                    <td className="py-4 text-right text-sm font-bold text-[#1F3B6E]">{row.calculatedAmount}</td>
                                    <td className="py-4 text-right text-sm font-bold text-emerald-600">{row.distributedAmount}</td>
                                    <td className="py-4 text-center pr-3">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-50 text-gray-600 border border-gray-100">
                                        {row.sendMethod}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                                <td className="py-3 pl-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Total ({selectedBatchData.length} investors)</td>
                                <td className="py-3 text-right text-sm font-bold text-gray-900">
                                  ${totalInv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 text-right text-sm font-bold text-gray-900">
                                  {totalInv > 0 ? '100.0000%' : '--'}
                                </td>
                                <td className="py-3 text-right text-sm font-bold text-[#1F3B6E]">
                                  ${selectedBatchData.reduce((s: number, r: any) => s + parseFloat(r.calculatedAmount?.replace(/[\$,]/g, '') || '0'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 text-right text-sm font-bold text-emerald-600">
                                  ${selectedBatchData.reduce((s: number, r: any) => s + parseFloat(r.distributedAmount?.replace(/[\$,]/g, '') || '0'), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 pr-3"></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      );
                    })() : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-400 font-medium">No records found for this distribution batch.</p>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              // Batch list view
              fund.distributions && fund.distributions.filter((d: any) => d.status !== '0' && d.status !== 'Draft').length > 0 ? (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Batch ID</th>
                          <th className="py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Type</th>
                          <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Period Start</th>
                          <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Period End</th>
                          <th className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Pay Date</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Status</th>
                          <th className="py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider font-helvetica">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {fund.distributions
                          .filter((d: any) => d.status !== '0' && d.status !== 'Draft')
                          .sort((a: any, b: any) => {
                            const aIsPending = a.status === '2' || a.status === 'Pending for Approval';
                            const bIsPending = b.status === '2' || b.status === 'Pending for Approval';
                            if (aIsPending && !bIsPending) return -1;
                            if (!aIsPending && bIsPending) return 1;
                            return Number(b.distributionBatchId) - Number(a.distributionBatchId);
                          })
                          .map((dist: any, idx: number) => (
                            <tr
                              key={idx}
                              className={`transition-colors hover:bg-gray-50/50 cursor-pointer`}
                              onClick={() => handleBatchClick(dist.distributionBatchId)}
                            >
                              <td className="py-4 text-left text-sm font-mono text-gray-500">
                                {dist.distributionBatchId}
                              </td>
                              <td className="py-4 text-left text-sm font-semibold text-gray-900 leading-snug">
                                {dist.distributionType}
                              </td>
                              <td className="py-4 text-center text-sm text-gray-600">
                                {formatDate(dist.periodStartDate)}
                              </td>
                              <td className="py-4 text-center text-sm text-gray-600">
                                {formatDate(dist.periodEndDate)}
                              </td>
                              <td className="py-4 text-center text-sm text-gray-600">
                                {formatDate(dist.payDate)}
                              </td>
                              <td className="py-4 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${dist.status === '2' || dist.status === 'Pending for Approval'
                                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}>
                                  {dist.status === '2' || dist.status === 'Pending for Approval'
                                    ? 'Pending for Approval'
                                    : 'Distributed'}
                                </span>
                              </td>
                              <td className="py-4 text-right text-sm font-bold text-gray-900">
                                {dist.totalAmount}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot className="bg-gray-50/80 font-bold border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={6} className="py-4 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider font-helvetica">
                            Total Distributions
                          </td>
                          <td className="py-4 text-right text-sm font-bold text-[#1F3B6E]">
                            {(() => {
                              const total = fund.distributions
                                .filter((d: any) => d.status !== '0' && d.status !== 'Draft')
                                .reduce((sum: number, d: any) => {
                                  const num = parseFloat(d.totalAmount?.replace(/[\$,]/g, '') || '0');
                                  return sum + (isNaN(num) ? 0 : num);
                                }, 0);
                              return '$' + Number(total.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 font-medium">No distributions found for this legacy fund.</p>
                </div>
              )
            )
          )}

          {/* Waterfalls Tab content */}
          {activeTab === 'waterfalls' && (
            !selectedWaterfall ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-goudy">Configured Waterfalls</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Manage distribution structures, splits, and hurdles for this fund.</p>
                  </div>
                  <button
                    onClick={() => { setWaterfallName(''); setShowAddWaterfallModal(true); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] text-white hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 transition-all rounded-xl text-xs font-bold shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" /> Add Waterfall
                  </button>
                </div>

                {waterfallsList.length === 0 ? (
                  <div className="bg-gray-50/60 rounded-2xl p-12 border border-dashed border-gray-200 text-center space-y-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mx-auto text-[#1F3B6E]">
                      <Split className="h-7 w-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="text-base font-bold text-gray-900">No Waterfalls Created Yet</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Define waterfall structures with distribution templates, splits, and hurdles for this fund.
                      </p>
                    </div>
                    <button
                      onClick={() => { setWaterfallName(''); setShowAddWaterfallModal(true); }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F3B6E] hover:bg-[#1F3B6E]/90 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      <Plus className="h-4 w-4" /> Add Waterfall
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {waterfallsList.map((wf) => (
                      <div
                        key={wf.id}
                        onClick={() => setSelectedWaterfall(wf)}
                        className="p-6 bg-white border border-gray-200 hover:border-[#1F3B6E] rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1F3B6E]/10 text-[#1F3B6E] flex items-center justify-center font-bold">
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-gray-900 group-hover:text-[#1F3B6E] transition-colors">{wf.name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {wf.rules?.length || 0} {(wf.rules?.length || 0) === 1 ? 'Rule' : 'Rules'} Configured
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveWaterfall(wf.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete waterfall"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-bold text-[#1F3B6E]">
                          <span>Configure Rules</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                  <div>
                    <button
                      onClick={() => setSelectedWaterfall(null)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3B6E] hover:text-[#1F3B6E]/80 transition-colors mb-2"
                    >
                      <ChevronLeft className="h-4 w-4" /> Back to Waterfalls List
                    </button>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900 font-goudy">{selectedWaterfall.name}</h3>
                      <span className="px-3 py-0.5 bg-[#1F3B6E]/10 text-[#1F3B6E] text-xs font-bold rounded-full">
                        {selectedWaterfall.rules?.length || 0} {(selectedWaterfall.rules?.length || 0) === 1 ? 'Rule' : 'Rules'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRuleName('');
                      setRuleSection('');
                      setSelectedRuleTemplate(null);
                      setShowAddRuleModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] text-white hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 transition-all rounded-xl text-xs font-bold shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="h-4 w-4" /> Add Rule
                  </button>
                </div>

                {(!selectedWaterfall.rules || selectedWaterfall.rules.length === 0) && !draftRule ? (
                  <div className="bg-gray-50/60 rounded-2xl p-12 border border-dashed border-gray-200 text-center space-y-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 mx-auto text-[#1F3B6E]">
                      <Layers className="h-7 w-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h4 className="text-base font-bold text-gray-900">No Rules Added Yet</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Add distribution rules to define splits or hurdle structures for this waterfall.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRuleName('');
                        setRuleSection('');
                        setSelectedRuleTemplate(null);
                        setShowAddRuleModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F3B6E] hover:bg-[#1F3B6E]/90 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                    >
                      <Plus className="h-4 w-4" /> Add First Rule
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Draft Rule Configuration Box (Add only after configuration) */}
                    {draftRule && (
                      <div className="bg-blue-50/30 border-2 border-[#1F3B6E]/40 rounded-2xl shadow-md overflow-hidden transition-all">
                        <div className="p-4 bg-blue-100/50 border-b border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-[#1F3B6E] text-white font-bold text-xs rounded-full">New Draft</span>
                            <div className="px-4 py-1.5 bg-white border border-blue-300 font-bold text-[#1F3B6E] text-sm rounded shadow-2xs">
                              {draftRule.name}
                            </div>
                            {draftRule.section && (
                              <span className="px-2 py-0.5 bg-blue-200/60 text-blue-900 rounded text-xs font-mono font-semibold">
                                Section {draftRule.section}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="px-3 py-1 bg-white text-[#1F3B6E] font-bold text-xs rounded-full border border-blue-200 shadow-2xs">
                              {draftRule.template}
                            </span>
                            <button
                              onClick={() => {
                                setDraftRule(null);
                                toast.info('Draft rule discarded');
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Discard Draft Rule"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="p-6 bg-white">
                          {draftRule.template === 'Splits Template' ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                <span className="text-sm font-bold text-gray-800">Split distribution as follows:</span>
                                <span className="text-xs font-semibold text-[#1F3B6E]">Configure splits below to finalize</span>
                              </div>

                              <div className="space-y-8">
                                {(draftRule.splits || []).map((split: any, splitIdx: number) => (
                                  <div key={split.id || splitIdx} className="space-y-4 relative pb-6 border-b border-gray-100 last:border-none last:pb-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="font-bold text-gray-700 text-sm w-5">{splitIdx + 1}.</span>

                                      <div className="w-48">
                                        <div className="relative">
                                          <input
                                            type="number"
                                            step="any"
                                            placeholder=""
                                            value={split.percentage || ''}
                                            onChange={(e) => handleUpdateSplit(draftRule.id, split.id, 'percentage', e.target.value)}
                                            className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                          />
                                          <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-gray-50 border-l border-gray-300 text-gray-600 text-sm font-semibold flex items-center justify-center rounded-r-md">%</span>
                                        </div>
                                      </div>

                                      <span className="text-sm text-gray-800 font-medium px-1">to class(es)</span>

                                      <div className="w-64">
                                        <div className="relative group/cls">
                                          <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                            <span className="truncate uppercase font-semibold">
                                              {split.classes && split.classes.length > 0
                                                ? split.classes.join(', ')
                                                : 'Select Class...'}
                                            </span>
                                            <span className="text-gray-400 text-xs">▼</span>
                                          </div>
                                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/cls:block space-y-1">
                                            {['gp', 'gp fund'].map((cls) => {
                                              const isSelected = (split.classes || []).includes(cls);
                                              return (
                                                <label
                                                  key={cls}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    handleSelectSplitClass(draftRule.id, split.id, cls);
                                                  }}
                                                  className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase"
                                                >
                                                  <input
                                                    type="radio"
                                                    name={`split_class_${draftRule.id}_${split.id}`}
                                                    checked={isSelected}
                                                    onChange={() => { }}
                                                    className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]"
                                                  />
                                                  <span>{cls}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>

                                      <span className="text-sm text-gray-800 font-medium px-1">using</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 sm:pl-8">
                                      <div className="w-64">
                                        <select
                                          value={split.method || ''}
                                          onChange={(e) => handleUpdateSplit(draftRule.id, split.id, 'method', e.target.value)}
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                        >
                                          <option value="">Select Method...</option>
                                          <option value="Prorata by Ownership">Prorata by Ownership</option>
                                          <option value="Prorata by Unpaid Preferred Return">Prorata by Unpaid Preferred Return</option>
                                          <option value="Equal distributions">Equal distributions</option>
                                        </select>
                                      </div>

                                      <span className="text-gray-900 font-black text-lg px-1">•</span>

                                      <div className="w-64">
                                        <div className="space-y-1">
                                          <label className="block text-xs font-semibold text-gray-700">
                                            Distribution Sub-type *
                                          </label>
                                          <select
                                            value={split.subType || ''}
                                            onChange={(e) => handleUpdateSplit(draftRule.id, split.id, 'subType', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                          >
                                            <option value="">Select ...</option>
                                            <option value="Preferred Return">Preferred Return</option>
                                            <option value="Return of Capital">Return of Capital</option>
                                            <option value="Promote">Promote</option>
                                            <option value="Fees">Fees</option>
                                            <option value="Excess Cash">Excess Cash</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setDraftRule(null)}
                                  className="px-5 py-2 text-sm font-semibold rounded-xl"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleSaveAndAddRule}
                                  className="px-6 py-2.5 bg-gradient-to-r from-[#1F3B6E] to-[#3A568C] hover:from-[#1F3B6E]/90 hover:to-[#3A568C]/90 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2"
                                >
                                  <Check className="h-4 w-4" /> Add Rule to Waterfall
                                </Button>
                              </div>
                            </div>
                          ) : draftRule.template === 'Splits with Hurdles Template' ? (
                            <div className="space-y-6">
                              {/* ── SPLITS SECTION ── */}
                              <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                <span className="text-sm font-bold text-gray-800">Split <span className="text-[#1F3B6E]">distribution</span> as follows:</span>
                              </div>
                              <div className="space-y-8">
                                {(draftRule.splits || []).map((split: any, splitIdx: number) => (
                                  <div key={split.id || splitIdx} className="space-y-4 relative pb-6 border-b border-gray-100 last:border-none last:pb-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="font-bold text-gray-700 text-sm w-5">{splitIdx + 1}.</span>
                                      <div className="w-48">
                                        <div className="relative">
                                          <input type="number" step="any" placeholder="" value={split.percentage || ''} onChange={(e) => handleUpdateSplit(draftRule.id, split.id, 'percentage', e.target.value)} className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]" />
                                          <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-gray-50 border-l border-gray-300 text-gray-600 text-sm font-semibold flex items-center justify-center rounded-r-md">%</span>
                                        </div>
                                      </div>
                                      <span className="text-sm text-gray-800 font-medium px-1">to class(es)</span>
                                      <div className="w-64">
                                        <div className="relative group/scls">
                                          <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                            <span className="truncate uppercase font-semibold">{split.classes && split.classes.length > 0 ? split.classes.join(', ') : 'Select Class...'}</span>
                                            <span className="text-gray-400 text-xs">▼</span>
                                          </div>
                                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/scls:block space-y-1">
                                            {['gp', 'gp fund'].map((cls) => {
                                              const isSelected = (split.classes || []).includes(cls);
                                              return (
                                                <label key={cls} onClick={(e) => { e.preventDefault(); handleSelectSplitClass(draftRule.id, split.id, cls); }} className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase">
                                                  <input type="radio" name={`sh_split_class_${draftRule.id}_${split.id}`} checked={isSelected} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]" />
                                                  <span>{cls}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-sm text-gray-800 font-medium px-1">using</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 sm:pl-8">
                                      <div className="w-64">
                                        <select value={split.method || ''} onChange={(e) => handleUpdateSplit(draftRule.id, split.id, 'method', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]">
                                          <option value="">Select Method...</option>
                                          <option value="Prorata by Ownership">Prorata by Ownership</option>
                                          <option value="Prorata by Unpaid Preferred Return">Prorata by Unpaid Preferred Return</option>
                                          <option value="Equal distributions">Equal distributions</option>
                                        </select>
                                      </div>
                                      <span className="text-gray-900 font-black text-lg px-1">•</span>
                                      <div className="w-64">
                                        <div className="space-y-1">
                                          <label className="block text-xs font-semibold text-gray-700">Distribution Sub-type *</label>
                                          <select value={split.subType || ''} onChange={(e) => handleUpdateSplit(draftRule.id, split.id, 'subType', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]">
                                            <option value="">Select ...</option>
                                            <option value="Preferred Return">Preferred Return</option>
                                            <option value="Return of Capital">Return of Capital</option>
                                            <option value="Promote">Promote</option>
                                            <option value="Fees">Fees</option>
                                            <option value="Excess Cash">Excess Cash</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* ── HURDLES SECTION ── */}
                              <div className="flex items-center gap-4 border-b border-gray-100 pb-3 pt-2">
                                <span className="text-sm font-bold text-gray-800">Until <span className="text-[#1F3B6E]">the following</span> happens:</span>
                              </div>
                              <div className="space-y-8">
                                {(draftRule.hurdles || []).map((hurdle: any, hurdleIdx: number) => (
                                  <div key={hurdle.id || hurdleIdx} className="space-y-3 relative pb-6 border-b border-gray-100 last:border-none last:pb-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <span className="font-bold text-gray-700 text-sm w-5">{hurdleIdx + 1}.</span>
                                      {/* Receiving Class */}
                                      <div className="w-44">
                                        <div className="relative group/hcls">
                                          <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                            <span className="truncate uppercase font-semibold text-xs">
                                              {hurdle.classes && hurdle.classes.length > 0 ? hurdle.classes.join(', ') : 'Select Classes...'}
                                            </span>
                                            <span className="text-gray-400 text-xs">▼</span>
                                          </div>
                                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/hcls:block space-y-1">
                                            {['gp', 'gp fund'].map((cls) => {
                                              const isSelected = (hurdle.classes || []).includes(cls);
                                              return (
                                                <label key={cls} onClick={(e) => { e.preventDefault(); handleSelectHurdleClass(draftRule.id, hurdle.id, 'classes', cls); }} className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase">
                                                  <input type="radio" name={`hurdle_class_${draftRule.id}_${hurdle.id}`} checked={isSelected} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]" />
                                                  <span>{cls}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-sm text-gray-700 font-medium">receives</span>
                                      {/* Hurdle Type */}
                                      <div className="w-56">
                                        <select value={hurdle.type || ''} onChange={(e) => handleUpdateHurdle(draftRule.id, hurdle.id, 'type', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]">
                                          <option value="">Select receives type...</option>
                                          <option value="an IRR of...">an IRR of...</option>
                                          <option value="Return of its Capital">a Return of its Capital</option>
                                          <option value="a Preferred Return of...">a Preferred Return of...</option>
                                          <option value="its Preferred Return">its Preferred Return</option>
                                          <option value="an Equity Multiple of...">an Equity Multiple of...</option>
                                          <option value="a percentage equal to">a percentage equal to</option>
                                        </select>
                                      </div>
                                      {/* IRR / Preferred Return / percentage equal to → % field */}
                                      {['an IRR of...', 'a Preferred Return of...', 'a percentage equal to'].includes(hurdle.type) && (
                                        <div className="w-36">
                                          <div className="relative">
                                            <input type="number" step="any" placeholder="%" value={hurdle.percentage || ''} onChange={(e) => handleUpdateHurdle(draftRule.id, hurdle.id, 'percentage', e.target.value)} className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]" />
                                            <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-gray-50 border-l border-gray-300 text-gray-600 text-sm font-semibold flex items-center justify-center rounded-r-md">%</span>
                                          </div>
                                        </div>
                                      )}
                                      {hurdle.type === 'an Equity Multiple of...' && (
                                        <div className="w-36">
                                          <input type="number" step="any" placeholder="e.g. 2.0" value={hurdle.amount || ''} onChange={(e) => handleUpdateHurdle(draftRule.id, hurdle.id, 'amount', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]" />
                                        </div>
                                      )}
                                      {/* Gross Up Cashflow */}
                                    </div>
                                    {/* Percentage of Classes extra options */}
                                    {hurdle.type === 'a percentage equal to' && (
                                      <div className="sm:pl-8 flex flex-wrap gap-6">
                                        {/* ofClasses */}
                                        <div className="w-44">
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">of class(es)</label>
                                          <div className="relative group/ofcls">
                                            <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                              <span className="truncate uppercase font-semibold text-xs">
                                                {hurdle.ofClasses && hurdle.ofClasses.length > 0 ? hurdle.ofClasses.join(', ') : 'Select Class...'}
                                              </span>
                                              <span className="text-gray-400 text-xs">▼</span>
                                            </div>
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/ofcls:block space-y-1">
                                              {['gp', 'gp fund'].map((cls) => {
                                                const isSelected = (hurdle.ofClasses || []).includes(cls);
                                                return (
                                                  <label key={cls} onClick={(e) => { e.preventDefault(); handleSelectHurdleClass(draftRule.id, hurdle.id, 'ofClasses', cls); }} className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase">
                                                    <input type="checkbox" checked={isSelected} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]" />
                                                    <span>{cls}</span>
                                                  </label>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        </div>
                                        {/* asSubTypes */}
                                        <div>
                                          <label className="block text-xs font-semibold text-gray-600 mb-1">as sub-type(s)</label>
                                          <div className="flex flex-wrap gap-3">
                                            {['Preferred Return', 'Return of Capital', 'Promote', 'Fees', 'Excess Cash'].map((sub) => {
                                              const checked = (hurdle.asSubTypes || []).includes(sub);
                                              return (
                                                <label key={sub} className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleToggleHurdleSubType(draftRule.id, hurdle.id, sub)}>
                                                  <input type="checkbox" checked={checked} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E] rounded" />
                                                  <span className="text-xs text-gray-700">{sub}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                        {/* Gross Up – only for percentage equal to */}
                                        <br />
                                        <br />
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={hurdle.grossUpCashflow || false} onChange={(e) => handleUpdateHurdle(draftRule.id, hurdle.id, 'grossUpCashflow', e.target.checked)} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E] rounded" />
                                          <span className="text-sm text-gray-700">Gross Up</span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setDraftRule(null)} className="px-5 py-2 text-sm font-semibold rounded-xl">Cancel</Button>
                                <Button type="button" onClick={handleSaveAndAddRule} className="px-6 py-2.5 bg-gradient-to-r from-[#1F3B6E] to-[#3A568C] hover:from-[#1F3B6E]/90 hover:to-[#3A568C]/90 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2">
                                  <Check className="h-4 w-4" /> Add Rule to Waterfall
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-center text-gray-400 text-sm">Unknown template</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Saved Rules List */}
                    {selectedWaterfall.rules && selectedWaterfall.rules.length > 0 && (
                      <div className="space-y-4">
                        {selectedWaterfall.rules.map((rule: any, idx: number) => (
                          <div
                            key={rule.id}
                            className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden transition-all"
                          >
                            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-700 text-sm">{idx + 1}.</span>
                                <div className="px-4 py-1.5 bg-white border border-gray-300 font-semibold text-gray-800 text-sm rounded shadow-2xs">
                                  {rule.name || `Rule ${idx + 1}`}
                                </div>
                                {rule.section && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono font-semibold">
                                    Section {rule.section}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 self-end sm:self-auto">
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full border border-blue-100">
                                  {rule.template}
                                </span>
                                <button
                                  onClick={() => handleRemoveRule(rule.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove Rule"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="p-6">
                              {rule.template === 'Splits Template' ? (
                                <div className="space-y-6">
                                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                    <span className="text-sm font-bold text-gray-800">Split distribution as follows:</span>
                                    <span className="text-xs text-gray-500 font-medium">for split template</span>
                                  </div>

                                  <div className="space-y-8">
                                    {(rule.splits && rule.splits.length > 0 ? rule.splits : [
                                      { id: '1', percentage: '', classes: [], method: '', subType: '' },
                                      { id: '2', percentage: '', classes: [], method: '', subType: '' }
                                    ]).map((split: any, splitIdx: number) => (
                                      <div key={split.id || splitIdx} className="space-y-4 relative pb-6 border-b border-gray-100 last:border-none last:pb-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="font-bold text-gray-700 text-sm w-5">{splitIdx + 1}.</span>

                                          <div className="w-48">
                                            <div className="relative">
                                              <input
                                                type="number"
                                                step="any"
                                                placeholder=""
                                                value={split.percentage || ''}
                                                onChange={(e) => handleUpdateSplit(rule.id, split.id, 'percentage', e.target.value)}
                                                className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                              />
                                              <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-gray-50 border-l border-gray-300 text-gray-600 text-sm font-semibold flex items-center justify-center rounded-r-md">%</span>
                                            </div>
                                          </div>

                                          <span className="text-sm text-gray-800 font-medium px-1">to class(es)</span>

                                          <div className="w-64">
                                            <div className="relative group/cls">
                                              <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                                <span className="truncate uppercase font-semibold">
                                                  {split.classes && split.classes.length > 0
                                                    ? split.classes.join(', ')
                                                    : 'Select Class...'}
                                                </span>
                                                <span className="text-gray-400 text-xs">▼</span>
                                              </div>
                                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/cls:block space-y-1">
                                                {['gp', 'gp fund'].map((cls) => {
                                                  const isSelected = (split.classes || []).includes(cls);
                                                  return (
                                                    <label
                                                      key={cls}
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSelectSplitClass(rule.id, split.id, cls);
                                                      }}
                                                      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase"
                                                    >
                                                      <input
                                                        type="radio"
                                                        name={`split_class_${rule.id}_${split.id}`}
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]"
                                                      />
                                                      <span>{cls}</span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          <span className="text-sm text-gray-800 font-medium px-1">using</span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 sm:pl-8">
                                          <div className="w-64">
                                            <select
                                              value={split.method || ''}
                                              onChange={(e) => handleUpdateSplit(rule.id, split.id, 'method', e.target.value)}
                                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                            >
                                              <option value="">Select Method...</option>
                                              <option value="Prorata by Ownership">Prorata by Ownership</option>
                                              <option value="Prorata by Unpaid Preferred Return">Prorata by Unpaid Preferred Return</option>
                                              <option value="Equal distributions">Equal distributions</option>
                                            </select>
                                          </div>

                                          <span className="text-gray-900 font-black text-lg px-1">•</span>

                                          <div className="w-64">
                                            <div className="space-y-1">
                                              <label className="block text-xs font-semibold text-gray-700">
                                                Distribution Sub-type *
                                              </label>
                                              <select
                                                value={split.subType || ''}
                                                onChange={(e) => handleUpdateSplit(rule.id, split.id, 'subType', e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                              >
                                                <option value="">Select ...</option>
                                                <option value="Preferred Return">Preferred Return</option>
                                                <option value="Return of Capital">Return of Capital</option>
                                                <option value="Promote">Promote</option>
                                                <option value="Fees">Fees</option>
                                                <option value="Excess Cash">Excess Cash</option>
                                              </select>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                                    <Button
                                      type="button"
                                      onClick={() => handleSaveRuleChanges(rule)}
                                      className="px-5 py-2 bg-[#1F3B6E] hover:bg-[#1F3B6E]/90 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                                    >
                                      <Check className="h-3.5 w-3.5" /> Save Changes
                                    </Button>
                                  </div>
                                </div>
                              ) : rule.template === 'Splits with Hurdles Template' ? (
                                <div className="space-y-6">
                                  {/* ── SPLITS SECTION ── */}
                                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                    <span className="text-sm font-bold text-gray-800">Split <span className="text-[#1F3B6E]">distribution</span> as follows:</span>
                                  </div>
                                  <div className="space-y-8">
                                    {(rule.splits && rule.splits.length > 0 ? rule.splits : [
                                      { id: '1', percentage: '', classes: [], method: '', subType: '' },
                                      { id: '2', percentage: '', classes: [], method: '', subType: '' }
                                    ]).map((split: any, splitIdx: number) => (
                                      <div key={split.id || splitIdx} className="space-y-4 relative pb-6 border-b border-gray-100 last:border-none last:pb-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="font-bold text-gray-700 text-sm w-5">{splitIdx + 1}.</span>

                                          <div className="w-48">
                                            <div className="relative">
                                              <input
                                                type="number"
                                                step="any"
                                                placeholder=""
                                                value={split.percentage || ''}
                                                onChange={(e) => handleUpdateSplit(rule.id, split.id, 'percentage', e.target.value)}
                                                className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                              />
                                              <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-gray-50 border-l border-gray-300 text-gray-600 text-sm font-semibold flex items-center justify-center rounded-r-md">%</span>
                                            </div>
                                          </div>

                                          <span className="text-sm text-gray-800 font-medium px-1">to class(es)</span>

                                          <div className="w-64">
                                            <div className="relative group/cls2">
                                              <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                                <span className="truncate uppercase font-semibold">
                                                  {split.classes && split.classes.length > 0 ? split.classes.join(', ') : 'Select Class...'}
                                                </span>
                                                <span className="text-gray-400 text-xs">▼</span>
                                              </div>
                                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/cls2:block space-y-1">
                                                {['gp', 'gp fund'].map((cls) => {
                                                  const isSelected = (split.classes || []).includes(cls);
                                                  return (
                                                    <label
                                                      key={cls}
                                                      onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSelectSplitClass(rule.id, split.id, cls);
                                                      }}
                                                      className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase"
                                                    >
                                                      <input
                                                        type="radio"
                                                        name={`sh_split_class_${rule.id}_${split.id}`}
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]"
                                                      />
                                                      <span>{cls}</span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          <span className="text-sm text-gray-800 font-medium px-1">using</span>

                                          <div className="w-56">
                                            <select
                                              value={split.method || ''}
                                              onChange={(e) => handleUpdateSplit(rule.id, split.id, 'method', e.target.value)}
                                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-750 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                            >
                                              <option value="">Select Method...</option>
                                              <option value="Prorata by Ownership">Prorata by Ownership</option>
                                              <option value="Prorata by Unpaid Preferred Return">Prorata by Unpaid Preferred Return</option>
                                              <option value="Prorata by Unpaid Capital">Prorata by Unpaid Capital</option>
                                            </select>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-gray-700">Distribution Sub-type *</label>
                                            <select
                                              value={split.subType || ''}
                                              onChange={(e) => handleUpdateSplit(rule.id, split.id, 'subType', e.target.value)}
                                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]"
                                            >
                                              <option value="">Select ...</option>
                                              <option value="Preferred Return">Preferred Return</option>
                                              <option value="Return of Capital">Return of Capital</option>
                                              <option value="Promote">Promote</option>
                                              <option value="Fees">Fees</option>
                                              <option value="Excess Cash">Excess Cash</option>
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* ── HURDLES SECTION ── */}
                                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 pt-2">
                                    <span className="text-sm font-bold text-gray-800">Until <span className="text-[#1F3B6E]">the following</span> happens:</span>
                                  </div>
                                  <div className="space-y-8">
                                    {(rule.hurdles || []).map((hurdle: any, hurdleIdx: number) => (
                                      <div key={hurdle.id || hurdleIdx} className="space-y-3 relative pb-6 border-b border-gray-100 last:border-none last:pb-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="font-bold text-gray-700 text-sm w-5">{hurdleIdx + 1}.</span>
                                          {/* Receiving Class */}
                                          <div className="w-44">
                                            <div className="relative group/hcls2">
                                              <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                                <span className="truncate uppercase font-semibold text-xs">
                                                  {hurdle.classes && hurdle.classes.length > 0 ? hurdle.classes.join(', ') : 'Select Classes...'}
                                                </span>
                                                <span className="text-gray-400 text-xs">▼</span>
                                              </div>
                                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/hcls2:block space-y-1">
                                                {['gp', 'gp fund'].map((cls) => {
                                                  const isSelected = (hurdle.classes || []).includes(cls);
                                                  return (
                                                    <label key={cls} onClick={(e) => { e.preventDefault(); handleSelectHurdleClass(rule.id, hurdle.id, 'classes', cls); }} className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase">
                                                      <input type="radio" name={`hurdle_class_${rule.id}_${hurdle.id}`} checked={isSelected} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]" />
                                                      <span>{cls}</span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>
                                          <span className="text-sm text-gray-700 font-medium">receives</span>
                                          {/* Hurdle Type */}
                                          <div className="w-56">
                                            <select value={hurdle.type || ''} onChange={(e) => handleUpdateHurdle(rule.id, hurdle.id, 'type', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]">
                                              <option value="">Select receives type...</option>
                                              <option value="an IRR of...">an IRR of...</option>
                                              <option value="Return of its Capital">a Return of its Capital</option>
                                              <option value="a Preferred Return of...">a Preferred Return of...</option>
                                              <option value="its Preferred Return">its Preferred Return</option>
                                              <option value="an Equity Multiple of...">an Equity Multiple of...</option>
                                              <option value="a percentage equal to">a percentage equal to</option>
                                            </select>
                                          </div>
                                          {/* IRR / Preferred Return / percentage → % field */}
                                          {['an IRR of...', 'a Preferred Return of...', 'a percentage equal to'].includes(hurdle.type) && (
                                            <div className="w-36">
                                              <div className="relative">
                                                <input type="number" step="any" placeholder="%" value={hurdle.percentage || ''} onChange={(e) => handleUpdateHurdle(rule.id, hurdle.id, 'percentage', e.target.value)} className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]" />
                                                <span className="absolute right-0 top-0 bottom-0 px-2.5 bg-gray-50 border-l border-gray-300 text-gray-600 text-sm font-semibold flex items-center justify-center rounded-r-md">%</span>
                                              </div>
                                            </div>
                                          )}
                                          {/* Equity Multiple */}
                                          {hurdle.type === 'an Equity Multiple of...' && (
                                            <div className="w-36">
                                              <input type="number" step="any" placeholder="e.g. 2.0" value={hurdle.amount || ''} onChange={(e) => handleUpdateHurdle(rule.id, hurdle.id, 'amount', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-[#1F3B6E]" />
                                            </div>
                                          )}
                                          {/* Gross Up */}
                                        </div>
                                        {/* Percentage of Classes extra options */}
                                        {hurdle.type === 'a percentage equal to' && (
                                          <div className="sm:pl-8 flex flex-wrap gap-6">
                                            <div className="w-44">
                                              <label className="block text-xs font-semibold text-gray-600 mb-1">of class(es)</label>
                                              <div className="relative group/ofcls2">
                                                <div className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 cursor-pointer flex items-center justify-between select-none">
                                                  <span className="truncate uppercase font-semibold text-xs">
                                                    {hurdle.ofClasses && hurdle.ofClasses.length > 0 ? hurdle.ofClasses.join(', ') : 'Select Class...'}
                                                  </span>
                                                  <span className="text-gray-400 text-xs">▼</span>
                                                </div>
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-20 hidden group-hover/ofcls2:block space-y-1">
                                                  {['gp', 'gp fund'].map((cls) => {
                                                    const isSelected = (hurdle.ofClasses || []).includes(cls);
                                                    return (
                                                      <label key={cls} onClick={(e) => { e.preventDefault(); handleSelectHurdleClass(rule.id, hurdle.id, 'ofClasses', cls); }} className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm font-medium text-gray-700 uppercase">
                                                        <input type="checkbox" checked={isSelected} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E]" />
                                                        <span>{cls}</span>
                                                      </label>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                            <div>
                                              <label className="block text-xs font-semibold text-gray-600 mb-1">as sub-type(s)</label>
                                              <div className="flex flex-wrap gap-3">
                                                {['Preferred Return', 'Return of Capital', 'Promote', 'Fees', 'Excess Cash'].map((sub) => {
                                                  const checked = (hurdle.asSubTypes || []).includes(sub);
                                                  return (
                                                    <label key={sub} className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleToggleHurdleSubType(rule.id, hurdle.id, sub)}>
                                                      <input type="checkbox" checked={checked} onChange={() => { }} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E] rounded" />
                                                      <span className="text-xs text-gray-700">{sub}</span>
                                                    </label>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                            {/* Gross Up – only for percentage equal to */}
                                            <br />
                                            <br />
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input type="checkbox" checked={hurdle.grossUpCashflow || false} onChange={(e) => handleUpdateHurdle(rule.id, hurdle.id, 'grossUpCashflow', e.target.checked)} className="border-gray-300 text-[#1F3B6E] focus:ring-[#1F3B6E] rounded" />
                                              <span className="text-sm text-gray-700">Gross Up</span>
                                            </label>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                                    <Button type="button" onClick={() => handleSaveRuleChanges(rule)} className="px-5 py-2 bg-[#1F3B6E] hover:bg-[#1F3B6E]/90 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5">
                                      <Check className="h-3.5 w-3.5" /> Save Changes
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-6 text-center text-gray-400 text-sm">Unknown template</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

        </div>

      </div>

      {/* Add Distribution Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-goudy">Add Distribution Batch</h3>
                <p className="text-xs text-gray-500 mt-0.5">{fund.projectName}</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
              {/* Distribution Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Distribution Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={distributionType}
                  onChange={(e) => setDistributionType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  required
                >
                  <option value="Available Cash">Available Cash</option>
                  <option value="Return of Capital">Return of Capital</option>
                  <option value="Preferred Return">Preferred Return</option>
                </select>
              </div>

              {/* Notes Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Distribution Internal Notes
                  </label>
                  <input
                    type="text"
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    placeholder="Internal reference notes"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Investor Dashboard Description
                  </label>
                  <input
                    type="text"
                    value={dashboardDescription}
                    onChange={(e) => setDashboardDescription(e.target.value)}
                    placeholder="Description shown to investors"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  />
                </div>
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Distribution Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => setPeriodStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Distribution End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Send Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Distribution Send Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={batchPayDate}
                  onChange={(e) => setBatchPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  required
                />
              </div>

              {/* Amount Row with Unpaid Pref. button */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total Distribution Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">$</span>
                    <input
                      type="number"
                      step="any"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-400 text-xs font-bold rounded-xl h-[38px] flex items-center justify-center gap-1 cursor-not-allowed pointer-events-none"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Unpaid Pref.
                  </button>

                  {/* Tooltip Balloon */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-left">
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      There is no Preferred Return rule configured for this ruleset
                    </p>
                    {/* Down arrow indicator */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white z-10" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-200" style={{ transform: 'translate(-50%, 1px)' }} />
                  </div>
                </div>
              </div>

              {/* Bank Account dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Bank Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={sendMethod}
                  onChange={(e) => setSendMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  required
                >
                  <option value="Other">Use other payment method</option>
                  <option value="Check">Check</option>
                  <option value="ACH">ACH</option>
                  <option value="Wire">Wire</option>
                </select>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 text-white rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Batch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Distribution Batch Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-goudy">Edit Distribution Batch</h3>
                <p className="text-xs text-gray-500 mt-0.5">{fund.projectName}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
              {/* Distribution Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Distribution Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editDistributionType}
                  onChange={(e) => setEditDistributionType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  required
                >
                  <option value="Available Cash">Available Cash</option>
                  <option value="Return of Capital">Return of Capital</option>
                  <option value="Preferred Return">Preferred Return</option>
                </select>
              </div>

              {/* Notes Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Distribution Internal Notes
                  </label>
                  <input
                    type="text"
                    value={editBatchDescription}
                    onChange={(e) => setEditBatchDescription(e.target.value)}
                    placeholder="Internal reference notes"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Investor Dashboard Description
                  </label>
                  <input
                    type="text"
                    value={editDashboardDescription}
                    onChange={(e) => setEditDashboardDescription(e.target.value)}
                    placeholder="Description shown to investors"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  />
                </div>
              </div>

              {/* Dates grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Period Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editPeriodStartDate}
                    onChange={(e) => setEditPeriodStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Period End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editBatchEndDate}
                    onChange={(e) => setEditBatchEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pay Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editBatchPayDate}
                    onChange={(e) => setEditBatchPayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Total Distribution Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Total Distribution Amount ($) <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  required
                />
              </div>

              {/* Send Method */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment Send Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={editSendMethod}
                  onChange={(e) => setEditSendMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  required
                >
                  <option value="Other">Use other payment method</option>
                  <option value="Check">Check</option>
                  <option value="ACH">ACH</option>
                  <option value="Wire">Wire</option>
                </select>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#1F3B6E] hover:bg-[#1F3B6E]/90 text-white rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <div className="relative bg-[#FFFDF5] rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-amber-200/50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-amber-100/50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 leading-snug">
                Are you sure you want to delete this distribution batch?
              </h3>

              {(() => {
                const targetId = actionBatchId ?? selectedBatchId;
                const targetBatchInfo = fund?.distributions?.find(
                  (d: any) => Number(d.distributionBatchId) === Number(targetId)
                );

                let displayTotal = targetBatchInfo?.totalAmount || '$0.00';
                if ((!targetBatchInfo?.totalAmount || targetBatchInfo.totalAmount === '$0.00') && selectedBatchData && selectedBatchData.length > 0) {
                  let batchTotal = 0;
                  selectedBatchData.forEach((row: any) => {
                    const num = parseFloat(row.calculatedAmount?.replace(/[\$,]/g, '') || '0');
                    if (!isNaN(num)) batchTotal += num;
                  });
                  displayTotal = '$' + Number(batchTotal.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }

                return (
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">
                    You are permanently deleting the{' '}
                    <span className="font-bold">{targetBatchInfo?.distributionType || 'Available Cash'}</span>{' '}
                    distributions from{' '}
                    <span className="font-mono bg-amber-100/50 px-1 rounded">
                      {formatShortDate(targetBatchInfo?.periodStartDate)}
                    </span>{' '}
                    to{' '}
                    <span className="font-mono bg-amber-100/50 px-1 rounded">
                      {formatShortDate(targetBatchInfo?.periodEndDate)}
                    </span>{' '}
                    totaling{' '}
                    <span className="font-bold text-[#1F3B6E]">
                      {displayTotal}
                    </span>.
                  </p>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-100/80">
                <button
                  onClick={confirmDeleteBatch}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 border border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-5 py-2.5 bg-[#1F3B6E] hover:bg-[#1F3B6E]/90 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Don't Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Waterfall Modal */}
      {showAddWaterfallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setShowAddWaterfallModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-goudy">Add Waterfall</h3>
                <p className="text-xs text-gray-500 mt-0.5">{fund?.projectName || 'Fund Waterfall'}</p>
              </div>
              <button onClick={() => setShowAddWaterfallModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Waterfall Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Primary Fund Waterfall"
                  value={waterfallName}
                  onChange={(e) => setWaterfallName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddWaterfallModal(false)}
                className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddWaterfall(true)}
                className="px-6 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
              >
                Save & Add First Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setShowAddRuleModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-goudy">Add Rule</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {selectedWaterfall?.name || 'Waterfall'}: Rule {(selectedWaterfall?.rules?.length || 0) + 1}
                </p>
              </div>
              <button onClick={() => setShowAddRuleModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Rule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pro-Rata Distribution"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Operating Agreement Section Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section 4.2(a)"
                    value={ruleSection}
                    onChange={(e) => setRuleSection(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-base font-bold text-gray-900">Choose a template for your rule</h4>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Select an example template as a base for your rule.
                </p>

                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3.5 mb-5 text-xs text-[#92400E] font-medium flex items-center justify-between">
                  <span>You must have at least one class with a preferred return to use the <strong>Preferred Return template</strong></span>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Splits Template */}
                  <div
                    onClick={() => setSelectedRuleTemplate('Splits Template')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${selectedRuleTemplate === 'Splits Template'
                      ? 'border-[#1F3B6E] bg-[#1F3B6E]/5 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">Splits Template</span>
                        {selectedRuleTemplate === 'Splits Template' && (
                          <span className="w-4 h-4 rounded-full bg-[#1F3B6E] text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Distribute capital pro-rata across selected share classes according to fixed percentage splits.
                      </p>
                    </div>
                    <ChevronRight className={`h-5 w-5 shrink-0 ${selectedRuleTemplate === 'Splits Template' ? 'text-[#1F3B6E]' : 'text-gray-400'}`} />
                  </div>

                  {/* Option 2: Splits with Hurdles Template */}
                  <div
                    onClick={() => setSelectedRuleTemplate('Splits with Hurdles Template')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${selectedRuleTemplate === 'Splits with Hurdles Template'
                      ? 'border-[#1F3B6E] bg-[#1F3B6E]/5 shadow-xs'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">Splits with Hurdles Template</span>
                        {selectedRuleTemplate === 'Splits with Hurdles Template' && (
                          <span className="w-4 h-4 rounded-full bg-[#1F3B6E] text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Distribute capital up to specific IRR or return hurdles before splitting between GP and LPs.
                      </p>
                    </div>
                    <ChevronRight className={`h-5 w-5 shrink-0 ${selectedRuleTemplate === 'Splits with Hurdles Template' ? 'text-[#1F3B6E]' : 'text-gray-400'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddRuleModal(false)}
                className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!selectedRuleTemplate}
                className="px-6 py-2 bg-gradient-to-r from-[#1F3B6E] to-[#4A5D90] hover:from-[#1F3B6E]/90 hover:to-[#4A5D90]/90 text-white rounded-xl font-semibold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
