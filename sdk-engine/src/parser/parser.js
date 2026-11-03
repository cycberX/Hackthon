import SwaggerParser from "@apidevtools/swagger-parser";

const SUPPORTED_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
];

function createOperationName(method, path, operationId) {
  if (operationId) {
    return operationId.replace(/[^a-zA-Z0-9_$]/g, "_");
  }

  const pathName = path
    .replace(/[{}]/g, "")
    .split("/")
    .filter(Boolean)
    .join("_");

  return `${method}_${pathName || "root"}`;
}

function extractParameters(parameters = []) {
  return parameters.map((parameter) => ({
    name: parameter.name,
    in: parameter.in,
    required: Boolean(parameter.required),
    description: parameter.description || "",
    schema: parameter.schema || {},
  }));
}

function extractRequestBody(requestBody) {
  if (!requestBody) return null;

  const content = requestBody.content || {};
  const jsonContent =
    content["application/json"] ||
    content["application/*+json"];

  return {
    required: Boolean(requestBody.required),
    description: requestBody.description || "",
    contentType: jsonContent ? "application/json" : null,
    schema: jsonContent?.schema || null,
  };
}

function extractResponses(responses = {}) {
  return Object.entries(responses).map(([status, response]) => ({
    status,
    description: response.description || "",
    contentTypes: Object.keys(response.content || {}),
  }));
}

export async function parseOpenAPISpec(document) {
  if (!document || typeof document !== "object") {
    throw new Error("Invalid OpenAPI document");
  }

  // Reject external references before validation to avoid fetching remote files.
  function checkExternalRefs(value) {
    if (!value || typeof value !== "object") return;

    for (const [key, child] of Object.entries(value)) {
      if (
        key === "$ref" &&
        typeof child === "string" &&
        !child.startsWith("#/")
      ) {
        throw new Error(
          `External references are not supported: ${child}`
        );
      }

      checkExternalRefs(child);
    }
  }

  checkExternalRefs(document);

  const version = document.openapi;

  if (!/^3\.(0|1)\.\d+$/.test(version || "")) {
    throw new Error("Only OpenAPI 3.0.x and 3.1.x are supported");
  }

  const api = await SwaggerParser.validate(document, {
    resolve: {
      external: false,
    },
  });

  const operations = [];

  for (const [path, pathItem] of Object.entries(api.paths || {})) {
    for (const method of SUPPORTED_METHODS) {
      const operation = pathItem?.[method];

      if (!operation) continue;

      const parameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || []),
      ];

      operations.push({
        name: createOperationName(
          method,
          path,
          operation.operationId
        ),
        operationId: operation.operationId || null,
        method: method.toUpperCase(),
        path,
        summary: operation.summary || "",
        description: operation.description || "",
        parameters: extractParameters(parameters),
        requestBody: extractRequestBody(operation.requestBody),
        responses: extractResponses(operation.responses),
      });
    }
  }

  if (operations.length === 0) {
    throw new Error("No supported API endpoints found");
  }

  return {
    name: api.info?.title || "Untitled API",
    version: api.info?.version || "1.0.0",
    description: api.info?.description || "",
    baseUrl: api.servers?.[0]?.url || "",
    operations,
    totalEndpoints: operations.length,
  };
}