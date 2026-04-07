const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  forcePathStyle: true,
  endpoint: process.env.OS_URI,
  region: "sgp1",
  credentials: {
    accessKeyId: process.env.OS_ACCESS_KEY,
    secretAccessKey: process.env.OS_SECRET_KEY
  }
});

// Helper: Generate clean filename
const generateFileName = (originalName, timestamp) => {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const extension = originalName.split('.').pop();
  
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  const timeString = timestamp.toString();
  
  return `${cleanName}_${timeString}.${extension}`;
};

// Helper: Get folder path based on current date
const getDateFolder = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};

// Upload base64 to DO Spaces
const uploadBase64ToSpaces = async (base64Data, originalName, fileType = 'image') => {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return base64Data;

  const contentType = matches[1];
  const base64Content = matches[2];
  const buffer = Buffer.from(base64Content, 'base64');
  
  const timestamp = Date.now();
  const dateFolder = getDateFolder();
  const fileName = generateFileName(originalName || `${fileType}.${contentType.split('/')[1]}`, timestamp);
  const fullPath = `${dateFolder}/${fileName}`;
  
  // Determine if file should be displayed inline or as attachment
  const isInlineType = contentType.startsWith('image/') || 
                       contentType.startsWith('video/') || 
                       contentType.startsWith('audio/') ||
                       contentType === 'application/pdf';
  
  const command = new PutObjectCommand({
    Bucket: process.env.OS_BUCKET,
    Key: fullPath,
    Body: buffer,
    ACL: 'public-read',
    ContentType: contentType,
    // Set ContentDisposition to display inline for media files, download for others
    ContentDisposition: isInlineType ? 'inline' : `attachment; filename="${originalName || fileName}"`
  });

  await s3Client.send(command);
  
  // ✅ FIXED: OS_URI already contains bucket name, just append the path
  // OS_URI format: https://nebwork-storage.sgp1.digitaloceanspaces.com
  // Full path includes bucket: nebwork-storage/2025/11/03/file.jpg
  const fullUrl = `${process.env.OS_URI}/${process.env.OS_BUCKET}/${fullPath}`;
  return fullUrl;
};

// Delete file from DO Spaces
const deleteFromSpaces = async (fileUrl) => {
  try {
    const urlParts = new URL(fileUrl);
    // Extract path after domain
    // URL: https://nebwork-storage.sgp1.digitaloceanspaces.com/nebwork-storage/2025/11/03/file.jpg
    // pathname: /nebwork-storage/2025/11/03/file.jpg
    // We need to remove the bucket name from the path since it's already specified in Bucket param
    let key = urlParts.pathname.substring(1); // Remove leading slash -> nebwork-storage/2025/11/03/file.jpg
    
    // Remove bucket name from the beginning of the path if it exists
    const bucket = process.env.OS_BUCKET;
    if (key.startsWith(`${bucket}/`)) {
      key = key.substring(bucket.length + 1); // Remove "nebwork-storage/" -> 2025/11/03/file.jpg
    }
    
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    throw error; // Re-throw to let controller handle it
  }
};

// BASE64 MODE: Process content and media arrays — store base64 directly in MongoDB
// No upload to external storage needed
const processMediaUploads = async (content, media) => {
  let processedContent = content;
  let processedMedia = [];

  // 1. Inline images in TipTap content: keep base64 data URIs as-is
  // (they will be stored directly in MongoDB inside the HTML content string)
  // No upload needed.

  // 2. Process media attachments
  if (media && Array.isArray(media)) {
    for (const item of media) {
      try {
        if (typeof item === 'string') {
          // Legacy: plain string URL or base64
          processedMedia.push({ url: item, type: 'unknown', name: 'file', size: 0 });
        } else if (item && (item.url || item.data)) {
          // New object format { url, type, name, size } or { data, type, name, size }
          processedMedia.push({
            url: item.url || item.data,
            type: item.type || 'unknown',
            name: item.name || 'file',
            size: item.size || 0
          });
        }
      } catch (error) {
        // Silent fail for individual media items
      }
    }
  }

  return { processedContent, processedMedia };
};

// Extract all media URLs from content and media array
const extractMediaUrls = (content, media) => {
  const urls = [];
  
  // Extract from inline images
  if (content) {
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const matches = [...content.matchAll(imgRegex)];
    matches.forEach(match => {
      if (match[1] && !match[1].startsWith('data:')) {
        urls.push(match[1]);
      }
    });
  }
  
  // Extract from media attachments
  if (media && Array.isArray(media)) {
    media.forEach(item => {
      if (item.url && !item.url.startsWith('data:')) {
        urls.push(item.url);
      }
    });
  }
  
  return urls;
};

module.exports = {
  uploadBase64ToSpaces,
  deleteFromSpaces,
  processMediaUploads,
  extractMediaUrls
};