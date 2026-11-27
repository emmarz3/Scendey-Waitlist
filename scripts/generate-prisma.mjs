import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  // Prisma generation parses the datasource URL but does not connect to it.
  // This placeholder lets clean preview installs generate a client without
  // requiring production database credentials in the build environment.
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://scendey:generate-only@127.0.0.1:5432/scendey",
};

const result = spawnSync(
  process.platform === "win32" ? "prisma.cmd" : "prisma",
  ["generate"],
  { stdio: "inherit", env, shell: process.platform === "win32" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
