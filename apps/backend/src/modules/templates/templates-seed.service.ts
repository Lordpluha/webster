import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { DEFAULT_BASE_TEMPLATES } from "./default-templates";
import { TemplateEntity } from "./entities/template.entity";

@Injectable()
export class TemplatesSeedService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesSeedService.name);

  constructor(
    @InjectModel(TemplateEntity.name)
    private readonly templateModel: Model<TemplateEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedBaseTemplates();
  }

  async seedBaseTemplates(): Promise<void> {
    let created = 0;

    for (const tpl of DEFAULT_BASE_TEMPLATES) {
      const exists = await this.templateModel
        .findOne({ userId: null, title: tpl.title, isDeleted: false })
        .select("_id")
        .exec();

      if (exists) {
        continue;
      }

      await this.templateModel.create({
        userId: null,
        title: tpl.title,
        width: tpl.width,
        height: tpl.height,
        content: tpl.content,
        isPublic: true,
        isDeleted: false,
      });
      created += 1;
    }

    if (created > 0) {
      this.logger.log(`Seeded ${created} built-in template(s)`);
    }
  }
}
