import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class PipelineService {
  async findAll(userId?: string, role?: string) {
    // 1. Fetch all stages ordered by order_index
    const stagesResult = await db.query(
      'SELECT id, name, color, order_index, status FROM pipeline_stages ORDER BY order_index ASC'
    );
    const stages = stagesResult.rows;
    const firstStageId = stages[0]?.id;

    // 2. Self-healing: Assign first stage to any active investors missing one
    if (firstStageId) {
      await db.query(`
        UPDATE investors 
        SET pipeline_stage_id = $1 
        WHERE status = 'active' AND pipeline_stage_id IS NULL
      `, [firstStageId]);
    }

    // 3. Fetch investors with role-based filtering
    const userRole = (role || '').toLowerCase();
    const isIR = userRole === 'investor_relations';
    
    // Admins and other staff see everyone. IR staff only see assigned investors.
    const query = `
      SELECT 
        i.id, 
        i.email,
        i.phone,
        i.full_name as name, 
        i.pipeline_stage_id, 
        i.assigned_ir_id,
        i.expected_future_investment,
        i.pipeline_note,
        s.full_name as assigned_ir_name,
        COALESCE(SUM(inv.investment_amount), 0) as total_investment
      FROM investors i
      LEFT JOIN staff s ON i.assigned_ir_id = s.id
      LEFT JOIN investments inv ON i.id = inv.user_id AND inv.is_reconciled = true
      WHERE i.pipeline_stage_id IS NOT NULL
      ${isIR ? 'AND i.assigned_ir_id = $1' : ''}
      GROUP BY i.id, i.email, i.phone, i.full_name, i.pipeline_stage_id, i.assigned_ir_id, s.full_name, i.updated_at, i.expected_future_investment, i.pipeline_note
      ORDER BY i.updated_at DESC
    `;

    const investorsResult = await db.query(query, isIR ? [userId] : []);
    const investors = investorsResult.rows;

    // 4. Group investors by stage
    return stages.map(stage => ({
      ...stage,
      count: investors.filter(i => i.pipeline_stage_id === stage.id).length,
      investors: investors
        .filter(i => i.pipeline_stage_id === stage.id)
        .map(i => ({
          id: i.id,
          name: i.name,
          email: i.email,
          phone: i.phone,
          assignedIrId: i.assigned_ir_id,
          assignedIrName: i.assigned_ir_name,
          totalInvestment: parseFloat(i.total_investment),
          expectedFutureInvestment: parseFloat(i.expected_future_investment || 0),
          pipelineNote: i.pipeline_note || '',
          avatar: i.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
        }))
    }));
  }

  async updateInvestorStage(investorId: string, stageId: number) {
    const result = await db.query(
      'UPDATE investors SET pipeline_stage_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [stageId, investorId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Investor not found');
    }

    return result.rows[0];
  }

  async updateInvestorDetails(investorId: string, details: { expectedFutureInvestment?: number, pipelineNote?: string }) {
    const { expectedFutureInvestment, pipelineNote } = details;
    
    // Build update query dynamically based on provided fields
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];
    let paramIndex = 1;

    if (expectedFutureInvestment !== undefined) {
      updates.push(`expected_future_investment = $${paramIndex++}`);
      values.push(expectedFutureInvestment);
    }

    if (pipelineNote !== undefined) {
      updates.push(`pipeline_note = $${paramIndex++}`);
      values.push(pipelineNote);
    }

    if (values.length === 0) {
      return this.dbGetInvestor(investorId);
    }

    values.push(investorId);
    const query = `UPDATE investors SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundException('Investor not found');
    }

    return result.rows[0];
  }

  private async dbGetInvestor(id: string) {
    const result = await db.query('SELECT * FROM investors WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundException('Investor not found');
    return result.rows[0];
  }

  async createStage(name: string, color: string) {
    // Get current max order_index
    const maxOrderResult = await db.query('SELECT MAX(order_index) as max_order FROM pipeline_stages');
    const maxOrder = maxOrderResult.rows[0].max_order || 0;

    const result = await db.query(
      'INSERT INTO pipeline_stages (name, color, order_index, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, color, maxOrder + 1, 'active']
    );

    return result.rows[0];
  }

  async deleteStage(id: number) {
    // Move investors in this stage back to the first stage before deleting
    const firstStageResult = await db.query('SELECT id FROM pipeline_stages ORDER BY order_index ASC LIMIT 1');
    const firstStageId = firstStageResult.rows[0]?.id;

    if (firstStageId && firstStageId !== id) {
      await db.query(
        'UPDATE investors SET pipeline_stage_id = $1 WHERE pipeline_stage_id = $2',
        [firstStageId, id]
      );
    }

    const result = await db.query('DELETE FROM pipeline_stages WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundException('Stage not found');
    }

    return { message: 'Stage deleted successfully' };
  }

  async reorderStages(stageIds: number[]) {
    // Sequentially update each stage's order_index to match its position in the array
    for (let i = 0; i < stageIds.length; i++) {
      await db.query(
        'UPDATE pipeline_stages SET order_index = $1 WHERE id = $2',
        [i + 1, stageIds[i]]
      );
    }
    return { message: 'Stages reordered successfully' };
  }

  async updateStage(id: number, name: string, color: string) {
    const result = await db.query(
      'UPDATE pipeline_stages SET name = $1, color = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, color, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Stage not found');
    }

    return result.rows[0];
  }
}
