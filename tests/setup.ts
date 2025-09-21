// Jest setup file for PTC tests
import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PTC_DB_HOST = 'localhost';
process.env.PTC_DB_PORT = '3306';
process.env.PTC_DB_USER = 'test';
process.env.PTC_DB_PASSWORD = 'test';
process.env.PTC_DB_DATABASE = 'ptc_test';
