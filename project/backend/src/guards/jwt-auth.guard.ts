import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.log('🔒 JWT Auth Failed:', { err, info: info?.message, user: !!user });
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
