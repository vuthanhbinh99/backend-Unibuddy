import { readFile } from "node:fs/promises";
import path from "node:path";

const THU_MUC_PROMPT_MAC_DINH = path.join(process.cwd(), "prompts", "ai");

export class DichVuTemplatePromptAi {
  private readonly cache = new Map<string, string>();

  constructor(private readonly thuMucPrompt: string = THU_MUC_PROMPT_MAC_DINH) {}

  async lay(templateName: string) {
    const cached = this.cache.get(templateName);

    if (cached) {
      return cached;
    }

    const filePath = path.join(this.thuMucPrompt, templateName);
    const content = await readFile(filePath, "utf8");
    this.cache.set(templateName, content);

    return content;
  }
}
