import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class HealthController {
  @Get()
  root(@Res() res: Response) {
    res.set('Content-Type', 'text/html');
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Investment Portal API | Status</title>
          <style>
              body {
                  font-family: 'Inter', -apple-system, sans-serif;
                  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                  color: white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  text-align: center;
              }
              .container {
                  background: rgba(255, 255, 255, 0.05);
                  backdrop-filter: blur(10px);
                  padding: 3rem;
                  border-radius: 2rem;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              }
              .status-icon {
                  background: #10b981;
                  width: 64px;
                  height: 64px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto 1.5rem;
                  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
              }
              h1 { font-size: 1.875rem; margin: 0 0 0.5rem; font-weight: 700; }
              p { color: #94a3b8; margin: 0 0 2rem; }
              .badge {
                  background: rgba(16, 185, 129, 0.1);
                  color: #10b981;
                  padding: 0.5rem 1rem;
                  border-radius: 9999px;
                  font-size: 0.875rem;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="status-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
              </div>
              <h1>Investment Portal API</h1>
              <p>The backend services are running normally.</p>
              <span class="badge">System Operational</span>
          </div>
      </body>
      </html>
    `);
  }

  @Get('api')
  apiRoot() {
    return {
      message: 'Investment Portal API Root',
      status: 'ok',
      docs: '/api/docs'
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      framework: 'NestJS',
    };
  }
}
