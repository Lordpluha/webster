import { Field, InputType } from "@nestjs/graphql";
import { IsOptional, IsString, MinLength } from "class-validator";

@InputType()
export class UpdateProfileDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatarPresetId?: string;
}
