import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenService } from '../service/token/token.service.js';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext()?.req;

    if (!req || !req.headers?.authorization) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const parts = (req.headers.authorization as string).split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new UnauthorizedException('Invalid token format');
    }

    const token = parts[1];
    const decoded = this.tokenService.decodeToken(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.user = decoded;
    return true;
  }
}
