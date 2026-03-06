import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class S3Service {
    private s3Client: S3Client;

    constructor(private configService: ConfigService) {
        this.s3Client = new S3Client({
            region: this.configService.get<string>('AWS_REGION') || 'ap-south-1',
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
            },
        });
    }

    async uploadFile(file: Express.Multer.File, folder: string = 'uploads'): Promise<string | null> {
        if (!file) return null;

        const fileExtension = path.extname(file.originalname);
        const fileName = `${folder}/${uuidv4()}${fileExtension}`;

        const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
        const region = this.configService.get<string>('AWS_REGION') || 'ap-south-1';

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        try {
            await this.s3Client.send(command);
            return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
        } catch (error) {
            console.error('Error uploading file to S3', error);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }
}
