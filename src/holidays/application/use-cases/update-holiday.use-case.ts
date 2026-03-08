import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateHolidayUseCase {
  execute(id: number): string {
    return `This action updates a #${id} holiday`;
  }
}
