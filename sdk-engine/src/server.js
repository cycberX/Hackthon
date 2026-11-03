import fs from "node:fs/promises";
import path from "node:path";

const PROJECTS_DIR = path.resolve("generated", "projects");

export async function saveProject(projectId, project) {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });

  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);

  await fs.writeFile(
    filePath,
    JSON.stringify(project, null, 2),
    "utf8"
  );
}

export async function getProject(projectId) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}