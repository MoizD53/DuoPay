import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ApiError } from "@/lib/errors";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  upiId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, upiId } = registerSchema.parse(body);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(res => res[0]);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: "Email already registered" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        upiId: upiId || null,
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message } },
        { status: 422 }
      );
    }
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Something went wrong" } },
      { status: 500 }
    );
  }
}
