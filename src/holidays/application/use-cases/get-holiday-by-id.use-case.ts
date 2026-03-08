import { Injectable } from '@nestjs/common';

@Injectable()
export class GetHolidayByIdUseCase {
  execute(id: number): string {
    return `This action returns a #${id} holiday`;
  }
}
