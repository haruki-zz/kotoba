import { TagCreateInput, TagRecord, TagUpdateInput } from '@shared/types';

import { TagRepository } from '../db/repositories/tag-repository';

export class TagService {
  constructor(private tagRepo: TagRepository) {}

  list(): TagRecord[] {
    return this.tagRepo.listAll();
  }

  get(id: number): TagRecord | undefined {
    return this.tagRepo.findById(id);
  }

  upsert(input: TagCreateInput): TagRecord {
    return this.tagRepo.upsert(input);
  }

  update(id: number, patch: TagUpdateInput): TagRecord | undefined {
    return this.tagRepo.update(id, patch);
  }

  delete(id: number): boolean {
    return this.tagRepo.delete(id);
  }
}
