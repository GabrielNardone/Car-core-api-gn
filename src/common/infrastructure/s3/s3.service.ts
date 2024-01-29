import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

import { CommonErrors } from '@/common/application/exceptions/common.errors';
import { IFileUploadService } from '@/common/application/repository/file-upload.interface.repository';

@Injectable()
export class S3Service implements IFileUploadService {
  private readonly client: S3Client;
  private readonly bucket = this.configService.get('s3.bucket');
  private readonly region = this.configService.get('s3.region');
  private readonly accessKey = this.configService.get('s3.accesskey');
  private readonly secretKey = this.configService.get('s3.secretKey');

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
      },
      endpoint: this.configService.get('s3.endpoint'),
      forcePathStyle: true,
    });
  }

  async uploadFiles(file: Buffer): Promise<string> {
    const fileKey = uuid();

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: fileKey,
          Body: file,
        }),
      );

      const filePath = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;

      return filePath;
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      throw new Error(CommonErrors.UPLOADING_ERROR);
    }
  }
}
