import { S3Client } from "@aws-sdk/client-s3";
import { AppError } from "../../errors/app.error.js";
import { ErrorCode } from "../../errors/error.code.js";
import { getBaseLogger } from "../../logging/log.logger.js";
import { LogModule } from "../../logging/log.contract.js"

const logger = getBaseLogger();
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const CLOUDFLARE_R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const CLOUDFLARE_R2_SECRET_ID = process.env.CLOUDFLARE_R2_SECRET_ID;


if (!CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_BUCKET_NAME || !CLOUDFLARE_R2_ENDPOINT || !CLOUDFLARE_R2_SECRET_ID) {
  logger.error({ module: "storage", event: "r2.client", message: "Varivávies de ambiente não configuradas." })
  throw new AppError({ status: 500, code: ErrorCode.INTERNAL_ERROR, message: "Váriaveis do storage não configuradas." })
}


export function createR2Client(): { client: S3Client; bucket: string } {
  return {
    client: new S3Client({
      region: "auto",
      endpoint: CLOUDFLARE_R2_ENDPOINT!,
      credentials: { accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID!, secretAccessKey: CLOUDFLARE_R2_SECRET_ID! },
    }),
    bucket: CLOUDFLARE_R2_BUCKET_NAME!,
  };
}
