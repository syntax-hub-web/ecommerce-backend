import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service'; // عدّل المسار حسب مشروعك

declare module 'express' {
  interface Request {
    user?: any;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly userService: UsersService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized: Missing Bearer token');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token is missing');

    const key = process.env.SECRET_KEY;
    if (!key) throw new UnauthorizedException('JWT Secret Key is missing');

    let decoded: any;
    try {
      decoded = jwt.verify(token, key);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { email, lastLogin } = decoded as {
      email?: string;
      lastLogin?: number;
    };

    if (!email || !lastLogin) {
      throw new UnauthorizedException('Invalid token: missing claims');
    }

    const user = await this.userService.findByEmail(email);
    
    if (!user) throw new UnauthorizedException('User not found');

    const dbLastLogin = user.lastLogin ? user.lastLogin.getTime() : 0;
    if (lastLogin !== dbLastLogin) {
      throw new UnauthorizedException('Token expired or rotated');
    }

    req.user = user;
    return true;
  }
}
