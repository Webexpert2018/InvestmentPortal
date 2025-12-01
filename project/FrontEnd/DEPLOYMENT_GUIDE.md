# Deployment Guide - Bitcoin Custodial Investment Platform

Complete guide for deploying the Bitcoin IRA platform to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] JWT secret generated (strong, unique)
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation reviewed

---

## Backend Deployment

### Option 1: AWS ECS/Fargate (Recommended)

#### 1. Build Docker Image

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main"]
```

Build and push:

```bash
cd backend
docker build -t bitcoin-platform-api:latest .
docker tag bitcoin-platform-api:latest <your-ecr-repo>:latest
docker push <your-ecr-repo>:latest
```

#### 2. Create ECS Task Definition

```json
{
  "family": "bitcoin-platform-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<your-ecr-repo>:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:supabase-url"
        },
        {
          "name": "SUPABASE_ANON_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:supabase-key"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/bitcoin-platform",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

#### 3. Deploy with Terraform

Create `terraform/ecs.tf`:

```hcl
resource "aws_ecs_cluster" "main" {
  name = "bitcoin-platform-cluster"
}

resource "aws_ecs_service" "api" {
  name            = "bitcoin-platform-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.api.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3001
  }
}
```

Deploy:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Option 2: Heroku (Quick Start)

```bash
cd backend
heroku create bitcoin-platform-api
heroku addons:create papertrail:choklad

# Set environment variables
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set JWT_SECRET=your_secret
heroku config:set JWT_EXPIRATION=7d

# Deploy
git push heroku main
```

### Option 3: DigitalOcean App Platform

1. Connect GitHub repository
2. Select `backend` folder as source
3. Set build command: `npm run build`
4. Set run command: `npm run start:prod`
5. Add environment variables in dashboard
6. Deploy

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

Or connect GitHub repository:

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory to `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL`
5. Deploy

### Option 2: AWS Amplify

1. Connect GitHub repository
2. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. Add environment variables in Amplify console
4. Deploy

### Option 3: Netlify

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

Build settings:
- Build command: `npm run build`
- Publish directory: `.next`

---

## Database Setup

### Supabase Configuration

Database is already configured via Supabase. Ensure:

1. **Connection Pooling** enabled (PgBouncer)
2. **SSL** enforced for all connections
3. **Backups** configured (Point-in-time recovery)
4. **Monitoring** alerts set up

### Verify Migration

```bash
# Connect to Supabase
psql <your_supabase_connection_string>

# Check tables
\dt

# Verify RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

# Should show 'true' for all tables
```

### Database Maintenance

Schedule these tasks:

```sql
-- Vacuum and analyze (weekly)
VACUUM ANALYZE;

-- Update statistics (daily)
ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

---

## Environment Configuration

### Backend Environment Variables

**Production `.env`:**

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Authentication
JWT_SECRET=<generate-with: openssl rand -base64 64>
JWT_EXPIRATION=7d

# Server
PORT=3001
NODE_ENV=production

# Optional: Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Frontend Environment Variables

**Production `.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### Generating Secrets

```bash
# JWT Secret
openssl rand -base64 64

# API Key
openssl rand -hex 32

# Encryption Key
openssl rand -base64 32
```

---

## Security Hardening

### 1. HTTPS/SSL

**Backend (Nginx)**:

```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. CORS Configuration

Update `backend/src/main.ts`:

```typescript
app.enableCors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 3. Rate Limiting

Install:

```bash
npm install @nestjs/throttler
```

Configure in `app.module.ts`:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
```

### 4. Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 5. Database Security

```sql
-- Revoke public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;

-- Enable audit logging
ALTER DATABASE your_db SET log_statement = 'all';
```

---

## Monitoring & Maintenance

### 1. Application Monitoring

**Sentry Integration**:

```bash
npm install @sentry/node @sentry/nestjs
```

```typescript
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Health Checks

Create `backend/src/health/health.controller.ts`:

```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

### 3. Log Management

**CloudWatch Logs** (AWS):

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as CloudWatchTransport from 'winston-cloudwatch';

const logger = WinstonModule.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: 'bitcoin-platform',
      logStreamName: 'api',
      awsRegion: 'us-east-1',
    }),
  ],
});
```

### 4. Backup Strategy

**Automated Supabase Backups**:

- Point-in-time recovery: Enabled
- Daily snapshots: Enabled
- Retention: 30 days

**Manual Backup**:

```bash
pg_dump <connection_string> > backup_$(date +%Y%m%d).sql
```

### 5. Monitoring Dashboards

**Key Metrics to Track**:

- API response times (p50, p95, p99)
- Error rates (4xx, 5xx)
- Database query performance
- Active user sessions
- Transaction volumes
- Failed login attempts
- Document verification queue length

**Tools**:

- AWS CloudWatch
- Datadog
- New Relic
- Grafana + Prometheus

---

## Post-Deployment Checklist

- [ ] All endpoints responding correctly
- [ ] SSL certificates valid
- [ ] Database connections working
- [ ] Authentication flow working
- [ ] File uploads working
- [ ] Email notifications working (if applicable)
- [ ] Monitoring alerts configured
- [ ] Backup restore tested
- [ ] Load testing completed
- [ ] Security scan performed
- [ ] Team access configured
- [ ] Documentation updated
- [ ] Incident response plan reviewed

---

## Rollback Procedure

If deployment fails:

### Backend

```bash
# Revert to previous ECS task definition
aws ecs update-service \
  --cluster bitcoin-platform \
  --service api \
  --task-definition bitcoin-platform-api:PREVIOUS_VERSION

# Or Heroku
heroku rollback
```

### Frontend

```bash
# Vercel
vercel rollback

# Or via dashboard
```

### Database

```bash
# Restore from backup
psql <connection_string> < backup_YYYYMMDD.sql
```

---

## Support & Troubleshooting

### Common Issues

**1. Database Connection Timeout**
- Check connection pooling settings
- Verify firewall rules
- Check Supabase service status

**2. JWT Token Expiry**
- Verify JWT_SECRET matches
- Check token expiration settings
- Implement token refresh logic

**3. CORS Errors**
- Verify origin URLs in CORS config
- Check credentials setting
- Review browser console for details

### Logs Location

- **Backend**: CloudWatch Logs or `/var/log/app/`
- **Frontend**: Vercel dashboard or browser console
- **Database**: Supabase dashboard

### Emergency Contacts

- DevOps Team: devops@company.com
- Security Team: security@company.com
- On-call Engineer: +1-XXX-XXX-XXXX

---

## Maintenance Windows

Schedule regular maintenance:

- **Weekly**: Security updates, dependency patches
- **Monthly**: Performance optimization, database maintenance
- **Quarterly**: Security audit, disaster recovery testing

---

**Last Updated**: 2024-11-18
**Version**: 1.0.0
**Maintained By**: Platform Engineering Team
