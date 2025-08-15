const fs = require('fs');
const path = require('path');

// Function to fix API route files
function fixApiRoute(filePath) {
  console.log(`Fixing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix function signatures for all HTTP methods
  content = content.replace(
    /export async function (GET|POST|PUT|DELETE|PATCH)\s*\(\s*request:\s*NextRequest,\s*{\s*params\s*}:\s*{\s*params:\s*{\s*([^}]+)\s*}\s*}\s*\)/g,
    (match, method, params) => {
      // Convert params to Promise type
      const promiseParams = params.replace(/(\w+):\s*string/g, '$1: string');
      return `export async function ${method}(\n  request: NextRequest,\n  { params }: { params: Promise<{ ${promiseParams} }> }\n)`;
    }
  );
  
  // Add await params destructuring after try block for each function
  const functionRegex = /export async function (GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)\s*\{[^}]*try\s*\{/g;
  let functionMatch;
  let offset = 0;
  
  while ((functionMatch = functionRegex.exec(content)) !== null) {
    const method = functionMatch[1];
    const tryIndex = functionMatch.index + functionMatch[0].length + offset;
    
    // Find the function signature to determine params
    const functionStart = content.lastIndexOf(`export async function ${method}`, tryIndex);
    const functionEnd = content.indexOf('{', functionStart);
    const functionSignature = content.substring(functionStart, functionEnd);
    
    if (functionSignature.includes('params')) {
      // Extract param names from the function signature
      const paramsMatch = functionSignature.match(/params:\s*Promise<\{([^}]+)\}>/);
      if (paramsMatch) {
        const paramNames = paramsMatch[1].split(',').map(p => p.trim().split(':')[0].trim());
        const destructuringLine = `\n    const { ${paramNames.join(', ')} } = await params\n`;
        
        // Insert after try {
        content = content.substring(0, tryIndex) + destructuringLine + content.substring(tryIndex);
        offset += destructuringLine.length;
      }
    }
  }
  
  // Replace all params.id, params.personId, etc. with just id, personId, etc.
  content = content.replace(/params\.(\w+)/g, '$1');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

// Find all API route files
function findApiRoutes(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

// Main execution
const apiDir = path.join(__dirname, '..', 'app', 'api');
const apiFiles = findApiRoutes(apiDir);

console.log(`Found ${apiFiles.length} API route files to fix:`);

for (const file of apiFiles) {
  fixApiRoute(file);
}

console.log('\n🎉 All API routes fixed for Next.js 15 compatibility!');
