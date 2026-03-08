import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: 'El año no es un número válido'
  })
  message!: string;

  @ApiProperty({
    example: 'Bad Request'
  })
  error!: string;

  @ApiProperty({
    example: 400
  })
  statusCode!: number;
}
