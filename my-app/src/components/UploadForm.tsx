// components/UploadForm.js
import React, { useState } from "react";
import { db, storage } from "../lib/firebase"; // Adjust path if needed
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function UploadForm() {
  const [imageFile, setImageFile] = useState(null);
  const [dateTaken, setDateTaken] = useState("");
  const [location, setLocation] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !dateTaken || !location || !photographer) {
      setError("Please fill in all fields and select an image.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    // --- 1. Upload Image to Firebase Storage ---
    // Create a unique filename (e.g., using timestamp and original name)
    const fileName = `<span class="math-inline">\{Date\.now\(\)\}\-</span>{imageFile.name}`;
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
                storagePath: storageRef.fullPath, // Good practice to store path too
                createdAt: serverTimestamp(), // Firestore timestamp
              });

              setSuccess(true);
              // Reset form (optional)
              setImageFile(null);
              setDateTaken("");
              setLocation("");
              setPhotographer("");
              e.target.reset(); // Reset file input visually
            } catch (firestoreError) {
              console.error("Error adding document: ", firestoreError);
              setError(`Failed to save metadata: ${firestoreError.message}`);
            } finally {
              setIsUploading(false);
            }
          })
          .catch((urlError) => {
            console.error("Error getting download URL:", urlError);
            setError(`Failed to get image URL: ${urlError.message}`);
            setIsUploading(false);
          });
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Upload New Photo</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && (
        <p style={{ color: "green" }}>Photo uploaded successfully!</p>
      )}

      <div>
        <label htmlFor="fileInput">Photo:</label>
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          onChange={handleFileChange}
          required
        />
      </div>
      <div>
        <label htmlFor="dateTaken">Date Taken:</label>
        <input
          type="date"
          id="dateTaken"
          value={dateTaken}
          onChange={(e) => setDateTaken(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="location">Location:</label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="photographer">Photographer:</label>
        <input
          type="text"
          id="photographer"
          value={photographer}
          onChange={(e) => setPhotographer(e.target.value)}
          required
        />
      </div>

      {isUploading && <p>Uploading: {progress}%</p>}

      <button type="submit" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload Photo"}
      </button>
    </form>
  );
}

export default UploadForm;
