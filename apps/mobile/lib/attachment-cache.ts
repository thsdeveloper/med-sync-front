/**
 * Attachment Cache Management Utilities
 *
 * Provides utilities for caching downloaded attachments locally using expo-file-system.
 * Enables offline viewing of previously downloaded chat attachments.
 *
 * Features:
 * - Local file caching with cache directory management
 * - Cache size tracking and cleanup
 * - Automatic cache expiration (30 days default)
 * - Cache hit/miss detection
 * - Safe file naming (sanitized filenames)
 */

import * as FileSystem from 'expo-file-system/legacy';

/**
 * Maximum cache size in bytes (100 MB)
 */
const MAX_CACHE_SIZE = 100 * 1024 * 1024;

/**
 * Cache expiration time in milliseconds (30 days)
 */
const CACHE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cache directory path
 * Using type assertion as FileSystem.cacheDirectory is available at runtime
 */
export const CACHE_DIR = `${(FileSystem as any).cacheDirectory}chat-attachments/`;

/**
 * Cache metadata for tracking files
 */
interface CacheMetadata {
  attachmentId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  downloadedAt: number;
  lastAccessedAt: number;
}

/**
 * Initialize cache directory if it doesn't exist
 */
export async function initializeCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing cache directory:', error);
    throw new Error('Failed to initialize cache directory');
  }
}

/**
 * Generate cache file path for an attachment
 */
export function getCacheFilePath(attachmentId: string, fileName: string): string {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${CACHE_DIR}${attachmentId}_${sanitizedName}`;
}

/**
 * Check if an attachment is cached locally
 */
export async function isCached(attachmentId: string, fileName: string): Promise<boolean> {
  try {
    const filePath = getCacheFilePath(attachmentId, fileName);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
}

/**
 * Get cached file URI if it exists
 */
export async function getCachedFileUri(
  attachmentId: string,
  fileName: string
): Promise<string | null> {
  try {
    const filePath = getCacheFilePath(attachmentId, fileName);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      // Update last accessed time in metadata
      await updateLastAccessedTime(attachmentId);
      return filePath;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached file:', error);
    return null;
  }
}

/**
 * Save file to cache
 */
export async function saveToCache(
  attachmentId: string,
  fileName: string,
  fileUri: string,
  fileSize: number
): Promise<string> {
  try {
    await initializeCache();
    const cacheFilePath = getCacheFilePath(attachmentId, fileName);

    // Copy file to cache
    await FileSystem.copyAsync({
      from: fileUri,
      to: cacheFilePath,
    });

    // Save metadata
    await saveCacheMetadata({
      attachmentId,
      fileName,
      filePath: cacheFilePath,
      fileSize,
      downloadedAt: Date.now(),
      lastAccessedAt: Date.now(),
    });

    // Check cache size and cleanup if needed
    await cleanupCacheIfNeeded();

    return cacheFilePath;
  } catch (error) {
    console.error('Error saving to cache:', error);
    throw new Error('Failed to save file to cache');
  }
}

/**
 * Delete file from cache
 */
export async function deleteFromCache(attachmentId: string, fileName: string): Promise<void> {
  try {
    const filePath = getCacheFilePath(attachmentId, fileName);
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
    await deleteCacheMetadata(attachmentId);
  } catch (error) {
    console.error('Error deleting from cache:', error);
  }
}

/**
 * Get total cache size in bytes
 */
export async function getCacheSize(): Promise<number> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      if (file.endsWith('.json')) continue; // Skip metadata files
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
}

/**
 * Clear all cached files
 */
export async function clearCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await initializeCache();
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Cleanup cache if it exceeds max size or has expired files
 */
async function cleanupCacheIfNeeded(): Promise<void> {
  try {
    const cacheSize = await getCacheSize();

    // If cache size is under limit, only remove expired files
    if (cacheSize < MAX_CACHE_SIZE) {
      await removeExpiredFiles();
      return;
    }

    // If cache is over limit, remove oldest files first
    const metadata = await getAllCacheMetadata();
    const sortedByAccess = metadata.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

    let currentSize = cacheSize;
    for (const item of sortedByAccess) {
      if (currentSize < MAX_CACHE_SIZE * 0.8) break; // Keep 80% of max size

      await deleteFromCache(item.attachmentId, item.fileName);
      currentSize -= item.fileSize;
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
}

/**
 * Remove files that have expired (older than CACHE_EXPIRATION_MS)
 */
async function removeExpiredFiles(): Promise<void> {
  try {
    const metadata = await getAllCacheMetadata();
    const now = Date.now();

    for (const item of metadata) {
      if (now - item.downloadedAt > CACHE_EXPIRATION_MS) {
        await deleteFromCache(item.attachmentId, item.fileName);
      }
    }
  } catch (error) {
    console.error('Error removing expired files:', error);
  }
}

// ============================================================================
// Metadata Management
// ============================================================================

/**
 * Get metadata file path for an attachment
 */
function getMetadataFilePath(attachmentId: string): string {
  return `${CACHE_DIR}${attachmentId}.json`;
}

/**
 * Save cache metadata
 */
async function saveCacheMetadata(metadata: CacheMetadata): Promise<void> {
  try {
    const metadataPath = getMetadataFilePath(metadata.attachmentId);
    await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
  } catch (error) {
    console.error('Error saving cache metadata:', error);
  }
}

/**
 * Get cache metadata for an attachment
 */
async function getCacheMetadata(attachmentId: string): Promise<CacheMetadata | null> {
  try {
    const metadataPath = getMetadataFilePath(attachmentId);
    const fileInfo = await FileSystem.getInfoAsync(metadataPath);

    if (!fileInfo.exists) return null;

    const content = await FileSystem.readAsStringAsync(metadataPath);
    return JSON.parse(content) as CacheMetadata;
  } catch (error) {
    console.error('Error getting cache metadata:', error);
    return null;
  }
}

/**
 * Get all cache metadata
 */
async function getAllCacheMetadata(): Promise<CacheMetadata[]> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return [];

    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    const metadataFiles = files.filter((file) => file.endsWith('.json'));

    const metadata: CacheMetadata[] = [];
    for (const file of metadataFiles) {
      const content = await FileSystem.readAsStringAsync(`${CACHE_DIR}${file}`);
      metadata.push(JSON.parse(content));
    }

    return metadata;
  } catch (error) {
    console.error('Error getting all cache metadata:', error);
    return [];
  }
}

/**
 * Update last accessed time for cached file
 */
async function updateLastAccessedTime(attachmentId: string): Promise<void> {
  try {
    const metadata = await getCacheMetadata(attachmentId);
    if (metadata) {
      metadata.lastAccessedAt = Date.now();
      await saveCacheMetadata(metadata);
    }
  } catch (error) {
    console.error('Error updating last accessed time:', error);
  }
}

/**
 * Delete cache metadata
 */
async function deleteCacheMetadata(attachmentId: string): Promise<void> {
  try {
    const metadataPath = getMetadataFilePath(attachmentId);
    const fileInfo = await FileSystem.getInfoAsync(metadataPath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(metadataPath);
    }
  } catch (error) {
    console.error('Error deleting cache metadata:', error);
  }
}

/**
 * Format cache size for display (KB, MB, GB)
 */
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}
