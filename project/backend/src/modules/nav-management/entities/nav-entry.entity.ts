import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fund_nav_history')
export class NavEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  effective_date: Date;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total_fund_value: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  total_units: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  nav_per_unit: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'varchar', length: 20, default: 'inactive' })
  status: string; // 'active', 'inactive', 'draft'

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;
}
