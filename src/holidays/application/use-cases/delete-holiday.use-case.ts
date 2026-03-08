import { Injectable } from '@nestjs/common';

@Injectable()
export class DeleteHolidayUseCase {
  execute(id: number): string {
    return `This action removes a #${id} holiday`;
  }
}
