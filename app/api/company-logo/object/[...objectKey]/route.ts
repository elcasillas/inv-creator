import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/cloudflare/context";
import { getObjectFromR2, hasR2S3Env } from "@/lib/r2/s3";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml"
]);

type R2BucketLike = {
  get: (
    key: string
  ) => Promise<
    | {
        body: ReadableStream<Uint8Array> | ArrayBuffer;
        httpMetadata?: { contentType?: string | null };
        writeHttpMetadata?: (headers: Headers) => void;
      }
    | null
  >;
};

async function getR2Bucket() {
  const env = await getCloudflareEnv();
  return env.COMPANY_LOGO_BUCKET as R2BucketLike | undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ objectKey: string[] }> }
) {
  const resolvedParams = await params;
  const objectKey = resolvedParams.objectKey?.join("/");

  if (!objectKey) {
    return new NextResponse("Missing company logo object key.", { status: 400 });
  }

  try {
    if (hasR2S3Env()) {
      const object = await getObjectFromR2(objectKey);

      if (!object) {
        return new NextResponse("Company logo not found.", { status: 404 });
      }

      const contentType = object.contentType?.split(";")[0].toLowerCase() ?? "";

      if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
        return new NextResponse("Unsupported company logo type.", { status: 415 });
      }

      return new NextResponse(object.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": object.cacheControl ?? "public, max-age=3600, s-maxage=3600"
        }
      });
    }

    const bucket = await getR2Bucket();

    if (!bucket) {
      return new NextResponse('R2 binding "COMPANY_LOGO_BUCKET" is not configured.', {
        status: 500
      });
    }

    const object = await bucket.get(objectKey);

    if (!object) {
      return new NextResponse("Company logo not found.", { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType?.toLowerCase() ?? "";

    if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
      return new NextResponse("Unsupported company logo type.", { status: 415 });
    }

    const headers = new Headers();
    object.writeHttpMetadata?.(headers);
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=3600, s-maxage=3600");

    return new NextResponse(object.body, {
      status: 200,
      headers
    });
  } catch {
    return new NextResponse("Failed to fetch company logo.", { status: 502 });
  }
}
