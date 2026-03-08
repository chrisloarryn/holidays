import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateHolidayUseCase {
  execute(): string {
    return 'This action adds a new holiday';
  }
}
