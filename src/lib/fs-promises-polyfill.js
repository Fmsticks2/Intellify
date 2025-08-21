// Browser polyfill for node:fs/promises
// This provides mock implementations of fs/promises methods for browser compatibility

const fsPromises = {
  // Mock file handle for browser environment
  open: async (path, flags = 'r', mode) => {
    return {
      fd: Math.random(), // Mock file descriptor
      path,
      flags,
      close: async () => {},
      read: async (buffer, offset, length, position) => {
        return { bytesRead: 0, buffer };
      },
      write: async (buffer, offset, length, position) => {
        return { bytesWritten: 0, buffer };
      },
      stat: async () => {
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 0,
          mtime: new Date(),
          ctime: new Date(),
          atime: new Date()
        };
      }
    };
  },
  
  readFile: async (path, options) => {
    throw new Error('fs.readFile is not supported in browser environment');
  },
  
  writeFile: async (path, data, options) => {
    throw new Error('fs.writeFile is not supported in browser environment');
  },
  
  access: async (path, mode) => {
    // Always resolve - assume file exists in browser context
    return Promise.resolve();
  },
  
  stat: async (path) => {
    return {
      isFile: () => true,
      isDirectory: () => false,
      size: 0,
      mtime: new Date(),
      ctime: new Date(),
      atime: new Date()
    };
  },
  
  mkdir: async (path, options) => {
    // Mock directory creation
    return Promise.resolve();
  },
  
  rmdir: async (path, options) => {
    // Mock directory removal
    return Promise.resolve();
  },
  
  unlink: async (path) => {
    // Mock file deletion
    return Promise.resolve();
  }
};

module.exports = fsPromises;