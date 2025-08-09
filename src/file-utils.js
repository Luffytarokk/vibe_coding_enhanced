import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';

/**
 * File system utilities with atomic writes and locking
 */
export class FileUtils {
  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if file exists
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file with error handling
   */
  static async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        const customError = new Error(`File not found: ${filePath}`);
        customError.code = 'E_NOT_FOUND';
        throw customError;
      }
      const customError = new Error(`Failed to read file: ${error.message}`);
      customError.code = 'E_IO';
      throw customError;
    }
  }

  /**
   * Read JSON file with error handling
   */
  static async readJsonFile(filePath) {
    try {
      const content = await this.readFile(filePath);
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'E_NOT_FOUND') {
        throw error;
      }
      const customError = new Error(`Failed to parse JSON: ${error.message}`);
      customError.code = 'E_INVALID';
      throw customError;
    }
  }

  /**
   * Atomic write with file locking
   */
  static async writeFileAtomic(filePath, content) {
    const dir = path.dirname(filePath);
    await this.ensureDir(dir);
    
    const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
    let release = null;
    
    try {
      // Acquire lock on the target file (create if doesn't exist)
      try {
        // Create empty file if it doesn't exist for locking
        if (!(await this.exists(filePath))) {
          await fs.writeFile(filePath, '', 'utf8');
        }
        
        release = await lockfile.lock(filePath, {
          retries: {
            retries: 5,
            factor: 2,
            minTimeout: 100,
            maxTimeout: 1000
          }
        });
      } catch (lockError) {
        const customError = new Error(`Failed to acquire lock: ${lockError.message}`);
        customError.code = 'E_CONFLICT';
        throw customError;
      }

      // Write to temporary file
      await fs.writeFile(tempPath, content, 'utf8');
      
      // Atomic rename
      await fs.rename(tempPath, filePath);
      
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      
      if (error.code) {
        throw error;
      }
      
      const customError = new Error(`Failed to write file: ${error.message}`);
      customError.code = 'E_IO';
      throw customError;
    } finally {
      // Release lock
      if (release) {
        try {
          await release();
        } catch {
          // Ignore lock release errors
        }
      }
    }
  }

  /**
   * Atomic write JSON with file locking
   */
  static async writeJsonFileAtomic(filePath, data) {
    const content = JSON.stringify(data, null, 2);
    await this.writeFileAtomic(filePath, content);
  }

  /**
   * List files in directory with pattern matching
   */
  static async listFiles(dirPath, pattern = null) {
    try {
      const files = await fs.readdir(dirPath);
      if (pattern) {
        const regex = new RegExp(pattern);
        return files.filter(file => regex.test(file));
      }
      return files;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      const customError = new Error(`Failed to list files: ${error.message}`);
      customError.code = 'E_IO';
      throw customError;
    }
  }

  /**
   * Get file stats
   */
  static async getStats(filePath) {
    try {
      return await fs.stat(filePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        const customError = new Error(`File not found: ${filePath}`);
        customError.code = 'E_NOT_FOUND';
        throw customError;
      }
      const customError = new Error(`Failed to get file stats: ${error.message}`);
      customError.code = 'E_IO';
      throw customError;
    }
  }

  /**
   * Update JSON file atomically with a callback
   */
  static async updateJsonFileAtomic(filePath, updateCallback) {
    const dir = path.dirname(filePath);
    await this.ensureDir(dir);
    
    let release = null;
    
    try {
      // Create empty file if it doesn't exist for locking
      if (!(await this.exists(filePath))) {
        await fs.writeFile(filePath, '{}', 'utf8');
      }
      
      // Acquire lock
      try {
        release = await lockfile.lock(filePath, {
          retries: {
            retries: 5,
            factor: 2,
            minTimeout: 100,
            maxTimeout: 1000
          }
        });
      } catch (lockError) {
        const customError = new Error(`Failed to acquire lock: ${lockError.message}`);
        customError.code = 'E_CONFLICT';
        throw customError;
      }

      // Read current data
      let currentData = {};
      if (await this.exists(filePath)) {
        try {
          currentData = await this.readJsonFile(filePath);
        } catch (error) {
          // If JSON is invalid, start with empty object
          if (error.code === 'E_INVALID') {
            currentData = {};
          } else {
            throw error;
          }
        }
      }

      // Apply update
      const updatedData = await updateCallback(currentData);

      // Write back atomically (but don't use writeJsonFileAtomic to avoid double locking)
      const content = JSON.stringify(updatedData, null, 2);
      const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
      
      await fs.writeFile(tempPath, content, 'utf8');
      await fs.rename(tempPath, filePath);

      return updatedData;
      
    } finally {
      // Release lock
      if (release) {
        try {
          await release();
        } catch {
          // Ignore lock release errors
        }
      }
    }
  }
}