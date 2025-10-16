#!/usr/bin/env node

// Debug script to check Railway port configuration
console.log('🔍 Railway Port Debug Information:');
console.log('=====================================');
console.log('PORT environment variable:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All environment variables:');
console.log(JSON.stringify(process.env, null, 2));
console.log('=====================================');
