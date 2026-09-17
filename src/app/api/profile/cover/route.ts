import { handleProfileImageUpload } from "../image-upload";

export function POST(request: Request) {
  return handleProfileImageUpload(request, {
    subdir: "covers",
    maxSize: 5 * 1024 * 1024,
    maxSizeLabel: "5MB",
    field: "coverUrl",
  });
}
