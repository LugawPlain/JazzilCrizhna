import {
  dbAdmin,
  initError as firebaseAdminInitError,
} from "@/lib/firebase/adminApp";
import { NextResponse } from "next/server";
import { z } from "zod";

// Define the schema for the request body
const subscribeSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email address. Please provide a valid email." }),
});

export async function POST(request: Request) {
  try {
    // Check if Firebase Admin SDK initialized correctly
    if (firebaseAdminInitError) {
      console.error(
        "Firebase Admin SDK initialization failed:",
        firebaseAdminInitError
      );
      return NextResponse.json(
        { message: "Server configuration error. Please try again later." },
        { status: 500 }
      );
    }

    if (!dbAdmin) {
      console.error("Firestore admin instance (dbAdmin) is not available.");
      return NextResponse.json(
        { message: "Server configuration error. Firestore not available." },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate the request body using the schema
    const validationResult = subscribeSchema.safeParse(body);

    if (!validationResult.success) {
      // If validation fails, return a 400 error with details
      // Zod provides detailed error messages, we can choose to send them or a generic one
      // console.error('Validation errors:', validationResult.error.flatten().fieldErrors);
      return NextResponse.json(
        {
          message:
            validationResult.error.flatten().fieldErrors.email?.[0] ||
            "Invalid input.",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // If validation is successful, proceed with the validated email
    const { email } = validationResult.data;

    const subscribersCollection = dbAdmin.collection("subscribers");
    const existingSubscriberQuery = await subscribersCollection
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingSubscriberQuery.empty) {
      return NextResponse.json(
        { message: "Email already subscribed." },
        { status: 409 } // 409 Conflict
      );
    }

    await subscribersCollection.add({
      email: email,
      subscribedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Successfully subscribed!" },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    // Handle potential JSON parsing errors or other unexpected errors
    if (error instanceof SyntaxError) {
      // Caused by invalid JSON in request.json()
      return NextResponse.json(
        { message: "Invalid request format." },
        { status: 400 }
      );
    }
    console.error("Subscription error:", error);
    return NextResponse.json(
      { message: "An error occurred during subscription." },
      { status: 500 }
    );
  }
}
