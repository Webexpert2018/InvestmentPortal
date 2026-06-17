import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  entityName?: string;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @IsOptional()
  notif_doc_uploaded?: boolean;

  @IsOptional()
  notif_missing_doc?: boolean;

  @IsOptional()
  notif_investor_msg?: boolean;

  @IsOptional()
  notif_reminder?: boolean;

  @IsOptional()
  notif_invest_activity?: boolean;

  @IsOptional()
  notif_funding_conf?: boolean;

  @IsOptional()
  notif_doc_uploads?: boolean;

  @IsOptional()
  notif_kyc_updates?: boolean;

  @IsOptional()
  notif_announcements?: boolean;

  @IsOptional()
  notif_sms_invest_conf?: boolean;

  @IsOptional()
  notif_sms_security?: boolean;

  @IsOptional()
  pref_send_by_email?: boolean;

  @IsOptional()
  pref_tax_forms_alert?: boolean;

  @IsOptional()
  pref_auto_download?: boolean;

  @IsOptional()
  pref_paperless?: boolean;

  @IsOptional()
  pref_format?: string;

  @IsOptional()
  pref_frequency?: string;

  @IsOptional()
  notif_alerts?: boolean;

  @IsOptional()
  notif_nav_recalc?: boolean;

  @IsOptional()
  notif_sms_announcements?: boolean;

  @IsOptional()
  notif_sms_alerts?: boolean;

  @IsOptional()
  notif_sms_doc_uploads?: boolean;

  @IsOptional()
  notif_sms_nav_recalc?: boolean;

  @IsOptional()
  notif_sms_funding_conf?: boolean;

  @IsOptional()
  notif_sms_tax_forms?: boolean;
}
