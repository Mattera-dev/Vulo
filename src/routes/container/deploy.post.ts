import type { MultipartValue } from "@fastify/multipart";
import { RouteBuilder } from "../../core/RouteBuilder.ts";
import { mkdir, rmdir } from "fs/promises";
import { checkHash, discardStream, normalizeExtractPath, processDeployStream, saveHashToJson } from "../../utils/functions.ts";
import { LanguageDetector } from "../../utils/LanguageDetector.ts";

const route = new RouteBuilder().setPath("/containers/deploy").setMethod("post").setExec(async (request, reply) => {
    try {
        const dataFile = await request.file();

        if (!dataFile || !['zip', 'rar'].includes(dataFile.filename.split('.').pop()!)) {
            await discardStream(dataFile);
            reply.status(400).send({ error: "Invalid file. Please upload a zip or rar file." });
            return;
        }

        if (!dataFile.fields.projectName) {
            await discardStream(dataFile);
            reply.status(400).send({ error: "Project name is required. Please provide a project name." });
            return;
        }

        if (!dataFile.fields.fileHash) {
            await discardStream(dataFile);
            reply.status(400).send({ error: "File hash is required. Please provide a file hash." });
            return;
        }

        const projectNameField = dataFile.fields.projectName as MultipartValue
        const fileHashField = dataFile.fields.fileHash as MultipartValue
        const projectName = projectNameField.value;
        const fileHash = fileHashField.value as string;

        if (!projectName || typeof projectName !== "string" || projectName.trim() === "") {
            await discardStream(dataFile);
            reply.status(400).send({ error: "Invalid project name. Please provide a valid project name." });
            return;
        }
        //check for valid sha256 hash (64 characters, hexadecimal)
        const sha256Regex = /^[a-fA-F0-9]{64}$/;
        if (!sha256Regex.test(fileHash)) {
            await discardStream(dataFile);
            reply.status(400).send({ error: "Invalid file hash. Please provide a valid SHA-256 hash." });
            return;
        }
        const dataHash = await checkHash(fileHash);
        if (dataHash) {
            await discardStream(dataFile);
            reply.status(200).send({ msg: "This file already exists.", data: dataHash });
            return;
        }

        const uploadPath = `./uploads/${projectName}-${Date.now()}`;
        try {
            await mkdir(uploadPath, { recursive: true });
            try {
                const { hash } = await processDeployStream(dataFile.file, uploadPath);
                await normalizeExtractPath(uploadPath);
                const languageData = await LanguageDetector.detect(uploadPath);
                if (!languageData || "error" in languageData) {
                    await rmdir(uploadPath);
                    reply.status(400).send({ error: "Could not detect the project language. Make sure it has a valid package.json or requirements.txt." });
                    return;
                }
                await saveHashToJson(hash, projectName, uploadPath, new Date());
                reply.status(202).send({ msg: "File uploaded and extracted successfully. your project will be up on a few minutes", data: languageData });

                request.server.docker.container.buildAndDeploy(languageData, 512, projectName, uploadPath);
            } catch (error) {
                console.error("Error extracting file:", error);
                reply.status(500).send({ error: "Failed to extract the uploaded file. Try again later." });
                return;
            }
        } catch (error) {
            console.error("Error creating upload directory:", error);
            reply.status(500).send({ error: "Failed to create upload directory. Try again later." });
            return;
        }

        const error = false

        const data = "ok"

        if (error) {
            reply.status(500).send({ error });
        } else {
            reply.send({ containers: data });
        }
    } catch (error) {
        console.log(error);
        reply.status(400).send({ error: "Invalid file." });
        return;
    }
}).build();

export default route