import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type Model } from "mongoose";

import type { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  avatarPresetPath,
  AVATAR_PRESET_IDS,
  isAvatarPresetId,
  type AvatarPresetId,
} from "./avatar-presets";
import { type OAuthProvider, UserEntity } from "./entities/user.entity";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    private readonly config: ConfigService,
  ) {}

  getAvatarPresets(): Array<{ id: string; url: string }> {
    const frontendBase = this.config
      .get<string>("FRONTEND_URL", "http://localhost:5173")
      .replace(/\/$/, "");

    return AVATAR_PRESET_IDS.map((id) => ({
      id,
      url: `${frontendBase}${avatarPresetPath(id)}`,
    }));
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<UserEntity> {
    return this.userModel.create({
      ...data,
      email: data.email.toLowerCase(),
    });
  }

  async updateProfile(userId: string, input: UpdateProfileDto): Promise<UserEntity> {
    const patch: Record<string, unknown> = {};

    if (input.firstName !== undefined) patch.firstName = input.firstName;
    if (input.lastName !== undefined) patch.lastName = input.lastName;

    if (input.avatarPresetId !== undefined) {
      if (input.avatarPresetId === "" || input.avatarPresetId === null) {
        patch.avatarPresetId = null;
      } else if (!isAvatarPresetId(input.avatarPresetId)) {
        throw new BadRequestException("Unknown avatar preset");
      } else {
        const presetId = input.avatarPresetId as AvatarPresetId;
        patch.avatarPresetId = presetId;
        patch.avatarUrl = avatarPresetPath(presetId);
      }
    }

    if (input.avatarUrl !== undefined) {
      patch.avatarUrl = input.avatarUrl;
      patch.avatarPresetId = null;
    }

    const user = await this.userModel.findByIdAndUpdate(userId, { $set: patch }, { new: true }).exec();
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<UserEntity> {
    if (!file) throw new BadRequestException("File is required");
    if (file.size > AVATAR_MAX_BYTES) throw new BadRequestException("Avatar is too large (max 2 MB)");
    if (!AVATAR_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException("Avatar must be PNG, JPEG, or WebP");
    }

    const extension =
      file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
    const fileName = `avatar-${userId}-${randomUUID()}${extension}`;
    const targetDir = join(process.cwd(), "uploads", "avatars");
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, fileName), file.buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { avatarUrl, avatarPresetId: null } },
        { new: true },
      )
      .exec();
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async setPassword(userId: string, passwordHash: string) {
    await this.userModel.findByIdAndUpdate(userId, { passwordHash }).exec();
  }

  async verifyEmail(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { isEmailVerified: true }).exec();
  }

  async setTwoFactorSecret(userId: string, secret: string) {
    await this.userModel.findByIdAndUpdate(userId, { twoFactorSecret: secret }).exec();
  }

  async enableTwoFactor(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { isTwoFactorEnabled: true }).exec();
  }

  async disableTwoFactor(userId: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        isTwoFactorEnabled: false,
        $unset: { twoFactorSecret: 1 },
      })
      .exec();
  }

  async findByOAuth(provider: OAuthProvider, oauthId: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ oauthProvider: provider, oauthId }).exec();
  }

  async createOAuthUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    oauthProvider: OAuthProvider;
    oauthId: string;
  }): Promise<UserEntity> {
    return this.userModel.create({
      ...data,
      email: data.email.toLowerCase(),
      isEmailVerified: true,
    });
  }

  async linkOAuth(userId: string, provider: OAuthProvider, oauthId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      oauthProvider: provider,
      oauthId,
    }).exec();
  }
}
