const fs = require('fs');
const path = require('path');

// Check if UserService.ts exists
const userServicePath = path.join(__dirname, '..', 'services', 'UserService.ts');
console.log(`Checking if UserService.ts exists at: ${userServicePath}`);

if (fs.existsSync(userServicePath)) {
  console.log('✅ UserService.ts file exists');
  
  // Read the file content
  const content = fs.readFileSync(userServicePath, 'utf8');
  console.log('File content length:', content.length);
  
  // Check if it exports a class
  if (content.includes('class UserService')) {
    console.log('✅ UserService class is defined');
  } else {
    console.error('❌ UserService class is not defined');
  }
  
  // Check if it has the required methods
  if (content.includes('getUserById')) {
    console.log('✅ getUserById method is defined');
  } else {
    console.error('❌ getUserById method is not defined');
  }
  
  if (content.includes('searchUsers')) {
    console.log('✅ searchUsers method is defined');
  } else {
    console.error('❌ searchUsers method is not defined');
  }
  
  if (content.includes('getUserByEmail')) {
    console.log('✅ getUserByEmail method is defined');
  } else {
    console.error('❌ getUserByEmail method is not defined');
  }
  
  // Check if it's exported correctly
  if (content.includes('export default UserService')) {
    console.log('✅ UserService is exported correctly');
  } else {
    console.error('❌ UserService is not exported correctly');
  }
} else {
  console.error('❌ UserService.ts file does not exist');
}

// Check if SongDetailScreen.tsx imports UserService correctly
const songDetailScreenPath = path.join(__dirname, '..', 'screens', 'SongDetailScreen.tsx');
console.log(`\nChecking if SongDetailScreen.tsx imports UserService correctly at: ${songDetailScreenPath}`);

if (fs.existsSync(songDetailScreenPath)) {
  console.log('✅ SongDetailScreen.tsx file exists');
  
  // Read the file content
  const content = fs.readFileSync(songDetailScreenPath, 'utf8');
  
  // Check if it imports UserService
  if (content.includes("import UserService from '../services/UserService'")) {
    console.log('✅ SongDetailScreen.tsx imports UserService correctly');
  } else {
    console.error('❌ SongDetailScreen.tsx does not import UserService correctly');
  }
  
  // Check if it instantiates UserService
  if (content.includes('const userService = new UserService()')) {
    console.log('✅ SongDetailScreen.tsx instantiates UserService correctly');
  } else {
    console.error('❌ SongDetailScreen.tsx does not instantiate UserService correctly');
  }
  
  // Check if it uses userService.getUserById
  if (content.includes('userService.getUserById')) {
    console.log('✅ SongDetailScreen.tsx uses userService.getUserById');
  } else {
    console.error('❌ SongDetailScreen.tsx does not use userService.getUserById');
  }
} else {
  console.error('❌ SongDetailScreen.tsx file does not exist');
}

console.log('\nTest completed.'); 