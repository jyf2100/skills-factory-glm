#!/usr/bin/env node
import { cli } from '../index.js';

cli().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
