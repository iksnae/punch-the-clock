#!/usr/bin/env node

import { PTCApplication } from './cli/index';

// Main entry point
const app = new PTCApplication();
app.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
