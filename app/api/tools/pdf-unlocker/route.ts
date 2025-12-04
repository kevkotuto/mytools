import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";

const execAsync = promisify(exec);

interface EncryptionInfo {
  isEncrypted: boolean;
  hasUserPassword: boolean;
  hasOwnerPassword: boolean;
  restrictions: string[];
  rawOutput?: string;
}

async function getEncryptionInfo(pdfPath: string): Promise<EncryptionInfo> {
  try {
    const { stdout, stderr } = await execAsync(`qpdf --show-encryption "${pdfPath}" 2>&1`);
    const output = stdout + stderr;

    // Check if file is not encrypted
    if (output.includes("File is not encrypted")) {
      return {
        isEncrypted: false,
        hasUserPassword: false,
        hasOwnerPassword: false,
        restrictions: [],
        rawOutput: output,
      };
    }

    // File is encrypted - parse restrictions
    const restrictions: string[] = [];

    // Check print restrictions
    if (output.includes("print: none") || output.includes("print: n")) {
      restrictions.push("print");
    } else if (output.includes("print: low")) {
      restrictions.push("print-high-res");
    }

    // Check modify restrictions
    if (output.includes("modify: none") || output.includes("modify: n")) {
      restrictions.push("modify");
    }

    // Check extract/copy restrictions
    if (output.includes("extract: n") || output.includes("extract for accessibility: n")) {
      restrictions.push("copy");
    }

    // Check annotate restrictions
    if (output.includes("annotate: n")) {
      restrictions.push("annotate");
    }

    // Check form fill restrictions
    if (output.includes("form: n") || output.includes("modify forms: n")) {
      restrictions.push("fill-forms");
    }

    // Check assemble restrictions
    if (output.includes("assemble: n") || output.includes("modify assembly: n")) {
      restrictions.push("assemble");
    }

    // A PDF with only owner password (restrictions) can be opened without password
    // qpdf can decrypt it without knowing the owner password
    // User password is only required when the PDF cannot be opened at all
    // If we got here (no error), the PDF can be opened, so no user password is needed
    return {
      isEncrypted: true,
      hasUserPassword: false, // We could read it, so no user password required
      hasOwnerPassword: true,
      restrictions,
      rawOutput: output,
    };
  } catch (error) {
    // If qpdf fails with password error, the file requires a user password to open
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("password") ||
      errorMessage.includes("invalid password") ||
      errorMessage.includes("incorrect password")
    ) {
      return {
        isEncrypted: true,
        hasUserPassword: true,
        hasOwnerPassword: true,
        restrictions: [],
        rawOutput: errorMessage,
      };
    }

    // For other errors, try to continue
    console.error("qpdf show-encryption error:", errorMessage);
    throw error;
  }
}

async function canDecryptWithoutPassword(pdfPath: string): Promise<boolean> {
  try {
    // Try to decrypt without password - if it works, no user password is set
    await execAsync(`qpdf --decrypt "${pdfPath}" --empty 2>&1`);
    return true;
  } catch {
    return false;
  }
}

async function removePdfRestrictions(
  inputPath: string,
  outputPath: string,
  userPassword?: string
): Promise<void> {
  let command = `qpdf --decrypt`;

  if (userPassword) {
    command += ` --password="${userPassword}"`;
  }

  command += ` "${inputPath}" "${outputPath}"`;

  await execAsync(command);
}

export async function POST(request: NextRequest) {
  const workDir = join(tmpdir(), `pdf-unlock-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userPassword = formData.get("userPassword") as string | null;
    const action = formData.get("action") as string || "unlock";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Verify it's a PDF
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Le fichier doit être un PDF" }, { status: 400 });
    }

    // Save uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    const inputPath = join(workDir, "input.pdf");
    await writeFile(inputPath, buffer);

    // Action: analyze
    if (action === "analyze") {
      let info = await getEncryptionInfo(inputPath);

      // Double-check: try to actually decrypt to see if we need a password
      if (info.isEncrypted && !info.hasUserPassword) {
        const testOutputPath = join(workDir, "test.pdf");
        try {
          await removePdfRestrictions(inputPath, testOutputPath);
          // Success - no user password needed
          info.hasUserPassword = false;
        } catch (decryptError) {
          const msg = String(decryptError);
          if (msg.includes("password")) {
            info.hasUserPassword = true;
          }
        }
      }

      await rm(workDir, { recursive: true, force: true });

      return NextResponse.json({
        isEncrypted: info.isEncrypted,
        hasUserPassword: info.hasUserPassword,
        hasOwnerPassword: info.hasOwnerPassword,
        restrictions: info.restrictions,
      });
    }

    // Action: unlock
    let info = await getEncryptionInfo(inputPath);

    if (!info.isEncrypted) {
      await rm(workDir, { recursive: true, force: true });
      return NextResponse.json({
        success: false,
        message: "Ce PDF n'a pas de restrictions",
      });
    }

    // Remove restrictions
    const outputPath = join(workDir, "unlocked.pdf");

    try {
      await removePdfRestrictions(inputPath, outputPath, userPassword || undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("password")) {
        await rm(workDir, { recursive: true, force: true });
        return NextResponse.json({
          success: false,
          message: "Ce PDF nécessite un mot de passe pour être ouvert. Veuillez le fournir.",
          requiresPassword: true,
        });
      }

      throw error;
    }

    // Read the unlocked file
    const unlockedBuffer = await readFile(outputPath);

    // Cleanup
    await rm(workDir, { recursive: true, force: true });

    // Return the unlocked file
    const outputName = file.name.replace(/\.pdf$/i, "_unlocked.pdf");

    return new NextResponse(unlockedBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outputName}"`,
        "X-Removed-Restrictions": info.restrictions.join(","),
      },
    });

  } catch (error) {
    // Cleanup on error
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    console.error("PDF unlock error:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du fichier" },
      { status: 500 }
    );
  }
}
