export function isImageMimeType(mimeType: string): boolean {
  const imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/svg+xml',
    'image/tiff',
    'image/heic',
    'image/heif',
  ];

  return imageMimeTypes.includes(mimeType);
}
