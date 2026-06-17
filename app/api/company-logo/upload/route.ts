import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  COMPANY_LOGO_MAX_FILE_SIZE_BYTES,
  getCompanyLogoExtension,
  isSupportedCompanyLogoType
} from "@/lib/utils/company-logo";

type R2BucketLike = {
  put: (key: string, value: Blob | ArrayBuffer | ArrayBufferView | string, options?: any) => Promise<unknown>;
};

function getPublicBaseUrl(env: Record<string, unknown>) {
  const publicBaseUrl =
    (env.COMPANY_LOGO_PUBLIC_BASE_URL as string | undefined) ??
    (env.CLOUDFLARE_R2_PUBLIC_BASE_URL as string | undefined);

  if (!publicBaseUrl) {
    return { ok: false as const, message: "Missing company logo public base URL." };
  }

  try {
    const parsedUrl = new URL(publicBaseUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        ok: false as const,
        message:
          "Company logo public base URL must use http or https. Set COMPANY_LOGO_PUBLIC_BASE_URL in wrangler.jsonc or CLOUDFLARE_R2_PUBLIC_BASE_URL in the environment."
      };
    }

    return { ok: true as const, value: parsedUrl.toString().replace(/\/$/, "") };
  } catch {
    return {
      ok: false as const,
      message:
        "Company logo public base URL is invalid. Set COMPANY_LOGO_PUBLIC_BASE_URL in wrangler.jsonc or CLOUDFLARE_R2_PUBLIC_BASE_URL in the environment to a full https URL."
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ message: "Missing company logo file." }, { status: 400 });
    }

    if (fileEntry.size <= 0) {
      return NextResponse.json({ message: "The uploaded file is empty." }, { status: 400 });
    }

    if (fileEntry.size > COMPANY_LOGO_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Company logos must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    const contentType = fileEntry.type.toLowerCase();

    if (!isSupportedCompanyLogoType(contentType)) {
      return NextResponse.json(
        { message: "Unsupported company logo type. Use PNG, JPG, WEBP, or SVG." },
        { status: 415 }
      );
    }

    const extension = getCompanyLogoExtension(contentType);

    if (!extension) {
      return NextResponse.json({ message: "Unsupported company logo type." }, { status: 415 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const envRecord = env as Record<string, unknown>;
    const bucket = envRecord.COMPANY_LOGO_BUCKET as R2BucketLike | undefined;

    if (!bucket) {
      return NextResponse.json(
        { message: 'R2 binding "COMPANY_LOGO_BUCKET" is not configured.' },
        { status: 500 }
      );
    }

    const publicBaseUrlResult = getPublicBaseUrl(envRecord);

    if (!publicBaseUrlResult.ok) {
      return NextResponse.json(
        {
          message: publicBaseUrlResult.message
        },
        { status: 500 }
      );
    }

    const publicBaseUrl = publicBaseUrlResult.value;
    const objectKey = `company-logos/${crypto.randomUUID()}${extension}`;

    await bucket.put(objectKey, fileEntry, {
      httpMetadata: {
        contentType
      },
      customMetadata: {
        originalName: fileEntry.name
      }
    });

    const logoUrl = `${publicBaseUrl}/${objectKey}`;

    return NextResponse.json({
      logoUrl,
      objectKey,
      contentType,
      size: fileEntry.size
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to upload the company logo."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const envRecord = env as Record<string, unknown>;
    const bucket = envRecord.COMPANY_LOGO_BUCKET as R2BucketLike | undefined;
    const publicBaseUrlResult = getPublicBaseUrl(envRecord);

    return NextResponse.json(
      {
        bucketConfigured: Boolean(bucket),
        publicUrlConfigured: publicBaseUrlResult.ok,
        publicUrlError: publicBaseUrlResult.ok ? null : publicBaseUrlResult.message
      },
      { status: bucket && publicBaseUrlResult.ok ? 200 : 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        bucketConfigured: false,
        publicUrlConfigured: false,
        publicUrlError: error instanceof Error ? error.message : "Failed to inspect company logo config."
      },
      { status: 500 }
    );
  }
}
