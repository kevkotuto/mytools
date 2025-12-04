import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir, readdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// Common passwords to try
const commonPasswords = [
  "123456", "password", "12345678", "qwerty", "123456789",
  "12345", "1234", "111111", "1234567", "dragon",
  "123123", "baseball", "abc123", "football", "monkey",
  "letmein", "696969", "shadow", "master", "666666",
  "qwertyuiop", "123321", "mustang", "1234567890", "michael",
  "654321", "superman", "1qaz2wsx", "7777777",
  "121212", "000000", "qazwsx", "123qwe",
  "killer", "trustno1", "jordan", "jennifer", "zxcvbnm",
  "asdfgh", "hunter", "buster", "soccer", "harley",
  "batman", "andrew", "tigger", "sunshine", "iloveyou",
  "2000", "charlie", "robert", "thomas",
  "hockey", "ranger", "daniel", "starwars", "klaster",
  "112233", "george", "computer", "michelle",
  "jessica", "pepper", "1111", "zxcvbn", "555555",
  "11111111", "131313", "freedom", "777777", "pass",
  "maggie", "159753", "aaaaaa", "ginger",
  "princess", "joshua", "cheese", "amanda", "summer",
  "love", "ashley", "6969", "nicole", "chelsea",
  "matthew", "access", "yankees", "987654321",
  "dallas", "austin", "thunder", "taylor", "matrix",
  "test", "admin", "root", "toor", "user",
  "guest", "default", "welcome", "password1", "password123",
  "azerty", "motdepasse", "secret", "private", "public",
  "bonjour", "soleil", "amour", "france", "paris",
  "marseille", "lyon", "toulouse", "bordeaux", "nantes",
  "2020", "2021", "2022", "2023", "2024", "2025",
  "1990", "1991", "1992", "1993", "1994", "1995",
  "1996", "1997", "1998", "1999", "2001",
  "2002", "2003", "2004", "2005", "2006", "2007",
  "2008", "2009", "2010", "2011", "2012", "2013",
  "2014", "2015", "2016", "2017", "2018", "2019",
];

async function tryPassword(zipPath: string, password: string, outputDir: string): Promise<boolean> {
  try {
    // Use 7z to try extracting with password
    await execAsync(`7z x -p"${password}" -o"${outputDir}" -y "${zipPath}"`, {
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}

async function createZipFromDirectory(dir: string, outputPath: string): Promise<void> {
  await execAsync(`cd "${dir}" && 7z a -tzip "${outputPath}" ./*`);
}

export async function POST(request: NextRequest) {
  const workDir = join(tmpdir(), `zip-unlock-${randomUUID()}`);
  const extractDir = join(workDir, "extracted");

  try {
    // Create work directory
    await mkdir(workDir, { recursive: true });
    await mkdir(extractDir, { recursive: true });

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const method = formData.get("method") as string || "dictionary";
    const knownPassword = formData.get("knownPassword") as string | null;
    const customWordlistStr = formData.get("customWordlist") as string | null;
    const maxLength = parseInt(formData.get("maxLength") as string || "4", 10);
    const charsetStr = formData.get("charset") as string || "lowercase,digits";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Save uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    const zipPath = join(workDir, "input.zip");
    await writeFile(zipPath, buffer);

    let foundPassword: string | null = null;
    let attemptedPasswords = 0;

    // Try with known password first
    if (method === "known" && knownPassword) {
      if (await tryPassword(zipPath, knownPassword, extractDir)) {
        foundPassword = knownPassword;
      }
      attemptedPasswords = 1;
    }

    // Dictionary attack
    if (!foundPassword && (method === "dictionary" || method === "known")) {
      // Add custom wordlist if provided
      const passwords = [...commonPasswords];
      if (customWordlistStr) {
        const customWords = customWordlistStr.split("\n").map(w => w.trim()).filter(Boolean);
        passwords.unshift(...customWords);
      }

      for (const password of passwords) {
        attemptedPasswords++;
        if (await tryPassword(zipPath, password, extractDir)) {
          foundPassword = password;
          break;
        }
        // Clear extract dir for next attempt
        await rm(extractDir, { recursive: true, force: true });
        await mkdir(extractDir, { recursive: true });
      }
    }

    // Brute force attack
    if (!foundPassword && method === "bruteforce") {
      const charset: string[] = [];
      const charsetOptions = charsetStr.split(",");

      if (charsetOptions.includes("lowercase")) {
        charset.push(...'abcdefghijklmnopqrstuvwxyz'.split(''));
      }
      if (charsetOptions.includes("uppercase")) {
        charset.push(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
      }
      if (charsetOptions.includes("digits")) {
        charset.push(...'0123456789'.split(''));
      }
      if (charsetOptions.includes("special")) {
        charset.push(...'!@#$%^&*()_+-=[]{}|;:,.<>?'.split(''));
      }

      // Generate passwords of increasing length
      const maxAttempts = 100000; // Safety limit

      for (let length = 1; length <= maxLength && !foundPassword && attemptedPasswords < maxAttempts; length++) {
        const generator = generatePasswords(charset, length);

        for (const password of generator) {
          attemptedPasswords++;
          if (attemptedPasswords >= maxAttempts) break;

          if (await tryPassword(zipPath, password, extractDir)) {
            foundPassword = password;
            break;
          }
          // Clear extract dir for next attempt
          await rm(extractDir, { recursive: true, force: true });
          await mkdir(extractDir, { recursive: true });
        }
      }
    }

    if (!foundPassword) {
      // Cleanup
      await rm(workDir, { recursive: true, force: true });

      return NextResponse.json({
        success: false,
        message: "Mot de passe non trouvé",
        attemptedPasswords,
      });
    }

    // Create new zip without password
    const outputPath = join(workDir, "unlocked.zip");
    await createZipFromDirectory(extractDir, outputPath);

    // Read the unlocked file
    const unlockedBuffer = await readFile(outputPath);

    // Cleanup
    await rm(workDir, { recursive: true, force: true });

    // Return the unlocked file
    return new NextResponse(unlockedBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${file.name.replace(".zip", "_unlocked.zip")}"`,
        "X-Found-Password": foundPassword,
        "X-Attempted-Passwords": attemptedPasswords.toString(),
      },
    });

  } catch (error) {
    // Cleanup on error
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    console.error("ZIP unlock error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du fichier" },
      { status: 500 }
    );
  }
}

function* generatePasswords(charset: string[], length: number): Generator<string> {
  if (length === 1) {
    for (const char of charset) {
      yield char;
    }
    return;
  }

  for (const char of charset) {
    for (const rest of generatePasswords(charset, length - 1)) {
      yield char + rest;
    }
  }
}
