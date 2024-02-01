import { IsOptional } from 'class-validator';

export class QueryParamsDto {
  @IsOptional()
  year: string;
}
