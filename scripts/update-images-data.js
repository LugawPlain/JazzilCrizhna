import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const categoriesDir = path.join(process.cwd(), "public", "categories");
const jsonFilePath = path.join(process.cwd(), "public", "images-data.json");
const imageExtensions = [".webp"]; // Add more extensions if needed

// Ensure categories directory exists
function ensureDirectoriesExist() {
  const dirs = [path.join(process.cwd(), "public"), categoriesDir];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Function to read the JSON file
function readImagesData() {
  try {
    const data = fs.readFileSync(jsonFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return { others: {} }; // Return a default structure if file doesn't exist
  }
}

// Function to write the JSON file
function writeImagesData(data) {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf8");
    console.log("Successfully updated images-data.json");
  } catch (error) {
    console.error("Error writing JSON file:", error);
  }
}

// Function to scan a directory for image files
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory does not exist: ${dirPath}`);
    return [];
  }

  try {
    const files = fs.readdirSync(dirPath);
    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map((file) => ({
        filename: file,
        filepath: `/portfolio/${path.basename(dirPath).toLowerCase()}/${file}`,
      }));
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return [];
  }
}

// Main function to update the JSON data
function updateImagesData() {
  // Ensure necessary directories exist
  ensureDirectoriesExist();

  // Read the current data
  const imagesData = readImagesData();

  // Get all category directories
  let categories = [];
  try {
    categories = fs.readdirSync(categoriesDir).filter((item) => {
      const itemPath = path.join(categoriesDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
  } catch (error) {
    console.error("Error reading categories directory:", error);
    console.error(
      "Make sure the categories directory exists at:",
      categoriesDir
    );
    return;
  }

  // Process each category
  categories.forEach((category) => {
    const categoryLower = category.toLowerCase();
    const categoryDir = path.join(categoriesDir, category);
    const images = scanDirectory(categoryDir);

    // Create category if it doesn't exist
    if (!imagesData[categoryLower]) {
      imagesData[categoryLower] = {};
    }

    // Track existing images to detect deletions
    const existingImages = new Set(Object.keys(imagesData[categoryLower]));

    // Process each image
    images.forEach((image) => {
      // Extract number from filename (assuming format like "1.webp")
      const imageNumber = path.parse(image.filename).name;

      // Remove from existing set (will be used to detect deletions)
      existingImages.delete(imageNumber);

      // If entry exists, preserve its metadata
      if (imagesData[categoryLower][imageNumber]) {
        // Update only filename and filepath
        imagesData[categoryLower][imageNumber].filename = image.filename;
        imagesData[categoryLower][imageNumber].filepath = image.filepath;

        // Only add pinned property if it doesn't exist yet, don't modify existing values
        if (!imagesData[categoryLower][imageNumber].hasOwnProperty("pinned")) {
          imagesData[categoryLower][imageNumber].pinned = false;
        }
      } else {
        // Create new entry with default empty values
        imagesData[categoryLower][imageNumber] = {
          filename: image.filename,
          filepath: image.filepath,
          event: "",
          location: "",
          date: "",
          photographer: "",
          photographerLink: "",
          pinned: false, // Default to false for new entries
        };
      }
    });

    // Remove entries for deleted images
    existingImages.forEach((imageNumber) => {
      delete imagesData[categoryLower][imageNumber];
    });
  });

  // Save the updated data
  writeImagesData(imagesData);
}

// Function to add pinned property to all existing images that don't have it yet
function addPinnedPropertyToExistingImages() {
  console.log(
    "Adding 'pinned: false' property only to images that don't have it yet..."
  );

  // Read the current data
  const imagesData = readImagesData();
  let modifiedCount = 0;

  // Process each category
  Object.keys(imagesData).forEach((category) => {
    // Process each image in the category
    Object.keys(imagesData[category]).forEach((imageKey) => {
      // Add pinned property ONLY if it doesn't exist
      if (!imagesData[category][imageKey].hasOwnProperty("pinned")) {
        imagesData[category][imageKey].pinned = false;
        modifiedCount++;
      }
    });
  });

  // Save the updated data only if changes were made
  if (modifiedCount > 0) {
    writeImagesData(imagesData);
    console.log(`Added 'pinned: false' property to ${modifiedCount} images.`);
  } else {
    console.log(
      "All images already have the 'pinned' property, no changes needed."
    );
  }
}

// Run the update
updateImagesData();

// Add pinned property to all existing images that don't have it yet
addPinnedPropertyToExistingImages();

// Output help message
console.log("");
console.log("Images data updated successfully!");
console.log(
  "You can run this script anytime you add or remove images from the categories directories."
);
console.log("To add this script to your package.json scripts:");
console.log('"scripts": {');
console.log('  "update-images": "node src/scripts/update-images-data.js"');
console.log("}");
console.log("Then run with: npm run update-images");
