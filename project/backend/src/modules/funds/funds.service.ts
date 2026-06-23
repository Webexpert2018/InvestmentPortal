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

    // Step 1: Find unique investor profile IDs from old_investments matching this project ID
    const uniqueIdsResult = await db.query(
      `SELECT DISTINCT investor_profile_id as "investorProfileId"
       FROM old_investments
       WHERE project_id = $1`,
      [id]
    );

    const investorsList: any[] = [];

    // Step 2: Fetch details for those investors by their unique investor profile ID from old_investments
    for (const row of uniqueIdsResult.rows) {
      const profileId = row.investorProfileId;
      
      const detailsResult = await db.query(
        `SELECT investor_profile_legal_name as "fullName",
                email_address as "email",
                investment_amount as "amount",
                shares,
                investment_status as "status"
         FROM old_investments
         WHERE investor_profile_id = $1 AND project_id = $2`,
        [profileId, id]
      );

      if (detailsResult.rows.length > 0) {
        // Aggregate/calculate total investment and total shares for this investor in this fund
        let totalInvestment = 0;
        let totalShares = 0;
        
        detailsResult.rows.forEach(invRow => {
          const numAmount = parseFloat(invRow.amount?.replace(/[\$,]/g, '') || '0');
          const numShares = parseFloat(invRow.shares || '0');
          totalInvestment += numAmount;
          totalShares += numShares;
        });

        // Use the first row for name & email
        const primaryRow = detailsResult.rows[0];

        investorsList.push({
          id: null,
          fullName: primaryRow.fullName,
          email: primaryRow.email,
          phone: null,
          profileImageUrl: null,
          kycStatus: 'verified', 
          status: primaryRow.status || 'Accepted',
          externalId: String(profileId),
          isRegistered: false,
          totalInvestment: '$' + totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          totalShares: totalShares.toFixed(2)
        });
      }
    }

    fund.investors = investorsList;

    // Fetch and aggregate distributions by distribution_batch_id
    const distResult = await db.query(
      `SELECT distribution_batch_id as "distributionBatchId",
              distribution_type as "distributionType",
              batch_status as "status",
              batch_pay_date as "payDate",
              batch_start_date as "periodStartDate",
              batch_end_date as "periodEndDate",
              calculated_amount as "amount"
       FROM distributions
       WHERE project_id = $1`,
      [id]
    );

    const batchesMap = new Map<number, any>();
    for (const row of distResult.rows) {
      const batchId = row.distributionBatchId;
      const numAmount = parseFloat(row.amount?.replace(/[\$,]/g, '') || '0');

      if (!batchesMap.has(batchId)) {
        batchesMap.set(batchId, {
          distributionBatchId: batchId,
          distributionType: row.distributionType,
          status: row.status,
          payDate: row.payDate,
          periodStartDate: row.periodStartDate,
          periodEndDate: row.periodEndDate,
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
      totalAmount: '$' + b.totalAmountNumeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }));

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
}

