import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QueryParamsDto {
  @IsOptional()
  @ApiPropertyOptional({
    example: '2026',
    description: 'Año de los feriados a consultar'
  })
  year?: string;
}
