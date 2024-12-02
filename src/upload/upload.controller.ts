import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UploadService } from './upload.service';
import { Response } from 'express';

@Controller('aws')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(), // Fayl xotirada saqlanadi
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new HttpException('Uploaded file is empty', HttpStatus.BAD_REQUEST);
    }

    if (file.size === 0) {
      throw new HttpException(
        'File size is 0. Cannot upload an empty file.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.uploadService.upload(file);
  }

  //   download file
  @Get('download/:key')
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    return this.uploadService.downloadFile(key, res);
  }
}
