# **NestJS + AWS S3 Integration**

This project demonstrates how to use **NestJS** to upload files to **AWS S3** and serve them back to users directly. Users can upload files to S3 and download them using the generated URLs.

---

## **Contents**

1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Running the Project](#running-the-project)
4. [API Endpoints](#api-endpoints)
5. [Code Explanation](#code-explanation)

---

## **Requirements**

To run this project, you need the following software:

- **Node.js** (v14 or higher)
- **NestJS CLI**
- **AWS S3 Account** (Access Key, Secret Key, Region, and Bucket Name are required)

---

## **Installation**

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up your `.env` file**:
   Create a `.env` file in the root of the project and set your AWS credentials:
   ```
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=your-region
   AWS_BUCKET_NAME=your-bucket-name
   ```

---

## **Running the Project**

Once the setup is complete, run the application using the following command:

```bash
npm run start
```

This will start the NestJS server on port `3000` by default.

---

## **API Endpoints**

### **1. Upload File to AWS S3**

- **Endpoint**: `POST /aws`
- **Description**: This endpoint allows users to upload a file to AWS S3.
- **Request Body**: A file should be uploaded using a multipart form data with the key `file`.
- **Response**:
  - Success: `{ message: "File uploaded successfully.", key: "<file-name>" }`
  - Error: `400 Bad Request` if the file is empty or its size is 0.

### **2. Download File from AWS S3**

- **Endpoint**: `GET /aws/download/:key`
- **Description**: This endpoint allows users to download a file from AWS S3.
- **Request Parameter**: `key` is the file name stored in S3.
- **Response**:
  - The file is returned as an attachment to the user.
  - If the file is not found or an error occurs, a `404 Not Found` or `500 Internal Server Error` is returned.

---

## **Code Explanation**

### **Controller**

The `UploadController` is responsible for handling incoming requests for uploading and downloading files.

#### `uploadFile` (POST /aws)

This method accepts a file from the user, validates it, and then uploads it to S3 using the `UploadService`. If the file is empty or its size is 0, an error is thrown.

```typescript
@Post()
@UseInterceptors(
  FileInterceptor('file', {
    storage: multer.memoryStorage(), // File is stored in memory
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
```

#### `downloadFile` (GET /aws/download/:key)

This method accepts a file key as a parameter and sends the corresponding file from AWS S3 to the user.

```typescript
@Get('download/:key')
async downloadFile(@Param('key') key: string, @Res() res: Response) {
  return this.uploadService.downloadFile(key, res);
}
```

---

### **Service**

The `UploadService` contains the business logic for interacting with AWS S3, such as uploading and downloading files.

#### `upload` (Uploading a file to S3)

This method uploads the file to AWS S3 using the `Upload` class from the `@aws-sdk/lib-storage` package. It uses the file's original name and its content from the `buffer`.

```typescript
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
```

#### `downloadFile` (Downloading a file from S3)

This method retrieves the file from AWS S3 using the `GetObjectCommand` from the `@aws-sdk/client-s3` package. It pipes the file stream to the response.

```typescript
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

    // Convert Body to a stream
    const stream = response.Body as Readable;

    // Set headers for file download
    res.setHeader(
      'Content-Type',
      response.ContentType || 'application/octet-stream',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);

    // Pipe the stream to the response
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
```

---

## **Conclusion**

This NestJS project allows you to interact with AWS S3 by uploading and downloading files using simple API endpoints. It demonstrates a clean separation between the controller (handling HTTP requests) and the service (containing business logic).

Feel free to customize the endpoints and logic to fit your specific use case. If you have any questions or need help, feel free to ask!
