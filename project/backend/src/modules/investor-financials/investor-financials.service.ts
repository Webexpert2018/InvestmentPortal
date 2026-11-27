import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';
import { CreateInvestorFinancialDto } from './dto/create-investor-financial.dto';
import { UpdateInvestorFinancialDto } from './dto/update-investor-financial.dto';

@Injectable()
export class InvestorFinancialsService {
  async findAll(search?: string) {
    let query = `
      SELECT 
        f.id,
        f.name,
        f.email,
        f.investor_id,
        f.income::float as income,
        f.expenses::float as expenses,
        f.liability::float as liability,
        f.assets::float as assets,
        f.notes,
        f.image_url as "imageUrl",
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        i.full_name as "investorName",
        i.email as "investorEmail",
        i.kyc_status as "investorKycStatus"
      FROM investor_financials f
      LEFT JOIN investors i ON f.investor_id = i.id
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += `
        WHERE LOWER(COALESCE(f.name, '')) LIKE $1 
           OR LOWER(COALESCE(f.email, '')) LIKE $1 
           OR LOWER(COALESCE(i.full_name, '')) LIKE $1 
           OR LOWER(COALESCE(i.email, '')) LIKE $1
      `;
    }

    query += ` ORDER BY f.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  async findByInvestorId(investorId: string) {
    const result = await db.query(
      `
      SELECT 
        f.id,
        f.name,
        f.email,
        f.investor_id,
        f.income::float as income,
        f.expenses::float as expenses,
        f.liability::float as liability,
        f.assets::float as assets,
        f.notes,
        f.image_url as "imageUrl",
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        i.full_name as "investorName",
        i.email as "investorEmail"
      FROM investor_financials f
      LEFT JOIN investors i ON f.investor_id = i.id
      WHERE f.investor_id = $1
      ORDER BY f.created_at DESC
      LIMIT 1
      `,
      [investorId]
    );

    return result.rows[0] || null;
  }

  async findOne(id: string) {
    const result = await db.query(
      `
      SELECT 
        f.id,
        f.name,
        f.email,
        f.investor_id,
        f.income::float as income,
        f.expenses::float as expenses,
        f.liability::float as liability,
        f.assets::float as assets,
        f.notes,
        f.image_url as "imageUrl",
        f.created_at as "createdAt",
        f.updated_at as "updatedAt",
        i.full_name as "investorName",
        i.email as "investorEmail"
      FROM investor_financials f
      LEFT JOIN investors i ON f.investor_id = i.id
      WHERE f.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Investor financial record with ID ${id} not found`);
    }

    return result.rows[0];
  }

  async create(dto: CreateInvestorFinancialDto) {
    const result = await db.query(
      `
      INSERT INTO investor_financials (
        name,
        email,
        investor_id,
        income,
        expenses,
        liability,
        assets,
        notes,
        image_url,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING 
        id,
        name,
        email,
        investor_id,
        income::float as income,
        expenses::float as expenses,
        liability::float as liability,
        assets::float as assets,
        notes,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      `,
      [
        dto.name ?? null,
        dto.email ?? null,
        dto.investor_id ?? null,
        dto.income ?? 0,
        dto.expenses ?? 0,
        dto.liability ?? 0,
        dto.assets ?? 0,
        dto.notes ?? null,
        dto.image_url ?? null,
      ]
    );

    return result.rows[0];
  }

  async update(id: string, dto: UpdateInvestorFinancialDto) {
    // Check if exists
    const existing = await this.findOne(id);

    const updatedName = dto.name !== undefined ? dto.name : existing.name;
    const updatedEmail = dto.email !== undefined ? dto.email : existing.email;
    const updatedInvestorId = dto.investor_id !== undefined ? dto.investor_id : existing.investor_id;
    const updatedIncome = dto.income !== undefined ? dto.income : existing.income;
    const updatedExpenses = dto.expenses !== undefined ? dto.expenses : existing.expenses;
    const updatedLiability = dto.liability !== undefined ? dto.liability : existing.liability;
    const updatedAssets = dto.assets !== undefined ? dto.assets : existing.assets;
    const updatedNotes = dto.notes !== undefined ? dto.notes : existing.notes;
    const updatedImageUrl = dto.image_url !== undefined ? dto.image_url : existing.imageUrl;

    const result = await db.query(
      `
      UPDATE investor_financials
      SET 
        name = $1,
        email = $2,
        investor_id = $3,
        income = $4,
        expenses = $5,
        liability = $6,
        assets = $7,
        notes = $8,
        image_url = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING 
        id,
        name,
        email,
        investor_id,
        income::float as income,
        expenses::float as expenses,
        liability::float as liability,
        assets::float as assets,
        notes,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      `,
      [
        updatedName ?? null,
        updatedEmail ?? null,
        updatedInvestorId ?? null,
        updatedIncome ?? 0,
        updatedExpenses ?? 0,
        updatedLiability ?? 0,
        updatedAssets ?? 0,
        updatedNotes ?? null,
        updatedImageUrl ?? null,
        id,
      ]
    );

    return result.rows[0];
  }

  async updateImage(id: string, imageUrl: string) {
    await this.findOne(id);
    const result = await db.query(
      `
      UPDATE investor_financials
      SET 
        image_url = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING 
        id,
        name,
        email,
        investor_id,
        income::float as income,
        expenses::float as expenses,
        liability::float as liability,
        assets::float as assets,
        notes,
        image_url as "imageUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      `,
      [imageUrl, id]
    );

    return result.rows[0];
  }

  async delete(id: string) {
    await this.findOne(id);
    await db.query(`DELETE FROM investor_financials WHERE id = $1`, [id]);
    return { success: true, message: `Investor financial record ${id} removed` };
  }

  async searchRegisteredInvestors(search: string) {
    if (!search || !search.trim()) {
      const res = await db.query(
        `SELECT id, full_name as name, email FROM investors ORDER BY full_name ASC LIMIT 20`
      );
      return res.rows;
    }
    const param = `%${search.trim().toLowerCase()}%`;
    const res = await db.query(
      `
      SELECT id, full_name as name, email 
      FROM investors 
      WHERE LOWER(full_name) LIKE $1 OR LOWER(email) LIKE $1 
      ORDER BY full_name ASC 
      LIMIT 20
      `,
      [param]
    );
    return res.rows;
  }
}
