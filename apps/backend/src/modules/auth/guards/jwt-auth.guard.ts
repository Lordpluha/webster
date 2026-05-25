import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { Request } from "express";

import { AuthService } from "../auth.service";

type RequestWithAuth = Request & { user?: unknown; cookies: Record<string, string> };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = this.getRequest(context);

    const token = req.cookies?.access_token;
    if (!token) {
      throw new UnauthorizedException("Missing authentication token");
    }

    req.user = await this.authService.validateSession(token);
    return true;
  }

  private getRequest(context: ExecutionContext): RequestWithAuth {
    if (context.getType<string>() === "http") {
      return context.switchToHttp().getRequest<RequestWithAuth>();
    }

    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
