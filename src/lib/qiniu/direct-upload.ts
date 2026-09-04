import "server-only";

import * as qiniu from "qiniu";

const accessKey = process.env.QINIU_ACCESS_KEY!;
const secretKey = process.env.QINIU_SECRET_KEY!;
const bucket = process.env.QINIU_BUCKET!;
const cdnDomain = process.env.QINIU_DOMAIN!;

export const QINIU_UPLOAD_URL =
  process.env.QINIU_UPLOAD_DOMAIN ?? "https://up-na0.qiniup.com";

function getMac(): qiniu.auth.digest.Mac {
  return new qiniu.auth.digest.Mac(accessKey, secretKey);
}

export type ScopedTokenOptions = {
  key: string;
  fsizeLimit?: number;
  mimeLimit?: string;
  insertOnly?: 0 | 1;
  expiresSeconds?: number;
};

export function getScopedUploadToken(options: ScopedTokenOptions): string {
  const mac = getMac();
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${options.key}`,
    fsizeLimit: options.fsizeLimit,
    mimeLimit: options.mimeLimit,
    insertOnly: options.insertOnly ?? 1,
    expires: options.expiresSeconds ?? 3600,
  });
  return putPolicy.uploadToken(mac);
}

function getUploadToken(): string {
  const mac = getMac();
  const putPolicy = new qiniu.rs.PutPolicy({ scope: bucket });
  return putPolicy.uploadToken(mac);
}

export function buildQiniuUrl(key: string): string {
  return `${cdnDomain}/${key}`;
}

export function buildQiniuKey(folder: string, ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeExt = (ext || "bin").replace(/^\.+/, "").toLowerCase() || "bin";
  const prefix = folder ? `${folder.replace(/\/+$/, "")}/` : "";
  return `${prefix}${timestamp}-${random}.${safeExt}`;
}

export type QiniuObjectStat = {
  fsize: number;
  mimeType: string;
  hash: string;
};

export async function statQiniuObject(key: string): Promise<QiniuObjectStat> {
  const mac = getMac();
  const config = new qiniu.conf.Config();
  const bucketManager = new qiniu.rs.BucketManager(mac, config);

  return new Promise<QiniuObjectStat>((resolve, reject) => {
    bucketManager.stat(bucket, key, (err, body, resp) => {
      if (err) {
        reject(err);
        return;
      }
      if (resp?.statusCode !== 200 || !body) {
        reject(
          new Error(
            `Qiniu stat failed: status=${resp?.statusCode} body=${JSON.stringify(body)}`,
          ),
        );
        return;
      }
      resolve({
        fsize: Number(body.fsize ?? 0),
        mimeType: String(body.mimeType ?? ""),
        hash: String(body.hash ?? ""),
      });
    });
  });
}

export async function uploadBufferToQiniu(
  key: string,
  buffer: Buffer,
): Promise<{ key: string; url: string }> {
  const token = getUploadToken();
  const config = new qiniu.conf.Config();
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();

  const uploaded = await new Promise<{ key: string }>(
    (resolve, reject) => {
      formUploader.put(
        token,
        key,
        buffer,
        putExtra,
        (err, body, resp) => {
          if (err) {
            reject(err);
            return;
          }
          if (resp?.statusCode !== 200 || !body || typeof body.key !== "string") {
            reject(
              new Error(
                `Qiniu upload failed: status=${resp?.statusCode} body=${JSON.stringify(body)}`,
              ),
            );
            return;
          }
          resolve(body as { key: string });
        },
      );
    },
  );

  return {
    key: uploaded.key,
    url: buildQiniuUrl(uploaded.key),
  };
}

export async function uploadFileToQiniu(
  file: File,
  folder: string,
): Promise<{ key: string; url: string; buffer: Buffer }> {
  const ext = file.name.split(".").pop() || "bin";
  const key = buildQiniuKey(folder, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadBufferToQiniu(key, buffer);
  return { ...uploaded, buffer };
}
