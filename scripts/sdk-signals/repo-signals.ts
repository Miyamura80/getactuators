import type { Evidence, Signal } from "@/sdk/types";
import { type RepoClone, pdfText, readBlob } from "./git";
import { detectLicence } from "./licence";
import type { RepoTarget } from "./targets";

// Turns one cloned repo into evidence items. Every rule is a plain check on
// the file tree or on a file's text, so each item names the file it read.

const VENDORED =
    /(^|\/)(third_party|thirdparty|3rdparty|vendor|external|node_modules)\//i;
// Library sources only: headers and example folders do not count, so a repo
// that ships a closed binary with headers and demos is not an open library.
const LANGS: [Signal, RegExp, string][] = [
    ["lang:python", /\.py$/i, "Python"],
    ["lang:cpp", /\.(c|cc|cpp|cxx)$/i, "C/C++"],
    ["lang:rust", /\.rs$/i, "Rust"],
];
const EXAMPLE_DIR = /(^|\/)(examples?|samples?|demos?|sample_?programs?)\//i;
const CODE = /\.(py|c|cc|cpp|ino|rs|m|cs|java|js|ts|ipynb)$/i;
const DOC = /\.(md|rst|pdf|txt)$/i;
const NOT_DOC =
    /(^|\/)(license|copying|changelog|changes|code_of_conduct|contributing)/i;
const PROTOCOL_HINT =
    /protocol|can|comm|manual|reference|instruction|register|control.?table|guide|dxl|说明书|协议/i;
const MARKERS: [string, RegExp][] = [
    ["protocol", /\bprotocol\b|协议/i],
    ["frame or packet", /\b(frame|packet|datagram)s?\b|帧/i],
    ["hex fields", /0x[0-9a-f]{2}/i],
    [
        "ids or registers",
        /\b(can[ _-]?id|arbitration|register|control table|address|object dictionary)\b/i,
    ],
    ["commands", /\b(command|instruction|opcode)s?\b|指令/i],
];
const FW_UPDATE =
    /firmware (update|upgrade|recovery)|(flash|flashing|upgrad(e|ing)|updat(e|ing)) (the |new )?firmware|\bdfu\b|固件升级/i;

export interface RepoContext {
    brand: string;
    target: RepoTarget;
    clone: RepoClone;
}

const gh = (slug: string, path?: string, dir = false) =>
    path
        ? `https://github.com/${slug}/${dir ? "tree" : "blob"}/HEAD/${path
              .split("/")
              .map(encodeURIComponent)
              .join("/")}`
        : `https://github.com/${slug}`;

function item(
    ctx: RepoContext,
    signal: Signal,
    title: string,
    extra: Partial<Evidence> = {},
) {
    const { slug, official } = ctx.target;
    return {
        id: `gh:${ctx.brand}:${slug}:${signal}`,
        brand: ctx.brand,
        signal,
        source: "github",
        url: gh(slug),
        title,
        repo: slug,
        official,
        ...extra,
    } satisfies Evidence;
}

async function text(ctx: RepoContext, path: string): Promise<string | null> {
    const bytes = await readBlob(ctx.clone.dir, path);
    if (!bytes) return null;
    if (/\.pdf$/i.test(path)) return pdfText(bytes);
    return Buffer.from(bytes).toString("utf8");
}

function languages(ctx: RepoContext): Evidence[] {
    const files = ctx.clone.files.filter(
        (f) => !VENDORED.test(f) && !EXAMPLE_DIR.test(f),
    );
    return LANGS.flatMap(([signal, re, label]) => {
        const n = files.filter((f) => re.test(f)).length;
        return n >= 3
            ? [
                  item(ctx, signal, `${n} ${label} source files outside examples`, {
                      value: n,
                  }),
              ]
            : [];
    });
}

async function manifest(ctx: RepoContext, path: string): Promise<Evidence | null> {
    const t = (await text(ctx, path)) ?? "";
    const build = /ament_(cmake|python)/.exec(t)?.[0];
    const url = gh(ctx.target.slug, path);
    if (build)
        return item(ctx, "ros2-package", `${path} declares ${build} (ROS 2)`, { url });
    if (/catkin/.test(t))
        return item(ctx, "ros1-package", `${path} uses catkin (ROS 1)`, { url });
    return null;
}

