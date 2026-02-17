export type InvestorKycStatus = 'pending' | 'verified' | 'rejected';

const KYC_STATUS_KEY = 'investor-kyc-status';

const rotateDummyStatus = (): InvestorKycStatus => {
  const day = new Date().getDate();
  const variants: InvestorKycStatus[] = ['pending', 'verified', 'rejected'];
  return variants[day % variants.length];
};

export const getInvestorKycStatus = (): InvestorKycStatus => {
  if (typeof window === 'undefined') {
    return 'pending';
  }

  const stored = window.localStorage.getItem(KYC_STATUS_KEY);
  if (stored === 'pending' || stored === 'verified' || stored === 'rejected') {
    return stored;
  }

  const fallback = rotateDummyStatus();
  window.localStorage.setItem(KYC_STATUS_KEY, fallback);
  return fallback;
};

export const setInvestorKycStatus = (status: InvestorKycStatus) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(KYC_STATUS_KEY, status);
};
