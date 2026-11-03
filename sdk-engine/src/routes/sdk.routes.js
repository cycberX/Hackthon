import { Router } from "express";
import multer from "multer";
import { parse as parseYaml } from "yaml";
import { randomUUID } from "node:crypto";

import { parseOpenAPISpec } from "../parser/openapi.parser.js";
import { saveProject } from "../services/project.store.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an OpenAPI JSON or YAML file",
      });
    }

    const extension = req.file.originalname
      .split(".")
      .pop()
      .toLowerCase();

    if (!["json", "yaml", "yml"].includes(extension)) {
      return res.status(400).json({
        success: false,
        message: "Only JSON and YAML files are supported",
      });
    }

    const fileContent = req.file.buffer.toString("utf8");

    let document;

    try {
      document =
        extension === "json"
          ? JSON.parse(fileContent)
          : parseYaml(fileContent);
    } catch {
      return res.status(400).json({
        success: false,
        message: "The uploaded file contains invalid JSON or YAML",
      });
    }

    const parsedProject = await parseOpenAPISpec(document);
    const projectId = randomUUID();

    await saveProject(projectId, parsedProject);

    return res.status(201).json({
      success: true,
      message: "OpenAPI specification parsed successfully",
      projectId,
      project: parsedProject,
    });
  } catch (error) {
    console.error("SDK upload error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process OpenAPI specification",
    });
  }
});

export default router;