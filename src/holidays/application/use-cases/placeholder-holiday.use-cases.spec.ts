import { CreateHolidayUseCase } from './create-holiday.use-case';
import { DeleteHolidayUseCase } from './delete-holiday.use-case';
import { GetHolidayByIdUseCase } from './get-holiday-by-id.use-case';
import { UpdateHolidayUseCase } from './update-holiday.use-case';

describe('Placeholder holiday use cases', () => {
  it('should preserve the create placeholder contract', () => {
    expect(new CreateHolidayUseCase().execute()).toBe(
      'This action adds a new holiday'
    );
  });

  it('should preserve the get by id placeholder contract', () => {
    expect(new GetHolidayByIdUseCase().execute(7)).toBe(
      'This action returns a #7 holiday'
    );
  });

  it('should preserve the update placeholder contract', () => {
    expect(new UpdateHolidayUseCase().execute(7)).toBe(
      'This action updates a #7 holiday'
    );
  });

  it('should preserve the delete placeholder contract', () => {
    expect(new DeleteHolidayUseCase().execute(7)).toBe(
      'This action removes a #7 holiday'
    );
  });
});
