const { existsSync } = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const frontendRoot = path.resolve(__dirname, "..");
const backendRoot = path.resolve(frontendRoot, "..", "backend");
const managePy = path.join(backendRoot, "manage.py");
const venvPython = path.join(backendRoot, "myenv", "Scripts", "python.exe");
const candidates = [
  { command: venvPython, args: [] },
  { command: "python", args: [] },
  { command: "py", args: ["-3"] },
];

if (!existsSync(managePy)) {
  console.error(`Backend startup failed: manage.py not found at ${managePy}`);
  process.exit(1);
}

function resolvePython() {
  for (const candidate of candidates) {
    const commandLooksMissing =
      path.isAbsolute(candidate.command) && !existsSync(candidate.command);
    if (commandLooksMissing) continue;

    const probe = spawnSync(
      candidate.command,
      [...candidate.args, "-c", "import sys; print(sys.executable)"],
      {
        cwd: backendRoot,
        encoding: "utf8",
        shell: false,
      }
    );

    if (probe.status === 0) {
      return candidate;
    }
  }

  return null;
}

const python = resolvePython();

if (!python) {
  console.error("Backend startup failed: no working Python interpreter was found.");
  console.error(`Checked virtualenv: ${venvPython}`);
  console.error("The current backend virtualenv appears broken and global Python is unavailable.");
  console.error("Recreate the backend virtualenv or install a working Python launcher, then run npm start again.");
  process.exit(1);
}

const child = spawn(
  python.command,
  [...python.args, managePy, "runserver"],
  {
    cwd: backendRoot,
    stdio: "inherit",
    shell: false,
  }
);

child.on("error", (error) => {
  console.error(`Backend startup failed: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
