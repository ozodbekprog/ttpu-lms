import { handleProfileImageUpload } from "../image-upload";

export function POST(request: Request) {
  return handleProfileImageUpload(request, {
    subdir: "avatars",
    maxSize: 30 * 1024 * 1024,
    maxSizeLabel: "30MB",
    field: "avatarUrl",
  });
}
