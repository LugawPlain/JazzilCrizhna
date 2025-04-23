import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { dbAdmin } from "@/lib/firebase/adminApp"; // Use shared Firestore instance
import { revalidateTag } from "next/cache"; // <-- Import revalidateTag

// Type for the expected request body
interface UpdateDetailsRequestBody {
  identifier: string; // Expecting id or r2FileKey
  category?: string; // Expecting category to find collection
  updates: {
    event?: string;
    location?: string;
    eventDate?: string; // Changed from date to eventDate
    photographer?: string;
    photographerLink?: string;
  };
}

// Add validation helper for date ranges after the interface definition
const validateDateRange = (dateString: string): boolean => {
  // No validation needed for empty values
  if (!dateString) return true;

  // Check if it's a range format (contains a hyphen)
  if (dateString.includes("-")) {
    const dateParts = dateString.split("-").map((part) => part.trim());

    // Must have exactly two parts with content
    if (dateParts.length !== 2 || !dateParts[0] || !dateParts[1]) {
      return false;
    }

    // Try to parse both dates
    const startDate = new Date(dateParts[0]);
    const endDate = new Date(dateParts[1]);

    // Both must be valid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    // Optionally check that end date is after start date
    // return endDate >= startDate;

    return true;
  }

  // If not a range, just check if it's a valid date
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export async function POST(request: NextRequest) {
  // 1. Check Admin Authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 2. Check if Firestore is available
  if (!dbAdmin) {
    console.error(
      "[API UpdateDetails] Firestore instance (dbAdmin) is not available."
    );
    return NextResponse.json(
      { error: "Server configuration error (Database not ready)." },
      { status: 500 }
    );
  }

  // 3. Parse and Validate Request Body
  let body: UpdateDetailsRequestBody;
  try {
    body = await request.json();
    if (!body || typeof body !== "object")
      throw new Error("Invalid request body format.");
    if (!body.identifier || typeof body.identifier !== "string")
      throw new Error("Missing or invalid image identifier.");
    if (!body.category || typeof body.category !== "string")
      throw new Error("Missing or invalid category.");
    if (!body.updates || typeof body.updates !== "object")
      throw new Error("Missing or invalid updates object.");
  } catch (error: unknown) {
    // Type guard for error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API UpdateDetails] Invalid request body:", error);
    return NextResponse.json(
      { error: "Invalid request body.", details: errorMessage },
      { status: 400 }
    );
  }

  const { identifier, category, updates } = body;

  // Construct dynamic collection name (lowercase)
  const collectionName = `${category.toLowerCase()}_uploads`;

  console.log(
    `[API UpdateDetails] Admin ${session.user.email} updating doc ${identifier} in ${collectionName} with:`,
    updates
  );

  try {
    // 4. Find Firestore Document (by id or r2FileKey)
    // Firestore doesn't directly support OR queries like this easily.
    // We might need two queries or know which identifier is being sent.
    // Assuming identifier is r2FileKey for now as it's more likely unique across categories.
    // If you use Firestore document IDs, adjust the query.

    const querySnapshot = await dbAdmin
      .collection(collectionName)
      .where("r2FileKey", "==", identifier) // Query by r2FileKey
      .limit(1)
      .get();

    let docRef;
    if (!querySnapshot.empty) {
      docRef = querySnapshot.docs[0].ref;
      console.log(
        `[API UpdateDetails] Found document by r2FileKey: ${docRef.id}`
      );
    } else {
      // Optional: Try finding by Firestore ID if r2FileKey fails
      try {
        const potentialDoc = await dbAdmin
          .collection(collectionName)
          .doc(identifier)
          .get();
        if (potentialDoc.exists) {
          docRef = potentialDoc.ref;
          console.log(`[API UpdateDetails] Found document by ID: ${docRef.id}`);
        }
      } catch (idError: unknown) {
        const idErrorMessage =
          idError instanceof Error ? idError.message : String(idError);
        console.warn(
          `[API UpdateDetails] Could not check for document by ID ${identifier}:`,
          idErrorMessage
        );
      }
    }

    if (!docRef) {
      console.error(
        `[API UpdateDetails] Document not found with identifier: ${identifier} in collection ${collectionName}`
      );
      return NextResponse.json(
        { error: "Image record not found." },
        { status: 404 }
      );
    }

    // 5. Prepare Update Data (sanitize/validate updates if necessary)
    const dataToUpdate: { [key: string]: unknown } = {};
    if (updates.event !== undefined) dataToUpdate.event = updates.event;
    if (updates.location !== undefined)
      dataToUpdate.location = updates.location;

    // Validate eventDate field (could be a range)
    if (updates.eventDate !== undefined) {
      // Check for valid date format/range
      if (!validateDateRange(updates.eventDate)) {
        return NextResponse.json(
          {
            error:
              "Invalid date format. Use MM/DD/YYYY for single dates or MM/DD/YYYY - MM/DD/YYYY for ranges.",
          },
          { status: 400 }
        );
      }
      dataToUpdate.eventDate = updates.eventDate; // Store as string
    }

    if (updates.photographer !== undefined)
      dataToUpdate.photographer = updates.photographer;
    if (updates.photographerLink !== undefined)
      dataToUpdate.photographerLink = updates.photographerLink;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    // 6. Update Firestore Document
    // Get the document data before update for comparison
    const docBeforeUpdate = await docRef.get();
    const beforeData = docBeforeUpdate.data();

    // Perform the update
    await docRef.update(dataToUpdate);

    // Get updated document for verification
    const docAfterUpdate = await docRef.get();
    const afterData = docAfterUpdate.data();

    // Create detailed log of changes
    const detailedChanges = Object.keys(dataToUpdate).reduce(
      (changes, field) => {
        changes[field] = {
          from: (beforeData?.[field] as unknown) || null,
          to: (afterData?.[field] as unknown) || null,
        };
        return changes;
      },
      {} as Record<string, { from: unknown; to: unknown }>
    );

    console.log(
      `[API UpdateDetails] Successfully updated document ${docRef.id} in ${collectionName}`
    );
    console.log(`[API UpdateDetails] Fields changed:`, detailedChanges);
    console.log(`[API UpdateDetails] Admin user: ${session.user?.email}`);
    console.log(`[API UpdateDetails] Timestamp: ${new Date().toISOString()}`);

    // <-- Add revalidateTag call here -->
    try {
      const tag = `images-${category.toLowerCase()}`;
      revalidateTag(tag);
      console.log(`[API UpdateDetails] Revalidated tag: ${tag}`);
    } catch (revalidateError: unknown) {
      // Log the error but don't fail the request
      const revalidateErrorMessage =
        revalidateError instanceof Error
          ? revalidateError.message
          : String(revalidateError);
      console.error(
        `[API UpdateDetails] Failed to revalidate tag 'images-${category.toLowerCase()}':`,
        revalidateErrorMessage
      );
    }
    // <-- End revalidateTag call -->

    // Add a timestamp to the response and prevent caching
    return NextResponse.json(
      {
        success: true,
        message: "Details updated successfully.",
        updatedFields: Object.keys(dataToUpdate),
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: unknown) {
    // Type guard for error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[API UpdateDetails] Error updating Firestore for ${identifier}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to update image details.", details: errorMessage },
      { status: 500 }
    );
  }
}
