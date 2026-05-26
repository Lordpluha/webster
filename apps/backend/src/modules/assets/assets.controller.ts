import {
    BadRequestException,
    Controller,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { AssetsService } from "./assets.service";

type AuthenticatedRequest = Request & {
  user?: { id?: string };
  body: Record<string, unknown>;
};

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException("User is not authenticated");

    const projectId = typeof req.body?.projectId === "string" ? req.body.projectId : undefined;

    return this.assetsService.uploadFile(userId, file, projectId);
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new BadRequestException("User is not authenticated");
    return this.usersService.uploadAvatar(userId, file);
  }
}
