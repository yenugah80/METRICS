module.exports = {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON and Markdown files
  '**/*.{json,md}': [
    'prettier --write',
  ],
  
  // Run type checking on TypeScript files
  '**/*.{ts,tsx}': () => [
    'tsc --noEmit',
  ],
  
  // Database schema changes require immediate validation
  'shared/schema.ts': [
    'echo "⚠️  Database schema modified. Remember to run: npm run db:push"',
  ],
  
  // Critical config files require extra validation
  'drizzle.config.ts': [
    'echo "🚨 Database config modified. Run npm run db:push and test thoroughly!"',
  ],
};