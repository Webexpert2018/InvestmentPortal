import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../config/database';

@Injectable()
export class PipelineService {
  async findAll() {
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

    // 3. Fetch all investors and their assigned stages
    const investorsResult = await db.query(`
      SELECT i.id, i.full_name as name, i.pipeline_stage_id, i.assigned_ir_id
      FROM investors i
      WHERE i.pipeline_stage_id IS NOT NULL
      ORDER BY i.updated_at DESC
    `);
    const investors = investorsResult.rows;

    // 3. Group investors by stage
    return stages.map(stage => ({
      ...stage,
      count: investors.filter(i => i.pipeline_stage_id === stage.id).length,
      investors: investors
        .filter(i => i.pipeline_stage_id === stage.id)
        .map(i => ({
          id: i.id,
          name: i.name,
          assignedIrId: i.assigned_ir_id,
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
}
