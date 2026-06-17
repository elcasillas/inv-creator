import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml"
]);

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
