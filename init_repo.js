const fs = require('fs');
const { execSync } = require('child_process');

try {
  if (fs.existsSync('.git')) {
    console.log('Removing old .git directory...');
    fs.rmSync('.git', { recursive: true, force: true });
  }

  console.log('Initializing fresh git repository...');
  execSync('git init', { stdio: 'inherit' });

  // ensure a nice clean commit
  console.log('Adding files...');
  execSync('git add .', { stdio: 'inherit' });

  console.log('Committing...');
  execSync('git commit -m "Initial commit: Splitting Fullstack App (Vite Client + Express Server)"', { stdio: 'inherit' });

  console.log('\n--- SUCCESS ---');
  console.log('Local repository initialized, added, and committed successfully.');
} catch (e) {
  console.error("Error creating repo:", e.message);
}

// Clean up this script
fs.unlinkSync(__filename);
