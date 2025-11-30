import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { LieuxService } from './lieux.service';
import { GetLieuxQueryDto } from './dto/get-lieux-query.dto';

@Controller('lieux')
export class LieuxController {
  constructor(private readonly lieuxService: LieuxService) {}

  @Get('types')
  async getTypesLieux() {
    return this.lieuxService.getTypesLieux();
  }

  @Get(':id')
  async getLieuById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.lieuxService.getLieuById(id, userId);
  }

  @Get()
  async getLieux(
    @Query() query: GetLieuxQueryDto,
    @Request() req?: any,
  ) {
    const userId = req?.user?.id;
    return this.lieuxService.getLieux(query, userId);
  }
}