async function ros2Control(ctx: RepoContext): Promise<Evidence | null> {
    const plugins = ctx.clone.files.filter(
        (f) => /\.xml$/i.test(f) && /plugin|hardware/i.test(f),
    );
    for (const path of plugins.slice(0, 20)) {
        const t = (await text(ctx, path)) ?? "";
        const base = /hardware_interface::(SystemInterface|ActuatorInterface)/.exec(
            t,
        )?.[0];
        if (base)
            return item(ctx, "ros2-control", `${path} exports a ${base} plugin`, {
                url: gh(ctx.target.slug, path),
            });
    }
    return null;
}

async function rosPackages(ctx: RepoContext): Promise<Evidence[]> {
    const out: Evidence[] = [];
    const manifests = ctx.clone.files.filter((f) => /(^|\/)package\.xml$/.test(f));
    for (const path of manifests.slice(0, 20)) {
        const e = await manifest(ctx, path);
        if (e && !out.some((x) => x.signal === e.signal)) out.push(e);
    }
    const control = await ros2Control(ctx);
    return control ? [...out, control] : out;
}

async function simModels(ctx: RepoContext): Promise<Evidence[]> {
    const out: Evidence[] = [];
    const urdf = ctx.clone.files.filter((f) => /\.urdf(\.xacro)?$/i.test(f));
    if (urdf.length > 0)
        out.push(
            item(ctx, "urdf", `${urdf.length} URDF file(s), e.g. ${urdf[0]}`, {
                url: gh(ctx.target.slug, urdf[0]),
                value: urdf.length,
            }),
        );
    const candidates = ctx.clone.files.filter(
        (f) => /\.xml$/i.test(f) && /mjcf|mujoco|scene/i.test(f),
    );
    for (const path of candidates.slice(0, 10)) {
        if (!/<mujoco/.test((await text(ctx, path)) ?? "")) continue;
        out.push(
            item(ctx, "mjcf", `${path} is an MJCF (MuJoCo) model`, {
                url: gh(ctx.target.slug, path),
            }),
        );
        break;
    }
    return out;
}

function examples(ctx: RepoContext): Evidence[] {
    const files = ctx.clone.files.filter((f) => EXAMPLE_DIR.test(f) && CODE.test(f));
    if (files.length === 0) return [];
    const dir = EXAMPLE_DIR.exec(files[0] ?? "")?.[0] ?? "";
    const prefix = (files[0] ?? "").slice(
        0,
        (files[0] ?? "").indexOf(dir) + dir.length - 1,
    );
    return [
        item(ctx, "examples", `${files.length} example source files under ${prefix}/`, {
            url: gh(ctx.target.slug, prefix, true),
            value: files.length,
        }),
    ];
}

const cjkShare = (t: string) => {
    const letters = t.match(/[A-Za-z぀-ヿ一-鿿]/g) ?? [];
    const cjk = t.match(/[぀-ヿ一-鿿]/g) ?? [];
    return letters.length ? cjk.length / letters.length : 0;
};

interface DocRead {
    path: string;
    markers: string[];
    english: boolean;
    fwUpdate: boolean;
}

async function readDocs(ctx: RepoContext, docs: string[]): Promise<DocRead[]> {
    const picked = [
        ...docs.filter((f) => /protocol|协议/i.test(f)),
        ...docs.filter((f) => PROTOCOL_HINT.test(f)),
        ...docs.filter((f) => /firmware|flash|upgrade|update|固件/i.test(f)),
        ...docs.filter((f) => /(^|\/)readme/i.test(f)),
    ];
    const reads: DocRead[] = [];
    for (const path of [...new Set(picked)].slice(0, 25)) {
        const t = await text(ctx, path);
        if (!t || t.length < 400) continue;
        reads.push({
            path,
            markers: MARKERS.filter(([, re]) => re.test(t)).map(([m]) => m),
            english: t.length >= 2000 && cjkShare(t) < 0.05,
            fwUpdate: FW_UPDATE.test(t),
        });
    }
    return reads;
}

