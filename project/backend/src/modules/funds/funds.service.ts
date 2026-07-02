import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class FundsService {
  async getAllFunds() {
    const result = await db.query(
      `SELECT f.id, f.name, f.description, f.image_url as image, f.start_date as "startDate", f.status, f.note,
              f.bank_name as "bankName", f.account_number as "accountNumber", f.routing_number as "routingNumber", 
              f.beneficiary_name as "beneficiaryName", f.bank_address as "bankAddress",
              f.subscription_doc_path as "subscriptionDocPath", f.oa_doc_path as "oaDocPath", f.anchor_name as "anchorName", 
              f.anchor_date as "anchorDate", f.anchor_signature as "anchorSignature", f.anchor_amount as "anchorAmount",
              f.name_page as "namePage", f.name_x as "nameX", f.name_y as "nameY",
              f.date_page as "datePage", f.date_x as "dateX", f.date_y as "dateY",
              f.signature_page as "signaturePage", f.signature_x as "signatureX", f.signature_y as "signatureY",
              f.amount_page as "amountPage", f.amount_x as "amountX", f.amount_y as "amountY",
              f.placements,
              f.oa_placements as "oaPlacements",
              f.oa_name_page as "oaNamePage", f.oa_name_x as "oaNameX", f.oa_name_y as "oaNameY",
              f.oa_date_page as "oaDatePage", f.oa_date_x as "oaDateX", f.oa_date_y as "oaDateY",
              f.oa_signature_page as "oaSignaturePage", f.oa_signature_x as "oaSignatureX", f.oa_signature_y as "oaSignatureY",
              f.oa_amount_page as "oaAmountPage", f.oa_amount_x as "oaAmountX", f.oa_amount_y as "oaAmountY",
              COALESCE(stats.total_investors, 0)::int as "totalInvestors",
              COALESCE(stats.total_aum, 0)::float as "totalAUM"
       FROM funds f
       LEFT JOIN (
           SELECT fund_id, COUNT(DISTINCT user_id) as total_investors, SUM(amount) as total_aum
           FROM (
               SELECT fund_id, user_id, amount FROM fund_flows
               UNION ALL
               SELECT fund_id, user_id, investment_amount as amount FROM investments
               WHERE is_reconciled = true
               UNION ALL
               SELECT inv.fund_id, r.investor_id as user_id, -r.amount as amount FROM redemptions r
               JOIN investments inv ON r.investment_id = inv.id
               WHERE r.is_reconciled = true
           ) combined
           GROUP BY fund_id
       ) stats ON f.id = stats.fund_id
       ORDER BY f.name ASC`
    );
    return result.rows;
  }

  async getFundById(id: string) {
    const result = await db.query(
      `SELECT f.id, f.name, f.description, f.image_url as image, f.start_date as "startDate", f.status, f.note,
              f.bank_name as "bankName", f.account_number as "accountNumber", f.routing_number as "routingNumber", 
              f.beneficiary_name as "beneficiaryName", f.bank_address as "bankAddress",
              f.subscription_doc_path as "subscriptionDocPath", f.oa_doc_path as "oaDocPath", f.anchor_name as "anchorName", 
              f.anchor_date as "anchorDate", f.anchor_signature as "anchorSignature", f.anchor_amount as "anchorAmount",
              f.name_page as "namePage", f.name_x as "nameX", f.name_y as "nameY",
              f.date_page as "datePage", f.date_x as "dateX", f.date_y as "dateY",
              f.signature_page as "signaturePage", f.signature_x as "signatureX", f.signature_y as "signatureY",
              f.amount_page as "amountPage", f.amount_x as "amountX", f.amount_y as "amountY",
              f.placements,
              f.oa_placements as "oaPlacements",
              f.oa_name_page as "oaNamePage", f.oa_name_x as "oaNameX", f.oa_name_y as "oaNameY",
              f.oa_date_page as "oaDatePage", f.oa_date_x as "oaDateX", f.oa_date_y as "oaDateY",
              f.oa_signature_page as "oaSignaturePage", f.oa_signature_x as "oaSignatureX", f.oa_signature_y as "oaSignatureY",
              f.oa_amount_page as "oaAmountPage", f.oa_amount_x as "oaAmountX", f.oa_amount_y as "oaAmountY",
              COALESCE(stats.total_investors, 0)::int as "totalInvestors",
              COALESCE(stats.total_aum, 0)::float as "totalAUM"
       FROM funds f
       LEFT JOIN (
           SELECT fund_id, COUNT(DISTINCT user_id) as total_investors, SUM(amount) as total_aum
           FROM (
               SELECT fund_id, user_id, amount FROM fund_flows
               UNION ALL
               SELECT fund_id, user_id, investment_amount as amount FROM investments
               WHERE is_reconciled = true
               UNION ALL
               SELECT inv.fund_id, r.investor_id as user_id, -r.amount as amount FROM redemptions r
               JOIN investments inv ON r.investment_id = inv.id
               WHERE r.is_reconciled = true
           ) combined
           GROUP BY fund_id
       ) stats ON f.id = stats.fund_id
       WHERE f.id = $1`,
      [id]
    );
    const fund = result.rows[0];
    if (!fund) {
      throw new NotFoundException('Fund not found');
    }
    return fund;
  }

  async createFund(data: {
    name: string;
    description: string;
    image_url: string;
    start_date?: string;
    status?: string;
    note?: string;
    min_investment?: number;
    unit_price?: number;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    beneficiaryName?: string;
    bankAddress?: string;
    subscriptionDocPath?: string;
    oaDocPath?: string;
    anchorName?: string;
    anchorDate?: string;
    anchorSignature?: string;
    anchorAmount?: string;
    namePage?: number;
    nameX?: number;
    nameY?: number;
    datePage?: number;
    dateX?: number;
    dateY?: number;
    signaturePage?: number;
    signatureX?: number;
    signatureY?: number;
    amountPage?: number;
    amountX?: number;
    amountY?: number;
    placements?: any[];
    oaNamePage?: number;
    oaNameX?: number;
    oaNameY?: number;
    oaDatePage?: number;
    oaDateX?: number;
    oaDateY?: number;
    oaSignaturePage?: number;
    oaSignatureX?: number;
    oaSignatureY?: number;
    oaAmountPage?: number;
    oaAmountX?: number;
    oaAmountY?: number;
    oaPlacements?: any[];
  }) {
    const result = await db.query(
      `INSERT INTO funds (
        name, description, image_url, start_date, status, note, 
        min_investment, unit_price, bank_name, account_number, 
        routing_number, beneficiary_name, bank_address,
        subscription_doc_path, oa_doc_path, anchor_name, anchor_date, anchor_signature, anchor_amount,
        name_page, name_x, name_y,
        date_page, date_x, date_y,
        signature_page, signature_x, signature_y,
        amount_page, amount_x, amount_y,
        placements,
        oa_name_page, oa_name_x, oa_name_y,
        oa_date_page, oa_date_x, oa_date_y,
        oa_signature_page, oa_signature_x, oa_signature_y,
        oa_amount_page, oa_amount_x, oa_amount_y,
        oa_placements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45) RETURNING *`,
      [
        data.name,
        data.description,
        data.image_url,
        data.start_date || new Date().toISOString().split('T')[0],
        data.status || 'Active',
        data.note || '',
        data.min_investment || 0,
        data.unit_price || 1.00,
        data.bankName || null,
        data.accountNumber || null,
        data.routingNumber || null,
        data.beneficiaryName || null,
        data.bankAddress || null,
        data.subscriptionDocPath || null,
        data.oaDocPath || null,
        data.anchorName || null,
        data.anchorDate || null,
        data.anchorSignature || null,
        data.anchorAmount || null,
        data.namePage || null,
        data.nameX || null,
        data.nameY || null,
        data.datePage || null,
        data.dateX || null,
        data.dateY || null,
        data.signaturePage || null,
        data.signatureX || null,
        data.signatureY || null,
        data.amountPage || null,
        data.amountX || null,
        data.amountY || null,
        data.placements ? JSON.stringify(data.placements) : null,
        data.oaNamePage || null,
        data.oaNameX || null,
        data.oaNameY || null,
        data.oaDatePage || null,
        data.oaDateX || null,
        data.oaDateY || null,
        data.oaSignaturePage || null,
        data.oaSignatureX || null,
        data.oaSignatureY || null,
        data.oaAmountPage || null,
        data.oaAmountX || null,
        data.oaAmountY || null,
        data.oaPlacements ? JSON.stringify(data.oaPlacements) : null
      ]
    );
    return result.rows[0];
  }

  async updateFund(id: string, data: Partial<{
    name: string;
    description: string;
    image_url: string;
    start_date: string;
    status: string;
    note: string;
    min_investment: number;
    unit_price: number;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    beneficiaryName: string;
    bankAddress: string;
    subscriptionDocPath: string;
    oaDocPath: string;
    anchorName: string;
    anchorDate: string;
    anchorSignature: string;
    anchorAmount: string;
    namePage: number;
    nameX: number;
    nameY: number;
    datePage: number;
    dateX: number;
    dateY: number;
    signaturePage: number;
    signatureX: number;
    signatureY: number;
    amountPage: number;
    amountX: number;
    amountY: number;
    placements: any[];
    oaNamePage: number;
    oaNameX: number;
    oaNameY: number;
    oaDatePage: number;
    oaDateX: number;
    oaDateY: number;
    oaSignaturePage: number;
    oaSignatureX: number;
    oaSignatureY: number;
    oaAmountPage: number;
    oaAmountX: number;
    oaAmountY: number;
    oaPlacements: any[];
  }>) {
    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.image_url);
    }
    if (data.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(data.start_date);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      values.push(data.note);
    }
    if (data.min_investment !== undefined) {
      updates.push(`min_investment = $${paramIndex++}`);
      values.push(data.min_investment);
    }
    if (data.unit_price !== undefined) {
      updates.push(`unit_price = $${paramIndex++}`);
      values.push(data.unit_price);
    }
    if (data.bankName !== undefined) {
      updates.push(`bank_name = $${paramIndex++}`);
      values.push(data.bankName);
    }
    if (data.accountNumber !== undefined) {
      updates.push(`account_number = $${paramIndex++}`);
      values.push(data.accountNumber);
    }
    if (data.routingNumber !== undefined) {
      updates.push(`routing_number = $${paramIndex++}`);
      values.push(data.routingNumber);
    }
    if (data.beneficiaryName !== undefined) {
      updates.push(`beneficiary_name = $${paramIndex++}`);
      values.push(data.beneficiaryName);
    }
    if (data.bankAddress !== undefined) {
      updates.push(`bank_address = $${paramIndex++}`);
      values.push(data.bankAddress);
    }
    if (data.subscriptionDocPath !== undefined) {
      updates.push(`subscription_doc_path = $${paramIndex++}`);
      values.push(data.subscriptionDocPath);
    }
    if (data.oaDocPath !== undefined) {
      updates.push(`oa_doc_path = $${paramIndex++}`);
      values.push(data.oaDocPath);
    }
    if (data.anchorName !== undefined) {
      updates.push(`anchor_name = $${paramIndex++}`);
      values.push(data.anchorName);
    }
    if (data.anchorDate !== undefined) {
      updates.push(`anchor_date = $${paramIndex++}`);
      values.push(data.anchorDate);
    }
    if (data.anchorSignature !== undefined) {
      updates.push(`anchor_signature = $${paramIndex++}`);
      values.push(data.anchorSignature);
    }
    if (data.anchorAmount !== undefined) {
      updates.push(`anchor_amount = $${paramIndex++}`);
      values.push(data.anchorAmount);
    }
    if (data.namePage !== undefined) {
      updates.push(`name_page = $${paramIndex++}`);
      values.push(data.namePage);
    }
    if (data.nameX !== undefined) {
      updates.push(`name_x = $${paramIndex++}`);
      values.push(data.nameX);
    }
    if (data.nameY !== undefined) {
      updates.push(`name_y = $${paramIndex++}`);
      values.push(data.nameY);
    }
    if (data.datePage !== undefined) {
      updates.push(`date_page = $${paramIndex++}`);
      values.push(data.datePage);
    }
    if (data.dateX !== undefined) {
      updates.push(`date_x = $${paramIndex++}`);
      values.push(data.dateX);
    }
    if (data.dateY !== undefined) {
      updates.push(`date_y = $${paramIndex++}`);
      values.push(data.dateY);
    }
    if (data.signaturePage !== undefined) {
      updates.push(`signature_page = $${paramIndex++}`);
      values.push(data.signaturePage);
    }
    if (data.signatureX !== undefined) {
      updates.push(`signature_x = $${paramIndex++}`);
      values.push(data.signatureX);
    }
    if (data.signatureY !== undefined) {
      updates.push(`signature_y = $${paramIndex++}`);
      values.push(data.signatureY);
    }
    if (data.amountPage !== undefined) {
      updates.push(`amount_page = $${paramIndex++}`);
      values.push(data.amountPage);
    }
    if (data.amountX !== undefined) {
      updates.push(`amount_x = $${paramIndex++}`);
      values.push(data.amountX);
    }
    if (data.amountY !== undefined) {
      updates.push(`amount_y = $${paramIndex++}`);
      values.push(data.amountY);
    }
    if (data.placements !== undefined) {
      updates.push(`placements = $${paramIndex++}`);
      values.push(data.placements ? JSON.stringify(data.placements) : null);
    }
    if (data.oaNamePage !== undefined) {
      updates.push(`oa_name_page = $${paramIndex++}`);
      values.push(data.oaNamePage);
    }
    if (data.oaNameX !== undefined) {
      updates.push(`oa_name_x = $${paramIndex++}`);
      values.push(data.oaNameX);
    }
    if (data.oaNameY !== undefined) {
      updates.push(`oa_name_y = $${paramIndex++}`);
      values.push(data.oaNameY);
    }
    if (data.oaDatePage !== undefined) {
      updates.push(`oa_date_page = $${paramIndex++}`);
      values.push(data.oaDatePage);
    }
    if (data.oaDateX !== undefined) {
      updates.push(`oa_date_x = $${paramIndex++}`);
      values.push(data.oaDateX);
    }
    if (data.oaDateY !== undefined) {
      updates.push(`oa_date_y = $${paramIndex++}`);
      values.push(data.oaDateY);
    }
    if (data.oaSignaturePage !== undefined) {
      updates.push(`oa_signature_page = $${paramIndex++}`);
      values.push(data.oaSignaturePage);
    }
    if (data.oaSignatureX !== undefined) {
      updates.push(`oa_signature_x = $${paramIndex++}`);
      values.push(data.oaSignatureX);
    }
    if (data.oaSignatureY !== undefined) {
      updates.push(`oa_signature_y = $${paramIndex++}`);
      values.push(data.oaSignatureY);
    }
    if (data.oaAmountPage !== undefined) {
      updates.push(`oa_amount_page = $${paramIndex++}`);
      values.push(data.oaAmountPage);
    }
    if (data.oaAmountX !== undefined) {
      updates.push(`oa_amount_x = $${paramIndex++}`);
      values.push(data.oaAmountX);
    }
    if (data.oaAmountY !== undefined) {
      updates.push(`oa_amount_y = $${paramIndex++}`);
      values.push(data.oaAmountY);
    }
    if (data.oaPlacements !== undefined) {
      updates.push(`oa_placements = $${paramIndex++}`);
      values.push(data.oaPlacements ? JSON.stringify(data.oaPlacements) : null);
    }

    if (values.length === 0) return this.getFundById(id);

    values.push(id);
    const result = await db.query(
      `UPDATE funds SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Fund not found');
    }
    return result.rows[0];
  }

  async deleteFund(id: string) {
    const checkInvestments = await db.query('SELECT COUNT(*)::int as count FROM investments WHERE fund_id = $1', [id]);
    const count = checkInvestments.rows[0]?.count || 0;
    if (count > 0) {
      throw new BadRequestException('Cannot delete this fund because there are active or past investments associated with it.');
    }

    const result = await db.query('DELETE FROM funds WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Fund not found');
    }
    return { message: 'Fund deleted successfully' };
  }

  async getOldFunds() {
    const result = await db.query(
      `SELECT project_id as "projectId", project_name as "projectName", project_type as "projectType",
              status, total_capital as "totalCapital", distributions_to_date as "distributionsToDate",
              total_investors as "totalInvestors", closing_date as "closingDate", exit_date as "exitDate",
              published
       FROM old_funds
       ORDER BY project_name ASC`
    );
    return result.rows;
  }

  async getOldFundById(id: number) {
    const result = await db.query(
      `SELECT project_id as "projectId", project_name as "projectName", project_type as "projectType",
              status, total_capital as "totalCapital", distributions_to_date as "distributionsToDate",
              total_investors as "totalInvestors", closing_date as "closingDate", exit_date as "exitDate",
              published
       FROM old_funds
       WHERE project_id = $1`,
      [id]
    );
    const fund = result.rows[0];
    if (!fund) {
      throw new NotFoundException('Old fund not found');
    }

    // Fetch all registered emails safely
    const registeredEmailsSet = new Set<string>();
    try {
      const registeredEmailsRes = await db.query(`SELECT LOWER(TRIM(email)) as email FROM investors WHERE email IS NOT NULL`);
      registeredEmailsRes.rows.forEach((r: any) => {
        if (r.email) registeredEmailsSet.add(r.email);
      });
    } catch (err) {
      console.warn('Could not fetch registered investor emails:', err);
    }

    // Step 1: Fetch all investments for this fund in a single query (avoiding N+1 timeouts on Vercel)
    const allInvestmentsRes = await db.query(
      `SELECT * FROM old_investments WHERE project_id = $1`,
      [id]
    );

    const profileGroups = new Map<string, any[]>();
    for (const row of allInvestmentsRes.rows) {
      const pid = String(row.investor_profile_id || '');
      if (!pid) continue;
      if (!profileGroups.has(pid)) {
        profileGroups.set(pid, []);
      }
      profileGroups.get(pid)!.push(row);
    }

    const investorsList: any[] = [];
    for (const [pid, rows] of profileGroups.entries()) {
      let totalInvestment = 0;
      let totalShares = 0;
      let totalOwnership = 0;

      rows.forEach(invRow => {
        const numAmount = parseFloat((invRow.investment_amount || invRow.amount)?.replace(/[\$,]/g, '') || '0');
        const numShares = parseFloat(invRow.shares || '0');
        const numOwnership = parseFloat(invRow.ownership?.replace(/%/g, '') || '0');
        totalInvestment += numAmount;
        totalShares += numShares;
        totalOwnership += numOwnership;
      });

      const primaryRow = rows[0];
      const emailVal = primaryRow.email_address || primaryRow.email || '';
      const cleanEmail = emailVal.trim().toLowerCase();

      investorsList.push({
        id: null,
        fullName: primaryRow.investor_profile_legal_name || primaryRow.fullName || 'Unknown Investor',
        email: emailVal,
        phone: null,
        profileImageUrl: null,
        kycStatus: 'verified',
        status: primaryRow.investment_status || primaryRow.status || 'Accepted',
        externalId: pid,
        isRegistered: registeredEmailsSet.has(cleanEmail),
        totalInvestment: '$' + totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalShares: totalShares.toFixed(2),
        totalOwnership: totalOwnership.toFixed(2) + '%',
        className: primaryRow.class_name || primaryRow.className || 'Default Class'
      });
    }

    fund.investors = investorsList;

    // Fetch distributions using safe SELECT * to prevent 500 schema mismatch errors if new columns are missing on Vercel DB
    let distRows: any[] = [];
    try {
      const distResult = await db.query(
        `SELECT * FROM distributions WHERE project_id = $1 AND batch_status NOT IN ('0', '3', 'Draft', 'Rejected')`,
        [id]
      );
      distRows = distResult.rows;
    } catch (err) {
      console.warn('Could not query distributions table:', err);
    }

    const batchesMap = new Map<number, any>();
    for (const row of distRows) {
      const batchId = row.distribution_batch_id || row.distributionBatchId;
      if (batchId === undefined || batchId === null) continue;
      const numAmount = parseFloat((row.calculated_amount || row.amount)?.replace(/[\$,]/g, '') || '0');

      if (!batchesMap.has(batchId)) {
        batchesMap.set(batchId, {
          distributionBatchId: batchId,
          distributionType: row.distribution_type || row.distributionType || 'Distribution',
          status: row.batch_status || row.status || 'Distributed',
          payDate: row.batch_pay_date || row.payDate || '',
          periodStartDate: row.batch_start_date || row.periodStartDate || '',
          periodEndDate: row.batch_end_date || row.periodEndDate || '',
          batchDescription: row.batch_description || row.batchDescription || '',
          dashboardDescription: row.dashboard_description || row.dashboardDescription || '',
          sendMethod: row.send_method || row.sendMethod || 'Check',
          totalAmountNumeric: 0
        });
      }

      const batch = batchesMap.get(batchId);
      if (!isNaN(numAmount)) {
        batch.totalAmountNumeric += numAmount;
      }
    }

    fund.distributions = Array.from(batchesMap.values()).map(b => ({
      distributionBatchId: b.distributionBatchId,
      distributionType: b.distributionType,
      status: b.status,
      payDate: b.payDate,
      periodStartDate: b.periodStartDate,
      periodEndDate: b.periodEndDate,
      batchDescription: b.batchDescription,
      dashboardDescription: b.dashboardDescription,
      sendMethod: b.sendMethod,
      totalAmount: '$' + Number(b.totalAmountNumeric.toFixed(2)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    })).sort((a, b) => Number(b.distributionBatchId) - Number(a.distributionBatchId));

    return fund;
  }

  async getOldFundInvestor(fundId: number, profileId: number) {
    const result = await db.query(
      `SELECT investor_profile_legal_name as "fullName",
              email_address as "email",
              investment_amount as "amount",
              shares,
              ownership,
              placed_on as "placedOn",
              received_on as "receivedOn",
              investment_status as "status",
              project_name as "projectName"
       FROM old_investments
       WHERE project_id = $1 AND investor_profile_id = $2`,
      [fundId, profileId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Investor records not found for this fund');
    }

    let totalInvestment = 0;
    let totalShares = 0;

    result.rows.forEach(invRow => {
      const numAmount = parseFloat(invRow.amount?.replace(/[\$,]/g, '') || '0');
      const numShares = parseFloat(invRow.shares || '0');
      totalInvestment += numAmount;
      totalShares += numShares;
    });

    const primaryRow = result.rows[0];

    return {
      fullName: primaryRow.fullName,
      email: primaryRow.email,
      profileId: String(profileId),
      projectName: primaryRow.projectName,
      totalInvestment: '$' + totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalShares: totalShares.toFixed(2),
      investments: result.rows.map(r => ({
        amount: r.amount,
        shares: r.shares,
        ownership: r.ownership,
        placedOn: r.placedOn,
        receivedOn: r.receivedOn,
        status: r.status
      }))
    };
  }



  async getOldFundDistributionBatch(fundId: number, batchId: number) {
    const result = await db.query(
      `SELECT * FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    const investorsMap = new Map<number, any>();
    for (const row of result.rows) {
      const pid = row.investor_profile_id || row.investorProfileId;
      const calcAmt = parseFloat((row.calculated_amount || row.calculatedAmount)?.replace(/[\$,]/g, '') || '0');
      const rocAmt = parseFloat((row.return_of_capital || row.returnOfCapital)?.replace(/[\$,]/g, '') || '0');
      const invAmt = parseFloat((row.investment_amount || row.investmentAmount)?.replace(/[\$,]/g, '') || '0');

      if (!investorsMap.has(pid)) {
        investorsMap.set(pid, {
          investorProfileId: pid,
          investorName: row.investor_profile_legal_name || row.investorName || 'Unknown Investor',
          calculatedAmountNumeric: 0,
          returnOfCapitalNumeric: 0,
          investmentAmountNumeric: 0,
          sendMethod: row.send_method || row.sendMethod || 'Check'
        });
      }

      const inst = investorsMap.get(pid);
      if (!isNaN(calcAmt)) inst.calculatedAmountNumeric += calcAmt;
      if (!isNaN(rocAmt)) inst.returnOfCapitalNumeric += rocAmt;
      if (!isNaN(invAmt)) inst.investmentAmountNumeric += invAmt;
    }

    return Array.from(investorsMap.values()).map(inv => ({
      investorProfileId: String(inv.investorProfileId),
      investorName: inv.investorName,
      calculatedAmount: '$' + inv.calculatedAmountNumeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      distributedAmount: '$' + inv.returnOfCapitalNumeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      investmentAmount: '$' + inv.investmentAmountNumeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sendMethod: inv.sendMethod
    }));
  }

  async getOldInvestorAllFunds(profileId: number) {
    // 1. Fetch info for this specific profile first to keep metadata consistent
    const profileInfoRes = await db.query(
      `SELECT investor_profile_legal_name as "fullName",
              email_address as "email"
       FROM old_investments
       WHERE investor_profile_id = $1
       LIMIT 1`,
      [profileId]
    );

    if (profileInfoRes.rows.length === 0) {
      throw new NotFoundException('Investor records not found');
    }

    const profileInfo = profileInfoRes.rows[0];
    const email = profileInfo.email;

    // 2. Check profile type in old_inv_profile_type table
    const typeRes = await db.query(
      `SELECT profile_type FROM old_inv_profile_type WHERE profile_id = $1`,
      [profileId]
    );
    const profileType = typeRes.rows[0]?.profile_type;
    const isIndividual = profileType === 'Individual';

    let result;
    let distResult;

    if (isIndividual && email) {
      // Fetch investments on email basis
      result = await db.query(
        `SELECT investor_profile_legal_name as "fullName",
                email_address as "email",
                investment_amount as "amount",
                shares,
                ownership,
                placed_on as "placedOn",
                received_on as "receivedOn",
                investment_status as "status",
                project_name as "projectName"
         FROM old_investments
         WHERE email_address = $1`,
        [email]
      );

      // Fetch all unique profile IDs sharing this email to get all their distributions
      const profileIdsRes = await db.query(
        `SELECT DISTINCT investor_profile_id as "id" FROM old_investments WHERE email_address = $1`,
        [email]
      );
      const profileIds = profileIdsRes.rows.map(r => r.id);

      distResult = await db.query(
        `SELECT return_of_capital as "returnOfCapital"
         FROM distributions
         WHERE investor_profile_id = ANY($1) AND batch_status IN ('1', 'Distributed')`,
        [profileIds]
      );
    } else {
      // Fetch investments strictly on ID basis
      result = await db.query(
        `SELECT investor_profile_legal_name as "fullName",
                email_address as "email",
                investment_amount as "amount",
                shares,
                ownership,
                placed_on as "placedOn",
                received_on as "receivedOn",
                investment_status as "status",
                project_name as "projectName"
         FROM old_investments
         WHERE investor_profile_id = $1`,
        [profileId]
      );

      distResult = await db.query(
        `SELECT return_of_capital as "returnOfCapital"
         FROM distributions
         WHERE investor_profile_id = $1 AND batch_status IN ('1', 'Distributed')`,
        [profileId]
      );
    }

    if (result.rows.length === 0) {
      throw new NotFoundException('Investor records not found');
    }

    let totalInvestment = 0;
    let totalShares = 0;

    result.rows.forEach(invRow => {
      const numAmount = parseFloat(invRow.amount?.replace(/[\$,]/g, '') || '0');
      const numShares = parseFloat(invRow.shares || '0');
      totalInvestment += numAmount;
      totalShares += numShares;
    });

    let totalDistributed = 0;
    distResult.rows.forEach(distRow => {
      const numDist = parseFloat(distRow.returnOfCapital?.replace(/[\$,]/g, '') || '0');
      if (!isNaN(numDist)) {
        totalDistributed += numDist;
      }
    });

    return {
      fullName: profileInfo.fullName,
      email: profileInfo.email,
      profileId: String(profileId),
      projectName: 'All Funds',
      totalInvestment: '$' + totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalShares: totalShares.toFixed(2),
      totalInvestmentsCount: result.rows.length,
      totalDistributedAmount: '$' + totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      investments: result.rows.map(r => ({
        amount: r.amount,
        shares: r.shares,
        ownership: r.ownership,
        placedOn: r.placedOn,
        receivedOn: r.receivedOn,
        status: r.status,
        projectName: r.projectName,
        investorName: r.fullName
      }))
    };
  }

  private truncateString(str: string | null | undefined, maxLength: number): string | null {
    if (str === null || str === undefined) return null;
    return str.substring(0, maxLength);
  }

  async createOldFundDistribution(fundId: number, data: {
    distributionType: string;
    batchDescription?: string;
    dashboardDescription?: string;
    periodStartDate: string;
    batchEndDate: string;
    batchPayDate: string;
    totalAmount: number;
    sendMethod: string;
  }) {
    // 1. Verify that the old fund exists
    const fundRes = await db.query(
      `SELECT project_name as "projectName", status as "projectStatus", total_capital as "totalCapital"
       FROM old_funds
       WHERE project_id = $1`,
      [fundId]
    );
    const fund = fundRes.rows[0];
    if (!fund) {
      throw new NotFoundException('Old fund not found');
    }

    // 2. Fetch all investments for this fund
    const investmentsRes = await db.query(
      `SELECT * FROM old_investments WHERE project_id = $1`,
      [fundId]
    );
    const investments = investmentsRes.rows;
    if (investments.length === 0) {
      throw new BadRequestException('No investments found for this fund to distribute to.');
    }

    // 3. Calculate sum of investment amounts
    let totalInvestmentsAmount = 0;
    const parsedInvestments = investments.map(inv => {
      const amtStr = inv.investment_amount || '$0';
      const numAmt = parseFloat(amtStr.replace(/[\$,]/g, '')) || 0;
      totalInvestmentsAmount += numAmt;
      return {
        ...inv,
        numAmt
      };
    });

    if (totalInvestmentsAmount === 0) {
      throw new BadRequestException('Total investment amount of the fund is zero.');
    }

    // 4. Generate new batch ID and start distribution ID
    const batchIdRes = await db.query(`SELECT COALESCE(MAX(distribution_batch_id), 0) + 1 as "newBatchId" FROM distributions`);
    const newBatchId = batchIdRes.rows[0].newBatchId;

    const startDistIdRes = await db.query(`SELECT COALESCE(MAX(distribution_id), 0) as "maxDistId" FROM distributions`);
    let nextDistId = startDistIdRes.rows[0].maxDistId + 1;

    // 5. Insert each distribution row
    const queryText = `
      INSERT INTO distributions (
        project_id, project_name, project_status, internal_entity_id, internal_entity,
        class_id, class_name, distribution_type, distribution_batch_id, batch_status,
        batch_start_date, batch_end_date, batch_pay_date, distribution_id, investment_id,
        investor_profile_id, investor_profile_legal_name, investment_amount, investment_placed_on_date,
        calculated_amount, preferred_return, return_of_capital, excess_cash, promote,
        fees, waterfall_fees, sideletters, batch_description, send_method, investor_gl_account, dashboard_description
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31
      )
    `;

    // Calculate unrounded pro-rata amounts and round at final stage
    const fundCapitalNum = parseFloat(fund.totalCapital?.replace(/[\$,]/g, '') || '0');
    const divisorAmount = fundCapitalNum > 0 ? fundCapitalNum : totalInvestmentsAmount;
    const calculatedAmounts = parsedInvestments.map(inv => {
      const rawAmt = (inv.numAmt / divisorAmount) * data.totalAmount;
      return Number(rawAmt.toFixed(2));
    });

    const currentSum = Number(calculatedAmounts.reduce((sum, val) => sum + val, 0).toFixed(2));
    const targetTotal = Number(data.totalAmount.toFixed(2));
    const diff = Number((targetTotal - currentSum).toFixed(2));

    if (diff !== 0 && calculatedAmounts.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < parsedInvestments.length; i++) {
        if (parsedInvestments[i].numAmt > parsedInvestments[maxIdx].numAmt) {
          maxIdx = i;
        }
      }
      calculatedAmounts[maxIdx] = Number((calculatedAmounts[maxIdx] + diff).toFixed(2));
    }

    for (let idx = 0; idx < parsedInvestments.length; idx++) {
      const inv = parsedInvestments[idx];
      const proRataAmount = calculatedAmounts[idx];
      const formattedCalculatedAmount = '$' + proRataAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const prefReturn = '$-';
      const retCapital = formattedCalculatedAmount;

      const values = [
        fundId, // $1
        this.truncateString(inv.project_name || fund.projectName, 46), // $2
        this.truncateString(inv.project_status || fund.projectStatus, 9), // $3
        inv.internal_entity_id, // $4
        this.truncateString(inv.internal_entity, 29), // $5
        inv.class_id, // $6
        this.truncateString(inv.class_name, 7), // $7
        this.truncateString(data.distributionType, 17), // $8
        newBatchId, // $9
        'Pending for Approval', // $10 (batch_status)
        data.periodStartDate, // $11
        data.batchEndDate, // $12
        data.batchPayDate, // $13
        nextDistId++, // $14 (distribution_id)
        inv.investment_ownership_id, // $15 (investment_id)
        inv.investor_profile_id, // $16
        this.truncateString(inv.investor_profile_legal_name, 66), // $17
        this.truncateString(inv.investment_amount, 45), // $18
        inv.placed_on, // $19
        this.truncateString(formattedCalculatedAmount, 45), // $20 (calculated_amount)
        this.truncateString(prefReturn, 6), // $21 (preferred_return)
        this.truncateString(retCapital, 45), // $22 (return_of_capital)
        '$-', // $23 (excess_cash)
        '$-', // $24 (promote)
        '$-', // $25 (fees)
        null, // $26 (waterfall_fees)
        null, // $27 (sideletters)
        this.truncateString(data.batchDescription || null, 25), // $28 (batch_description)
        this.truncateString(data.sendMethod || 'Check', 5), // $29 (send_method)
        null, // $30 (investor_gl_account)
        this.truncateString(data.dashboardDescription || null, 255) // $31 (dashboard_description)
      ];

      await db.query(queryText, values);
    }

    return {
      message: 'Distribution batch added successfully',
      batchId: newBatchId,
      totalDistributed: '$' + data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  }

  async updateOldFundDistribution(fundId: number, batchId: number, data: {
    distributionType: string;
    batchDescription?: string;
    dashboardDescription?: string;
    periodStartDate: string;
    batchEndDate: string;
    batchPayDate: string;
    totalAmount: number;
    sendMethod: string;
  }) {
    // 1. Verify batch exists and is NOT approved
    const batchRes = await db.query(
      `SELECT DISTINCT batch_status as "status" FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );
    if (batchRes.rows.length === 0) {
      throw new NotFoundException('Distribution batch not found');
    }
    if (batchRes.rows[0].status === '1') {
      throw new BadRequestException('Approved distribution batches cannot be modified');
    }

    // 2. Fetch all investments for this fund to recalculate
    const investmentsRes = await db.query(
      `SELECT * FROM old_investments WHERE project_id = $1`,
      [fundId]
    );
    const investments = investmentsRes.rows;
    if (investments.length === 0) {
      throw new BadRequestException('No investments found for this fund.');
    }

    let totalInvestmentsAmount = 0;
    const parsedInvestments = investments.map(inv => {
      const amtStr = inv.investment_amount || '$0';
      const numAmt = parseFloat(amtStr.replace(/[\$,]/g, '')) || 0;
      totalInvestmentsAmount += numAmt;
      return { ...inv, numAmt };
    });

    if (totalInvestmentsAmount === 0) {
      throw new BadRequestException('Total investment amount of the fund is zero.');
    }

    // Get distribution IDs to preserve order
    const minDistIdRes = await db.query(
      `SELECT MIN(distribution_id) as "minDistId" FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );
    let nextDistId = minDistIdRes.rows[0].minDistId;
    if (!nextDistId) {
      const startDistIdRes = await db.query(`SELECT COALESCE(MAX(distribution_id), 0) as "maxDistId" FROM distributions`);
      nextDistId = startDistIdRes.rows[0].maxDistId + 1;
    }

    // Delete existing records
    await db.query(
      `DELETE FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    // Insert updated records
    const queryText = `
      INSERT INTO distributions (
        project_id, project_name, project_status, internal_entity_id, internal_entity,
        class_id, class_name, distribution_type, distribution_batch_id, batch_status,
        batch_start_date, batch_end_date, batch_pay_date, distribution_id, investment_id,
        investor_profile_id, investor_profile_legal_name, investment_amount, investment_placed_on_date,
        calculated_amount, preferred_return, return_of_capital, excess_cash, promote,
        fees, waterfall_fees, sideletters, batch_description, send_method, investor_gl_account, dashboard_description
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31
      )
    `;

    const fundRes = await db.query(
      `SELECT project_name as "projectName", status as "projectStatus" FROM old_funds WHERE project_id = $1`,
      [fundId]
    );
    const fund = fundRes.rows[0] || { projectName: 'Old Fund', projectStatus: 'Closed' };

    // Calculate unrounded pro-rata amounts and round at final stage
    const calculatedAmounts = parsedInvestments.map(inv => {
      const rawAmt = (inv.numAmt / totalInvestmentsAmount) * data.totalAmount;
      return Number(rawAmt.toFixed(2));
    });

    const currentSum = Number(calculatedAmounts.reduce((sum, val) => sum + val, 0).toFixed(2));
    const targetTotal = Number(data.totalAmount.toFixed(2));
    const diff = Number((targetTotal - currentSum).toFixed(2));

    if (diff !== 0 && calculatedAmounts.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < parsedInvestments.length; i++) {
        if (parsedInvestments[i].numAmt > parsedInvestments[maxIdx].numAmt) {
          maxIdx = i;
        }
      }
      calculatedAmounts[maxIdx] = Number((calculatedAmounts[maxIdx] + diff).toFixed(2));
    }

    for (let idx = 0; idx < parsedInvestments.length; idx++) {
      const inv = parsedInvestments[idx];
      const proRataAmount = calculatedAmounts[idx];
      const formattedCalculatedAmount = '$' + proRataAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const prefReturn = '$-';
      const retCapital = formattedCalculatedAmount;

      const values = [
        fundId, // $1
        this.truncateString(inv.project_name || fund.projectName, 46), // $2
        this.truncateString(inv.project_status || fund.projectStatus, 9), // $3
        inv.internal_entity_id, // $4
        this.truncateString(inv.internal_entity, 29), // $5
        inv.class_id, // $6
        this.truncateString(inv.class_name, 7), // $7
        this.truncateString(data.distributionType, 17), // $8
        batchId, // $9
        'Pending for Approval', // $10 (batch_status)
        data.periodStartDate, // $11
        data.batchEndDate, // $12
        data.batchPayDate, // $13
        nextDistId++, // $14 (distribution_id)
        inv.investment_ownership_id, // $15 (investment_id)
        inv.investor_profile_id, // $16
        this.truncateString(inv.investor_profile_legal_name, 66), // $17
        this.truncateString(inv.investment_amount, 45), // $18
        inv.placed_on, // $19
        this.truncateString(formattedCalculatedAmount, 45), // $20 (calculated_amount)
        this.truncateString(prefReturn, 6), // $21 (preferred_return)
        this.truncateString(retCapital, 45), // $22 (return_of_capital)
        '$-', // $23 (excess_cash)
        '$-', // $24 (promote)
        '$-', // $25 (fees)
        null, // $26 (waterfall_fees)
        null, // $27 (sideletters)
        this.truncateString(data.batchDescription || null, 25), // $28 (batch_description)
        this.truncateString(data.sendMethod || 'Check', 5), // $29 (send_method)
        null, // $30 (investor_gl_account)
        this.truncateString(data.dashboardDescription || null, 255) // $31 (dashboard_description)
      ];

      await db.query(queryText, values);
    }

    return {
      message: 'Distribution batch updated successfully',
      batchId,
      totalDistributed: '$' + data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  }

  async submitOldFundDistribution(fundId: number, batchId: number) {
    // 1. Verify that the batch exists
    const batchRes = await db.query(
      `SELECT DISTINCT batch_status as "status" FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    if (batchRes.rows.length === 0) {
      throw new NotFoundException('Distribution batch not found');
    }

    if (batchRes.rows[0].status !== '0') {
      throw new BadRequestException('Only draft distribution batches can be sent for approval');
    }

    // 2. Update status of the batch to '2' (Pending Approval) in the distributions table
    await db.query(
      `UPDATE distributions 
       SET batch_status = 'Pending for Approval' 
       WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    return {
      message: 'Distribution batch sent for approval successfully',
      batchId
    };
  }

  async approveOldFundDistribution(fundId: number, batchId: number) {
    // 1. Verify that the batch exists and get its total amount
    const batchRes = await db.query(
      `SELECT calculated_amount FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    if (batchRes.rows.length === 0) {
      throw new NotFoundException('Distribution batch not found');
    }

    // Check if it's already approved
    const firstRowStatus = await db.query(
      `SELECT DISTINCT batch_status as "status" FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );
    if (firstRowStatus.rows[0]?.status === '1' || firstRowStatus.rows[0]?.status === 'Distributed') {
      throw new BadRequestException('Distribution batch is already approved');
    }

    let batchTotal = 0;
    for (const row of batchRes.rows) {
      const amt = parseFloat(row.calculated_amount?.replace(/[\$,]/g, '') || '0');
      if (!isNaN(amt)) {
        batchTotal += amt;
      }
    }

    // 2. Update status of the batch to 'Distributed' in the distributions table
    await db.query(
      `UPDATE distributions 
       SET batch_status = 'Distributed' 
       WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    // 3. Update the distributions_to_date in the old_funds table
    const currentDistRes = await db.query(`SELECT distributions_to_date as "dist" FROM old_funds WHERE project_id = $1`, [fundId]);
    const currentDistStr = currentDistRes.rows[0]?.dist || '$0';
    const currentDistNum = parseFloat(currentDistStr.replace(/[\$,]/g, '')) || 0;
    const newDistNum = currentDistNum + batchTotal;
    const newDistStr = '$' + newDistNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    await db.query(
      `UPDATE old_funds SET distributions_to_date = $1 WHERE project_id = $2`,
      [newDistStr, fundId]
    );

    return {
      message: 'Distribution batch approved successfully',
      batchId,
      totalDistributed: newDistStr
    };
  }

  async rejectOldFundDistribution(fundId: number, batchId: number) {
    // Verify batch exists
    const batchRes = await db.query(
      `SELECT DISTINCT batch_status as "status" FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );
    if (batchRes.rows.length === 0) {
      throw new NotFoundException('Distribution batch not found');
    }
    if (batchRes.rows[0].status === '1' || batchRes.rows[0].status === 'Distributed') {
      throw new BadRequestException('Approved distribution batches cannot be rejected');
    }

    // Change status to 'Rejected' — records are preserved
    await db.query(
      `UPDATE distributions SET batch_status = 'Rejected' WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );

    return {
      message: 'Distribution batch rejected successfully',
      batchId
    };
  }

  async deleteOldFundDistribution(fundId: number, batchId: number) {
    const firstRowStatus = await db.query(
      `SELECT DISTINCT batch_status as "status" FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );
    if (firstRowStatus.rows.length === 0) {
      throw new NotFoundException('Distribution batch not found');
    }
    await db.query(
      `DELETE FROM distributions WHERE project_id = $1 AND distribution_batch_id = $2`,
      [fundId, batchId]
    );
    return {
      message: 'Distribution batch deleted successfully',
      batchId
    };
  }
}

