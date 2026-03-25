import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { db } from '../../config/database';
import axios from 'axios';
import { CreateAccountDto } from './dto/create-ira-account.dto';

@Injectable()
export class AccountsService {
  private readonly API_BASE = 'https://sandbox.aet.dev/api/v3';

  constructor() {}

  async getMyIraAccount(userId: string) {
    try {
      console.log('🔍 Fetching IRA account for user:', userId); // Added console.log here
      const result = await db.query(
        'SELECT * FROM ira_accounts WHERE user_id = $1::uuid',
        [userId]
      );
      return result.rows[0];
    } catch (error: any) {
      console.error('❌ Error fetching IRA account:', error.message || error);
      throw new InternalServerErrorException('Failed to fetch IRA account: ' + (error.message || 'Unknown error'));
    }
  }

  async createAccount(userId: string, dto: CreateAccountDto, token: string) {
    try {
      const response = await axios.post(
        `${this.API_BASE}/users/${userId}/accounts`,
        dto,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to create account',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}