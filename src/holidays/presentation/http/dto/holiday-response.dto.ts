import { ApiProperty } from '@nestjs/swagger';

export class HolidayResponseDto {
  @ApiProperty({
    example: 'Jueves, 01 de Enero'
  })
  dia!: string;

  @ApiProperty({
    example: 'Año Nuevo'
  })
  festividad!: string;

  @ApiProperty({
    example: 'Civil'
  })
  tipo!: string;

  @ApiProperty({
    example: 'Ley 2.977'
  })
  respaldoLegal!: string;

  @ApiProperty({
    example: true
  })
  isIrrenunciable!: boolean;

  @ApiProperty({
    example: true
  })
  isConfirmed!: boolean;

  @ApiProperty({
    example: '2026-01-01'
  })
  fecha!: string;
}
