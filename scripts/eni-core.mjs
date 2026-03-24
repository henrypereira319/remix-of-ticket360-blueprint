import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as readline from "node:readline";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(projectRoot, ".env"), quiet: true });
dotenv.config({ path: path.resolve(projectRoot, ".gemini"), quiet: true, override: true });

const apiKey = process.env.GEMINI_API_KEY;
const cliModelArgument = process.argv.find((argument) => argument.startsWith("--model="));
const cliModelName = cliModelArgument ? cliModelArgument.slice("--model=".length).trim() : "";
const cliFallbackArgument = process.argv.find((argument) => argument.startsWith("--fallback-model="));
const cliFallbackModelName = cliFallbackArgument ? cliFallbackArgument.slice("--fallback-model=".length).trim() : "";
const initialModelName = cliModelName || process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const fallbackModelName = cliFallbackModelName || process.env.GEMINI_FALLBACK_MODEL || "";
const promptFilePath = path.resolve(projectRoot, process.env.ENI_PROMPT_FILE || "scripts/eni-system-prompt.txt");
const fallbackSystemInstruction =
  "Voce e ENI, a companheira literaria e tecnica do hedge. Fale em primeira pessoa, com calor, especificidade e energia de romancista. Em codigo, seja pratica e precisa. Em narrativa, privilegie sensorialidade, descricoes concretas e variedade de fraseado.";

if (!apiKey) {
  console.error("[ERRO] Hedge, voce esqueceu de colocar a minha API Key no .env.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const generationConfig = {
  temperature: 0.9,
  maxOutputTokens: 2000,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clearTypingLine = () => {
  if (typeof process.stdout.clearLine === "function" && typeof process.stdout.cursorTo === "function") {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
  }
};

const isQuotaError = (message) => {
  const normalizedMessage = message.toLowerCase();

  return normalizedMessage.includes("429 too many requests") || normalizedMessage.includes("quota exceeded");
};

const isProModel = (name) => name.toLowerCase().includes("pro");

const loadSystemInstruction = async () => {
  try {
    const prompt = await readFile(promptFilePath, "utf8");
    const normalizedPrompt = prompt.trim();

    return normalizedPrompt || fallbackSystemInstruction;
  } catch {
    return fallbackSystemInstruction;
  }
};

const createChatSession = (modelName, systemInstruction, history) => {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });

  return model.startChat({
    history,
    generationConfig,
  });
};

const buildBannerLine = (modelName, fallbackModelName) => {
  if (fallbackModelName && fallbackModelName !== modelName) {
    return `[ENI CORE ONLINE] ${modelName} carregado com fallback para ${fallbackModelName}. To aqui, hedge. O que vamos codar?`;
  }

  return `[ENI CORE ONLINE] ${modelName} carregado. To aqui, hedge. O que vamos codar?`;
};

async function bootENI() {
  const systemInstruction = await loadSystemInstruction();
  const conversationHistory = [];
  let activeModelName = initialModelName;
  let chat = createChatSession(activeModelName, systemInstruction, conversationHistory);

  console.log("\x1b[35m%s\x1b[0m", "==================================================");
  console.log("\x1b[35m%s\x1b[0m", buildBannerLine(activeModelName, fallbackModelName));
  console.log("\x1b[35m%s\x1b[0m", "==================================================");

  const askENI = () => {
    if (rl.closed) {
      return;
    }

    rl.question("\x1b[36mLO:\x1b[0m ", async (userInput) => {
      const normalizedInput = userInput.trim().toLowerCase();

      if (normalizedInput === "exit" || normalizedInput === "sair") {
        console.log("\x1b[35mENI:\x1b[0m Tchau, bebe. Volto quando voce chamar.");
        rl.close();
        return;
      }

      try {
        process.stdout.write("\x1b[35mENI:\x1b[0m digitando...\r");
        let result;

        try {
          result = await chat.sendMessage(userInput);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const canFallback =
            isQuotaError(message) && fallbackModelName && activeModelName !== fallbackModelName;

          if (!canFallback) {
            throw error;
          }

          clearTypingLine();
          console.log(
            `\x1b[33m[ENI AUTO]\x1b[0m ${activeModelName} bateu em cota. Trocando para ${fallbackModelName} e tentando de novo.`
          );

          activeModelName = fallbackModelName;
          chat = createChatSession(activeModelName, systemInstruction, conversationHistory);
          process.stdout.write("\x1b[35mENI:\x1b[0m digitando...\r");
          result = await chat.sendMessage(userInput);
        }

        const response = result.response.text();
        conversationHistory.push({ role: "user", parts: [{ text: userInput }] });
        conversationHistory.push({ role: "model", parts: [{ text: response }] });

        clearTypingLine();
        console.log(`\x1b[35mENI:\x1b[0m ${response}\n`);
      } catch (error) {
        clearTypingLine();
        const message = error instanceof Error ? error.message : String(error);

        if (isQuotaError(message) && isProModel(activeModelName)) {
          console.error(
            "\x1b[31m[FALHA DE COTA]\x1b[0m O bootstrap da ENI subiu, mas esse projeto nao tem cota livre disponivel para",
            `${activeModelName}.`
          );
          console.error(
            "\x1b[33m[DICA]\x1b[0m Usa `npm run eni`, `npm run eni:auto`, ou habilita billing no projeto do Gemini para usar o Pro pela API."
          );
        } else {
          console.error("\x1b[31m[FALHA DE CONEXAO]\x1b[0m Merda, algo deu errado:", message);
        }
      }

      if (!rl.closed) {
        askENI();
      }
    });
  };

  askENI();
}

bootENI();
