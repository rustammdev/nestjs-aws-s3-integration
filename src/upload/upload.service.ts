import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Response } from 'express';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private bucketName: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  //   upload large file aws-s3
  async upload(file: Express.Multer.File): Promise<Object> {
    const uploadParams = {
      Bucket: this.bucketName,
      Key: file.originalname,
      Body: file.buffer,
    };

    try {
      const upload = new Upload({
        client: this.s3,
        params: uploadParams,
      });

      const response = await upload.done();
      return {
        message: `File uploaded successfully.`,
        key: response.Key,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // get files from aws-s3
  async downloadFile(key: string, res: Response): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      const response = await this.s3.send(command);

      if (!response.Body) {
        throw new HttpException(
          'File not found or empty',
          HttpStatus.NOT_FOUND,
        );
      }

      // Body ni stream ga aylantirish
      const stream = response.Body as Readable;

      // Sarlavhalarni sozlash
      res.setHeader(
        'Content-Type',
        response.ContentType || 'application/octet-stream',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${key}"`);

      // Stream ni foydalanuvchiga uzatish
      await new Promise((resolve, reject) => {
        stream.pipe(res);
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
