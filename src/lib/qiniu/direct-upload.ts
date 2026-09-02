import "server-only";

import * as qiniu from "qiniu";

const accessKey = process.env.QINIU_ACCESS_KEY!;
const secretKey = process.env.QINIU_SECRET_KEY!;
const bucket = process.env.QINIU_BUCKET!;
const cdnDomain = process.env.QINIU_DOMAIN!;

function getUploadToken(): string {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
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
