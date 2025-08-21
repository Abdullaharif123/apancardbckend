import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const getSignedS3UrlUtil = async (filename, filetype) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: filename,
    Expires: 60,
    ContentType: filetype,
    // ACL: "public-read",
  };

  return await s3.getSignedUrlPromise("putObject", params);
};
