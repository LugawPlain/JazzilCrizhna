# Portfolio Image Data Automation

This directory contains scripts to help manage the portfolio website data.

## update-images-data.js

This script automatically updates the `public/images-data.json` file by scanning the categories directories for images. It maintains all the metadata for existing images while adding new images and removing entries for deleted images.

### How It Works

1. Scans all category directories in the `public/categories/` folder
2. For each category:
   - Finds all image files with the specified extensions (currently `.webp`)
   - Adds new images with default empty metadata fields
   - Updates existing image entries (preserving their metadata)
   - Removes entries for images that no longer exist in the filesystem

### Usage

Run the script using npm:

```bash
npm run update-images
```

### Image Structure

Each image entry contains the following fields:

```json
{
  "filename": "1.webp", // The file name
  "filepath": "/portfolio/category/1.webp", // Path for the image
  "event": "", // Event name (optional)
  "location": "", // Location (optional)
  "date": "", // Date in YYYY-MM-DD format (optional)
  "photographer": "", // Photographer name (optional)
  "photographerLink": "" // Link to photographer website/profile (optional)
}
```

### Customization

If you need to modify the script behavior:

- Add more image file extensions in the `imageExtensions` array
- Change the directory structure by modifying the `categoriesDir` constant
- Add or modify the metadata fields in the new image template
