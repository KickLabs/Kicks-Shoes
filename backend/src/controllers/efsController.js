/**
 * EFS Controller
 * Demonstrates EFS file storage mounted at /mnt/efs in ECS container.
 *
 * W5 MH3 Evidence: write a file to /mnt/efs and read it back.
 * Use case: shared file storage across ECS tasks (product image cache, session files).
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger.js';

const EFS_MOUNT_PATH = process.env.EFS_MOUNT_PATH || '/mnt/efs';
const EFS_APP_DIR = path.join(EFS_MOUNT_PATH, 'app-data');

/**
 * Ensure the app directory exists on EFS
 */
async function ensureEfsDir() {
  await fs.mkdir(EFS_APP_DIR, { recursive: true });
}

/**
 * GET /api/efs/health
 * Check if EFS is mounted and accessible
 */
export const efsHealth = async (req, res) => {
  try {
    await ensureEfsDir();
    const stats = await fs.stat(EFS_MOUNT_PATH);

    res.json({
      status: 'healthy',
      mountPath: EFS_MOUNT_PATH,
      accessible: true,
      isDirectory: stats.isDirectory(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('EFS health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      mountPath: EFS_MOUNT_PATH,
      accessible: false,
      error: error.message,
      note: 'EFS is only available when running on ECS with the volume mounted.',
    });
  }
};

/**
 * POST /api/efs/write
 * Write a file to EFS — W5 MH3 evidence endpoint
 * Body: { filename: string, content: string }
 */
export const efsWrite = async (req, res) => {
  try {
    const { filename = `test-${Date.now()}.txt`, content } = req.body;

    // Sanitize filename — no path traversal
    const safeName = path.basename(filename);
    if (!safeName || safeName.startsWith('.')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const writeContent = content || `W5 EFS test — written at ${new Date().toISOString()} by ${req.ip}`;

    await ensureEfsDir();
    const filePath = path.join(EFS_APP_DIR, safeName);
    await fs.writeFile(filePath, writeContent, 'utf8');

    logger.info(`EFS write: ${filePath}`);

    res.json({
      success: true,
      filePath,
      filename: safeName,
      content: writeContent,
      writtenAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('EFS write failed:', error.message);
    res.status(500).json({ message: 'EFS write failed', error: error.message });
  }
};

/**
 * GET /api/efs/read/:filename
 * Read a file from EFS — W5 MH3 evidence endpoint
 */
export const efsRead = async (req, res) => {
  try {
    const safeName = path.basename(req.params.filename);
    if (!safeName) return res.status(400).json({ message: 'Invalid filename' });

    const filePath = path.join(EFS_APP_DIR, safeName);
    const content = await fs.readFile(filePath, 'utf8');
    const stats = await fs.stat(filePath);

    logger.info(`EFS read: ${filePath}`);

    res.json({
      success: true,
      filePath,
      filename: safeName,
      content,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ message: 'File not found on EFS', filename: req.params.filename });
    }
    logger.error('EFS read failed:', error.message);
    res.status(500).json({ message: 'EFS read failed', error: error.message });
  }
};

/**
 * GET /api/efs/list
 * List files in EFS app directory
 */
export const efsList = async (req, res) => {
  try {
    await ensureEfsDir();
    const entries = await fs.readdir(EFS_APP_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter(e => e.isFile())
        .map(async e => {
          const stats = await fs.stat(path.join(EFS_APP_DIR, e.name));
          return {
            filename: e.name,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
          };
        })
    );

    res.json({
      mountPath: EFS_MOUNT_PATH,
      directory: EFS_APP_DIR,
      fileCount: files.length,
      files,
    });
  } catch (error) {
    logger.error('EFS list failed:', error.message);
    res.status(500).json({ message: 'EFS list failed', error: error.message });
  }
};
