# BallTalk App Codebase Consolidation

This document outlines the process for consolidating the BallTalk app codebase to improve maintainability, reduce duplication, and ensure a consistent structure.

## Background

The BallTalk app codebase has evolved over time, resulting in:

- Duplicate files across different directories
- Components scattered across various locations
- Multiple navigation systems (React Navigation and Expo Router)
- Legacy directories that are no longer actively used

This consolidation effort aims to address these issues and establish a more organized structure.

## Directory Structure

The target directory structure is:

```
balltalkapp/
├── app/                  # Expo Router screens and navigation
├── assets/               # Static assets (images, fonts, etc.)
├── components/           # Reusable UI components
│   ├── audio/            # Audio-related components
│   ├── chat/             # Chat-related components
│   ├── common/           # Common UI components
│   ├── profile/          # Profile-related components
│   └── studio/           # Studio-related components
├── config/               # Configuration files
├── contexts/             # React context providers
├── hooks/                # Custom React hooks
├── models/               # Data models and interfaces
├── services/             # Business logic and API services
├── styles/               # Global styles and themes
├── utils/                # Utility functions
└── scripts/              # Utility scripts for development
```

## Consolidation Tools

To assist with the consolidation process, we've created several scripts:

### 1. Consolidation Analysis Script

The `consolidate-codebase.js` script analyzes the codebase and generates a report of:

- Potential duplicate files
- Components that should be moved to the components directory
- Screens that should be migrated to the app directory
- Legacy directories that should be removed

Usage:
```
npm run consolidate
```

To update the consolidation report:
```
npm run consolidate -- --update-report
```

### 2. Screen Migration Script

The `migrate-screen.js` script helps migrate screens from the `screens` directory to the `app` directory, updating imports and navigation code to use Expo Router.

Usage:
```
npm run migrate-screen screens/ScreenName.tsx app/screen-name.tsx
```

### 3. Component Extraction Script

The `extract-component.js` script helps extract reusable components from screens or other files, creating a new component file and updating the source file to import the new component.

Usage:
```
npm run extract-component path/to/source.tsx ComponentName components/category
```

### 4. Duplicate Resolution Script

The `resolve-duplicate.js` script helps resolve duplicate files by comparing their content, showing the differences, and allowing you to choose which file to keep.

Usage:
```
npm run resolve-duplicate file1.tsx file2.tsx
```

Options:
```
--keep=file1    Specify which file to keep (file1 or file2)
--dry-run       Show what would be done without making changes
```

### 5. Asset Path Fixing Script

The `fix-asset-paths.js` script helps fix asset path issues in the codebase by identifying incorrect paths and updating them to point to the correct locations.

Usage:
```
npm run fix-asset-paths --scan
```

Options:
```
--scan           Scan the codebase for potential asset path issues
--fix            Fix identified asset path issues
--target=<file>  Fix asset paths in a specific file
--dry-run        Show what would be done without making changes
```

### 6. Missing Asset Creation Script

The `create-missing-assets.js` script helps create placeholder assets for missing files referenced in the code.

Usage:
```
npm run create-missing-assets --scan
```

Options:
```
--scan           Scan the codebase for missing assets
--create         Create placeholder assets for missing files
--dry-run        Show what would be done without making changes
```

### 7. Import Update Script

The `update-imports.js` script helps update imports after moving files, ensuring that all references point to the correct locations.

Usage:
```
npm run update-imports --scan
```

Options:
```
--scan           Scan the codebase for imports that need to be updated
--fix            Fix identified import issues
--map=<file>     Specify a JSON file with old->new path mappings
--dry-run        Show what would be done without making changes
```

## Consolidation Process

Follow these steps to consolidate the codebase:

1. **Analyze the codebase**:
   ```
   npm run consolidate -- --update-report
   ```
   Review the generated `consolidation-report.md` file.

2. **Resolve duplicate files**:
   - For each pair of duplicate files, decide which one to keep
   - Update imports in other files to point to the kept file
   - Remove the duplicate file
   ```
   npm run resolve-duplicate file1.tsx file2.tsx
   ```

3. **Migrate screens**:
   - Use the migration script to move screens to the app directory
   - Test each screen after migration to ensure it works correctly
   ```
   npm run migrate-screen screens/ScreenName.tsx app/screen-name.tsx
   ```

4. **Extract reusable components**:
   - Identify components that can be reused across multiple screens
   - Use the extraction script to move them to the components directory
   ```
   npm run extract-component path/to/source.tsx ComponentName components/category
   ```

5. **Fix asset paths**:
   - Scan for asset path issues in the codebase
   - Fix incorrect asset paths to ensure they point to the correct locations
   - Create placeholder assets for missing files
   ```
   npm run fix-asset-paths --scan
   npm run fix-asset-paths --fix
   npm run create-missing-assets --create
   ```

6. **Update imports**:
   - Scan for import issues in the codebase
   - Fix imports to point to the new file locations
   - Use custom mappings if needed
   ```
   npm run update-imports --scan
   npm run update-imports --fix
   ```

7. **Test thoroughly**:
   - Test the application after each significant change
   - Ensure all features work correctly with the new structure

8. **Remove legacy directories**:
   - Once all files have been migrated, remove the legacy directories

## Best Practices

When consolidating the codebase, follow these best practices:

1. **Make incremental changes**:
   - Work on one section or feature at a time
   - Test thoroughly after each change

2. **Use consistent naming conventions**:
   - Use kebab-case for file names in the app directory
   - Use PascalCase for component file names
   - Use camelCase for utility and service file names

3. **Organize by feature**:
   - Group related components, hooks, and services together
   - Consider creating feature-specific directories for complex features

4. **Document changes**:
   - Update documentation to reflect the new structure
   - Add comments to explain complex changes or decisions

5. **Maintain backward compatibility**:
   - Ensure existing features continue to work
   - Consider adding temporary compatibility layers if needed

## Progress Tracking

Track the consolidation progress in the `consolidation-report.md` file, which is updated each time you run:

```
npm run consolidate -- --update-report
```

## Troubleshooting

If you encounter issues during the consolidation process:

1. **Import errors**:
   - Check that all imports have been updated to point to the new file locations
   - Look for absolute imports that may need to be converted to relative imports

2. **Navigation issues**:
   - Ensure that all navigation code has been updated to use Expo Router
   - Check for hardcoded routes or navigation parameters

3. **Component rendering issues**:
   - Verify that all props are being passed correctly to extracted components
   - Check for context dependencies that may need to be added

4. **Build errors**:
   - Clear the build cache and node_modules if you encounter persistent build issues
   - Check for circular dependencies that may have been introduced

## Conclusion

By following this consolidation process, we aim to create a more maintainable, efficient, and consistent codebase for the BallTalk app. This will improve developer productivity, reduce bugs, and make it easier to add new features in the future. 