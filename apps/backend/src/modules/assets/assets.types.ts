import { Field, ID, ObjectType } from "@nestjs/graphql";

import { ProjectEntity } from "../projects/entities/project.entity";
import { ShareLinkRole } from "./share-link-role.enum";

@ObjectType()
export class ShareLinkResponse {
  @Field()
  token!: string;

  @Field()
  url!: string;

  @Field(() => ShareLinkRole)
  role!: ShareLinkRole;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;
}

@ObjectType()
export class ShareLinkInfo {
  @Field()
  token!: string;

  @Field(() => ShareLinkRole)
  role!: ShareLinkRole;

  @Field()
  isRevoked!: boolean;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date | null;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class SharedProjectAccess {
  @Field(() => ProjectEntity)
  project!: ProjectEntity;

  @Field(() => ShareLinkRole)
  role!: ShareLinkRole;

  @Field()
  canEdit!: boolean;

  @Field()
  token!: string;
}

@ObjectType()
export class ExportAssetResponse {
  @Field()
  fileName!: string;

  @Field()
  mimeType!: string;

  @Field()
  url!: string;
}
