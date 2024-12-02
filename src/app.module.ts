import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), UploadModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
