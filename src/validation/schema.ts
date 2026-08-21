import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult } from '../types';

const ajv = new Ajv({ allErrors: true });

const schemaCache: Record<string, ReturnType<typeof ajv.compile>> = {};

function loadSchema(schemaPath: string) {
  if (!schemaCache[schemaPath]) {
    const fullPath = path.resolve(schemaPath);
    const schema = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    schemaCache[schemaPath] = ajv.compile(schema);
  }
  return schemaCache[schemaPath];
}

/**
 * Validate a single scraped item against a JSON schema.
 */
export function validateItem(item: unknown, schemaPath: string): ValidationResult {
  const validate = loadSchema(schemaPath);
  const valid = validate(item) as boolean;

  const errors: string[] = [];
  if (!valid && validate.errors) {
    for (const err of validate.errors) {
      errors.push(`${err.instancePath || '/'} ${err.message ?? 'unknown error'}`);
    }
  }

  return { valid, errors, nullFields: detectNullFields(item) };
}

/**
 * Validate an array of scraped items — pass if at least one is valid.
 */
export function validateArray(items: unknown, schemaPath: string): ValidationResult {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      errors: ['Result is empty or not an array'],
      nullFields: [],
    };
  }

  // Validate the first item as representative
  const result = validateItem(items[0], schemaPath);
  return result;
}

/**
 * Detect null or undefined values in the top-level fields of an object.
 */
export function detectNullFields(obj: unknown): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  const nullFields: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value === null || value === undefined || value === '') {
      nullFields.push(key);
    }
  }
  return nullFields;
}
