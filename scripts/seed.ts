// Environment variables are loaded via --env-file flag in package.json
// Now import modules that depend on environment variables
import connectDB from "../lib/db";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { UserRole } from "../lib/constants";

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const existingAdmin = await User.findOne({
      email: adminEmail,
      isDeleted: false,
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      name: "Admin User",
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });

    console.log("Admin user created successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    console.log("\nPlease change the default password after first login!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
