import { registerEnumType } from "@nestjs/graphql";

export enum ShareLinkRole {
  VIEWER = "VIEWER",
  EDITOR = "EDITOR",
}

registerEnumType(ShareLinkRole, { name: "ShareLinkRole" });
