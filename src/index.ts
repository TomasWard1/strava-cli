#!/usr/bin/env node

import { config } from 'dotenv';
config();

import { program } from './cli.js';

program.parse(process.argv);
