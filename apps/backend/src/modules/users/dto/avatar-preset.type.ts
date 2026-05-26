import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class AvatarPreset {
  @Field()
  id!: string;

  @Field()
  url!: string;
}
