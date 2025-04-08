"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import { db, storage } from "../lib/firebase"; // Adjust path if needed
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function UploadForm() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dateTaken, setDateTaken] = useState("");
  const [location, setLocation] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Categories for the dropdown
  const categories = [
    "PAGEANT",
    "MODELING",
    "ADVERTISING",
    "CLOTHING",
    "MUSE",
    "PHOTOSHOOT",
    "COSPLAY",
    "OTHERS",
  ];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!imageFile || !dateTaken || !location || !photographer || !category) {
      setError("Please fill in all fields and select an image.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    // --- 1. Upload Image to Firebase Storage ---
    // Create a unique filename (e.g., using timestamp and original name)
    const fileName = `${Date.now()}-${imageFile.name}`;
    const storageRef = ref(storage, `images/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        const progressPercent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(progressPercent);
      },
      (uploadError) => {
        // Handle unsuccessful uploads
        console.error("Upload Error:", uploadError);
        setError(`Upload failed: ${uploadError.message}`);
        setIsUploading(false);
      },
      () => {
        // Handle successful uploads on complete
        // --- 2. Get Image Download URL ---
        getDownloadURL(uploadTask.snapshot.ref)
          .then(async (downloadURL) => {
            console.log("File available at", downloadURL);

            // --- 3. Save Metadata (including URL) to Firestore ---
            try {
              const photosCollectionRef = collection(db, "photos"); // "photos" is the collection name
              await addDoc(photosCollectionRef, {
                imageUrl: downloadURL,
                dateTaken: dateTaken,
                location: location,
                photographerName: photographer,
                category: category,
                storagePath: storageRef.fullPath, // Good practice to store path too
                createdAt: serverTimestamp(), // Firestore timestamp
              });

              setSuccess(true);
              // Reset form (optional)
              setImageFile(null);
              setDateTaken("");
              setLocation("");
              setPhotographer("");
              setCategory("");
              e.currentTarget.reset(); // Reset file input visually
            } catch (firestoreError: unknown) {
              console.error("Error adding document: ", firestoreError);
              const errorMessage =
                firestoreError instanceof Error
                  ? firestoreError.message
                  : "Unknown error occurred";
              setError(`Failed to save metadata: ${errorMessage}`);
            } finally {
              setIsUploading(false);
            }
          })
          .catch((urlError: unknown) => {
            console.error("Error getting download URL:", urlError);
            const errorMessage =
              urlError instanceof Error
                ? urlError.message
                : "Unknown error occurred";
            setError(`Failed to get image URL: ${errorMessage}`);
            setIsUploading(false);
          });
      }
    );
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-40">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Upload New Photo
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Photo uploaded successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="fileInput"
            className="block text-sm font-medium text-gray-700"
          >
            Photo:
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="fileInput"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="fileInput"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
          {imageFile && (
            <p className="mt-1 text-sm text-gray-500">
              Selected: {imageFile.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="dateTaken"
            className="block text-sm font-medium text-gray-700"
          >
            Date Taken:
          </label>
          <input
            type="date"
            id="dateTaken"
            value={dateTaken}
            onChange={(e) => setDateTaken(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location:
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Where was the photo taken?"
          />
        </div>

        <div>
          <label
            htmlFor="photographer"
            className="block text-sm font-medium text-gray-700"
          >
            Photographer:
          </label>
          <input
            type="text"
            id="photographer"
            value={photographer}
            onChange={(e) => setPhotographer(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Who took the photo?"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category:
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
            <p className="text-sm text-gray-500 mt-1">Uploading: {progress}%</p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isUploading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isUploading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            }`}
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload Photo"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadForm;
