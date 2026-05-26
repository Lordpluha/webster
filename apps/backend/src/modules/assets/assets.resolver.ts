import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import GraphQLJSON from "graphql-type-json";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UseAuth } from "../auth/decorators/use-auth.decorator";
import { ProjectEntity } from "../projects/entities/project.entity";
import { UserEntity } from "../users/entities/user.entity";
import { AssetsService } from "./assets.service";
import {
  ExportAssetResponse,
  SharedProjectAccess,
  ShareLinkInfo,
  ShareLinkResponse,
} from "./assets.types";
import { ShareLinkRole } from "./share-link-role.enum";

@Resolver()
export class AssetsResolver {
  constructor(private readonly assetsService: AssetsService) {}

  @UseAuth()
  @Mutation(() => ShareLinkResponse)
  createShareLink(
    @CurrentUser() user: UserEntity,
    @Args("projectId", { type: () => ID }) projectId: string,
    @Args("expiresInHours", { nullable: true }) expiresInHours?: number,
    @Args("role", { type: () => ShareLinkRole, nullable: true }) role?: ShareLinkRole,
  ) {
    return this.assetsService.createShareLink(
      projectId,
      user.id,
      expiresInHours,
      role ?? ShareLinkRole.VIEWER,
    );
  }

  @UseAuth()
  @Query(() => [ShareLinkInfo])
  projectShareLinks(
    @CurrentUser() user: UserEntity,
    @Args("projectId", { type: () => ID }) projectId: string,
  ) {
    return this.assetsService.listProjectShareLinks(projectId, user.id);
  }

  @UseAuth()
  @Mutation(() => ShareLinkInfo)
  updateShareLinkRole(
    @CurrentUser() user: UserEntity,
    @Args("token") token: string,
    @Args("role", { type: () => ShareLinkRole }) role: ShareLinkRole,
  ) {
    return this.assetsService.updateShareLinkRole(token, user.id, role);
  }

  @UseAuth()
  @Mutation(() => Boolean)
  revokeShareLink(@CurrentUser() user: UserEntity, @Args("token") token: string) {
    return this.assetsService.revokeShareLink(token, user.id);
  }

  @Query(() => SharedProjectAccess)
  resolveShareLink(@Args("token") token: string) {
    return this.assetsService.resolveShareLinkAccess(token);
  }

  @Mutation(() => ProjectEntity)
  autosaveSharedProject(
    @Args("token") token: string,
    @Args("content", { type: () => GraphQLJSON }) content: unknown,
  ) {
    return this.assetsService.autosaveSharedProject(token, content);
  }

  @UseAuth()
  @Mutation(() => ExportAssetResponse)
  exportPng(
    @CurrentUser() user: UserEntity,
    @Args("projectId", { type: () => ID }) projectId: string,
  ) {
    return this.assetsService.exportPng(projectId, user.id);
  }

  @UseAuth()
  @Mutation(() => ExportAssetResponse)
  exportJpg(
    @CurrentUser() user: UserEntity,
    @Args("projectId", { type: () => ID }) projectId: string,
  ) {
    return this.assetsService.exportJpg(projectId, user.id);
  }

  @UseAuth()
  @Mutation(() => ExportAssetResponse)
  exportPdf(
    @CurrentUser() user: UserEntity,
    @Args("projectId", { type: () => ID }) projectId: string,
  ) {
    return this.assetsService.exportPdf(projectId, user.id);
  }

  @UseAuth()
  @Mutation(() => ExportAssetResponse)
  exportAdditionalFormat(
    @CurrentUser() user: UserEntity,
    @Args("projectId", { type: () => ID }) projectId: string,
    @Args("format") format: string,
  ) {
    return this.assetsService.exportAdditionalFormat(projectId, user.id, format);
  }
}
