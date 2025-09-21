"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Jest setup file for PTC tests
const globals_1 = require("@jest/globals");
// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: globals_1.jest.fn(),
    debug: globals_1.jest.fn(),
    info: globals_1.jest.fn(),
    warn: globals_1.jest.fn(),
    error: globals_1.jest.fn(),
};
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PTC_DB_HOST = 'localhost';
process.env.PTC_DB_PORT = '3306';
process.env.PTC_DB_USER = 'test';
process.env.PTC_DB_PASSWORD = 'test';
process.env.PTC_DB_DATABASE = 'ptc_test';
//# sourceMappingURL=setup.js.map