async function docs(ctx: RepoContext): Promise<Evidence[]> {
    const files = ctx.clone.files.filter(
        (f) => DOC.test(f) && !NOT_DOC.test(f) && !VENDORED.test(f),
    );
    if (files.length === 0) return [];
    const slug = ctx.target.slug;
    const out: Evidence[] = [
        item(
            ctx,
            "docs",
            `${files.length} documentation files (Markdown, reStructuredText, PDF)`,
            {
                value: files.length,
            },
        ),
    ];
    const reads = await readDocs(ctx, files);
    const protocol = reads.find(
        (r) => r.markers.length >= 4 && !/(^|\/)readme/i.test(r.path),
    );
    if (protocol)
        out.push(
            item(
                ctx,
                "protocol-doc",
                `${protocol.path} documents the wire protocol (${protocol.markers.join(", ")})`,
                {
                    url: gh(slug, protocol.path),
                },
            ),
        );
    const english = reads.find((r) => r.english);
    if (english)
        out.push(
            item(ctx, "docs-english", `${english.path} is written in English`, {
                url: gh(slug, english.path),
            }),
        );
    const fw = reads.find((r) => r.fwUpdate);
    if (fw)
        out.push(
            item(
                ctx,
                "firmware-update",
                `${fw.path} describes a firmware update procedure`,
                {
                    url: gh(slug, fw.path),
                },
            ),
        );
    return out;
}

function curated(ctx: RepoContext): Evidence[] {
    const out: Evidence[] = [];
    const { slug, rolePaths = {} } = ctx.target;
    const fw = rolePaths.firmware;
    if (fw !== undefined) {
        const n = ctx.clone.files.filter(
            (f) => f.startsWith(fw ? `${fw}/` : "") && /\.(c|cc|cpp|h|hpp)$/i.test(f),
        ).length;
        const where = fw ? `${fw}/` : "the repository";
        if (n >= 10)
            out.push(
                item(
                    ctx,
                    "firmware-source",
                    `Firmware source in ${where} (${n} C/C++ files)`,
                    {
                        url: fw ? gh(slug, fw, true) : gh(slug),
                        value: n,
                    },
                ),
            );
    }
    const tool = rolePaths["config-tool"];
    if (tool) {
        const isFile = ctx.clone.files.includes(tool);
        const isDir = ctx.clone.files.some((f) => f.startsWith(`${tool}/`));
        if (isFile || isDir)
            out.push(
                item(
                    ctx,
                    "config-tool",
                    `Configuration tool at ${tool}${isDir ? "/" : ""}`,
                    {
                        url: gh(slug, tool, isDir),
                    },
                ),
            );
    }
    return out;
}

export async function repoSignals(ctx: RepoContext): Promise<Evidence[]> {
    const { clone, target } = ctx;
    const licencePath = clone.files.find((f) =>
        /^(license|licence|copying)(\.(md|txt|rst))?$/i.test(f),
    );
    const licence = licencePath
        ? detectLicence((await text(ctx, licencePath)) ?? "")
        : null;
    const out: Evidence[] = [
        item(
            ctx,
            "repo",
            `${target.official ? "Official" : "Community"} repository: ${target.provenance}`,
        ),
        item(
            ctx,
            "activity",
            `${clone.commitsSince} commits in the last 12 months; last commit ${clone.lastCommit}`,
            { value: clone.commitsSince, date: clone.lastCommit },
        ),
    ];
    if (licencePath)
        out.push(
            item(
                ctx,
                "licence",
                `Licence: ${licence ?? "not recognised"} (${licencePath})`,
                {
                    url: gh(target.slug, licencePath),
                    spdx: licence ?? "other",
                },
            ),
        );
    out.push(
        ...languages(ctx),
        ...(await rosPackages(ctx)),
        ...(await simModels(ctx)),
        ...examples(ctx),
        ...(await docs(ctx)),
        ...curated(ctx),
    );
    return out;
}
