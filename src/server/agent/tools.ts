import { readFileSync } from "node:fs";
import { ARM_TORQUE_PATH } from "@/engineering/arm-torque";
import { breadcrumbs, webApplication, webPage } from "./jsonld";
import type { Page } from "./page-types";

// Interactive engineering tools. Each is a React route ("spa"): the server
// supplies the head, the method and FAQ Markdown (also the .md twin), and the
// part of that Markdown from `persistentFrom` stays visible below the tool.

function content(file: string): string {
    return readFileSync(new URL(`./content/${file}`, import.meta.url), "utf8").trim();
}

function tool(
    path: string,
    title: string,
    description: string,
    file: string,
    persistentFrom: string,
): Page {
    const body = content(file);
    return {
        path,
        kind: "spa",
        title,
        description,
        body: () => body,
        persistentFrom,
        persistentLabel: "Method, examples and questions",
        jsonLd: () => [
            webPage("WebPage", path, title),
            webApplication(path, title, description),
            breadcrumbs([
                { name: "Home", path: "/" },
                { name: title, path },
            ]),
        ],
    };
}

export const MOTOR_TORQUE_PATH = "/tools/motor-torque-calculator";

export const TOOL_PAGES: Page[] = [
    tool(
        MOTOR_TORQUE_PATH,
        "Motor torque calculator: torque, power and RPM",
        "Calculate motor torque from power and RPM, or power and speed from torque. SI and imperial units, gearbox losses, and robot actuators that match.",
        "motor-torque-calculator.md",
        "\n\n## How the calculator works",
    ),
    tool(
        ARM_TORQUE_PATH,
        "Robot arm torque calculator: holding torque per joint",
        "Calculate static holding torque at each robot arm joint from link lengths, masses and payload, then screen catalog actuators joint by joint.",
        "robot-arm-torque-calculator.md",
        "\n\n## How the calculation works",
    ),
];
