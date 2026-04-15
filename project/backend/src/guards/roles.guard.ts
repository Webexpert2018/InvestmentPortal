import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

    // 1. If NO roles are required, let everyone through (if they pass JwtAuthGuard)
    if (!requiredRoles || !Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 2. Security check
    if (!user || !user.role) {
      throw new ForbiddenException('User not authenticated or role missing');
    }

    const userRole = user.role;

    // 3. Executive Admin has access to EVERYTHING
    if (userRole === 'executive_admin') {
      return true;
    }

    // 4. Expand required roles based on hierarchy
    const adminRoles = ['executive_admin', 'admin', 'fund_admin', 'investor_relations'];
    let expandedRequiredRoles = [...requiredRoles];
    
    if (requiredRoles.includes('admin') || requiredRoles.includes('staff')) {
      adminRoles.forEach(r => {
        if (!expandedRequiredRoles.includes(r)) {
          expandedRequiredRoles.push(r);
        }
      });
    }
    
    // 5. Final Permission Check
    const hasRole = expandedRequiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(`Insufficient permissions. Required: [${requiredRoles.join(', ')}], Found: ${userRole}`);
    }

    return true;
  }
}
