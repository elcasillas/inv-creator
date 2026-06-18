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

function getObjectKeyFromSource(sourceUrl: URL) {
  if (sourceUrl.pathname.startsWith("/company-logos/")) {
    return sourceUrl.pathname.slice(1);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get("src");

  if (!sourceUrl) {
    return new NextResponse("Missing logo source URL.", { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return new NextResponse("Invalid logo source URL.", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return new NextResponse("Unsupported logo protocol.", { status: 400 });
  }

  try {
    const objectKey = getObjectKeyFromSource(parsedUrl);

    if (objectKey) {
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
    }

    const upstreamResponse = await fetch(parsedUrl.toString(), {
      cache: "force-cache",
      headers: {
        Accept: "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml;q=0.9,*/*;q=0.1"
      },
      next: {
        revalidate: 3600
      }
    });

    if (!upstreamResponse.ok) {
      return new NextResponse("Failed to fetch company logo.", { status: 502 });
    }

    const contentType = upstreamResponse.headers.get("content-type")?.split(";")[0].toLowerCase() ?? "";

    if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
      return new NextResponse("Unsupported company logo type.", { status: 415 });
    }

    const imageBuffer = await upstreamResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch {
    return new NextResponse("Failed to fetch company logo.", { status: 502 });
  }
}
