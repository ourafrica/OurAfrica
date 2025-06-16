import { initializeDatabase } from "../src/server/database";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../src/server/database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_MODULE_PATH = path.join(
  __dirname,
  "../src/data/sample-module.json"
);

async function main() {
  console.log("Initializing database...");

  // Initialize database schema
  initializeDatabase();

  // Check if sample module exists in the database
  const moduleExists = db
    .prepare("SELECT COUNT(*) as count FROM modules WHERE title = ?")
    .get("Introduction to Computer Science") as { count: number };

  if (moduleExists.count === 0) {
    // Insert sample module
    console.log("Adding sample module to database...");

    try {
      // Check if sample module data file exists
      if (fs.existsSync(SAMPLE_MODULE_PATH)) {
        const sampleModuleData = JSON.parse(
          fs.readFileSync(SAMPLE_MODULE_PATH, "utf8")
        );

        db.prepare(
          `
          INSERT INTO modules (title, description, content, version)
          VALUES (?, ?, ?, ?)
        `
        ).run(
          sampleModuleData.title,
          sampleModuleData.description,
          JSON.stringify(sampleModuleData.content),
          "1.0.0"
        );

        console.log("Sample module added successfully");
      } else {
        console.log(
          "Sample module data file not found, skipping sample data import"
        );
      }
    } catch (error) {
      console.error("Failed to add sample module:", error);
    }
  } else {
    console.log("Sample module already exists in database");
  }

  console.log("Database initialization complete");
}

main().catch(console.error);
