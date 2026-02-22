import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import yaml from 'js-yaml';

/**
 * Recursively scan directories for docker-compose files
 */
export async function scanForComposeFiles() {
    const scanDirs = (process.env.SCAN_DIRECTORIES || 'C:\\Users')
        .split(',')
        .map(d => d.trim());

    const composeFiles = [];
    const composePatterns = [
        'docker-compose.yml',
        'docker-compose.yaml',
        'compose.yml',
        'compose.yaml'
    ];

    for (const dir of scanDirs) {
        try {
            await scanDirectory(dir, composePatterns, composeFiles, 0, 5); // Max depth 5
        } catch (err) {
            console.warn(`Warning: Could not scan ${dir}:`, err.message);
        }
    }

    // Add index IDs
    return composeFiles.map((file, index) => ({
        id: index,
        ...file
    }));
}

/**
 * Recursively scan a directory for compose files
 */
async function scanDirectory(dirPath, patterns, results, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) return;

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Skip common directories that shouldn't be scanned
            const skipDirs = ['node_modules', '.git', 'vendor', '__pycache__', '.venv', 'venv'];

            if (entry.isDirectory()) {
                if (!skipDirs.includes(entry.name) && !entry.name.startsWith('.')) {
                    try {
                        await scanDirectory(fullPath, patterns, results, currentDepth + 1, maxDepth);
                    } catch (err) {
                        // Silently skip inaccessible directories
                    }
                }
            } else if (entry.isFile() && patterns.includes(entry.name.toLowerCase())) {
                try {
                    const stats = await fs.stat(fullPath);
                    results.push({
                        name: entry.name,
                        path: fullPath,
                        directory: dirPath,
                        size: stats.size,
                        modified: stats.mtime
                    });
                } catch (err) {
                    // Skip files we can't stat
                }
            }
        }
    } catch (err) {
        // Skip directories we can't read
    }
}

/**
 * Parse a docker-compose file and extract service details
 */
export async function parseComposeFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const parsed = yaml.load(content);

        const services = [];

        if (parsed && parsed.services) {
            for (const [name, config] of Object.entries(parsed.services)) {
                const service = {
                    name,
                    image: config.image || null,
                    build: config.build || null,
                    ports: [],
                    volumes: [],
                    environment: [],
                    depends_on: config.depends_on || [],
                    networks: config.networks || [],
                    command: config.command || null,
                    restart: config.restart || null
                };

                // Parse ports
                if (config.ports) {
                    service.ports = config.ports.map(p => {
                        if (typeof p === 'string') {
                            return p;
                        } else if (typeof p === 'object') {
                            return `${p.published || p.host}:${p.target || p.container}`;
                        }
                        return String(p);
                    });
                }

                // Parse volumes
                if (config.volumes) {
                    service.volumes = config.volumes.map(v => {
                        if (typeof v === 'string') {
                            return v;
                        } else if (typeof v === 'object') {
                            return `${v.source}:${v.target}`;
                        }
                        return String(v);
                    });
                }

                // Parse environment
                if (config.environment) {
                    if (Array.isArray(config.environment)) {
                        service.environment = config.environment;
                    } else if (typeof config.environment === 'object') {
                        service.environment = Object.entries(config.environment)
                            .map(([k, v]) => `${k}=${v}`);
                    }
                }

                services.push(service);
            }
        }

        return {
            version: parsed?.version || null,
            services,
            networks: parsed?.networks ? Object.keys(parsed.networks) : [],
            volumes: parsed?.volumes ? Object.keys(parsed.volumes) : [],
            raw: content
        };

    } catch (err) {
        throw new Error(`Failed to parse compose file: ${err.message}`);
    }
}

/**
 * Execute a docker-compose command
 */
export async function executeComposeCommand(filePath, command) {
    return new Promise((resolve, reject) => {
        const args = ['-f', filePath];

        // Add command-specific arguments
        switch (command) {
            case 'up':
                args.push('up', '-d');
                break;
            case 'down':
                args.push('down');
                break;
            case 'build':
                args.push('build');
                break;
            case 'ps':
                args.push('ps');
                break;
            case 'logs':
                args.push('logs', '--tail=100');
                break;
            default:
                return reject(new Error(`Unknown command: ${command}`));
        }

        const useSudo = process.env.USE_SUDO === 'true';
        const baseCmd = useSudo ? 'sudo' : 'docker';
        const cmdArgs = useSudo ? ['docker', 'compose', ...args] : ['compose', ...args];

        console.log(`Executing: ${baseCmd} ${cmdArgs.join(' ')}`);

        const process = spawn(baseCmd, cmdArgs, {
            cwd: path.dirname(filePath),
            shell: true
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            resolve({
                success: code === 0,
                exitCode: code,
                stdout,
                stderr,
                command: `${useSudo ? 'sudo ' : ''}docker compose ${args.join(' ')}`
            });
        });

        process.on('error', (err) => {
            reject(new Error(`Failed to execute command: ${err.message}`));
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            process.kill();
            reject(new Error('Command timed out after 5 minutes'));
        }, 5 * 60 * 1000);
    });
}

/**
 * Get container status for services in a compose file
 */
export async function getContainerStatus(filePath) {
    return new Promise((resolve) => {
        const args = ['-f', filePath, 'ps', '--format', 'json'];

        const useSudo = process.env.USE_SUDO === 'true';
        const baseCmd = useSudo ? 'sudo' : 'docker';
        const cmdArgs = useSudo ? ['docker', 'compose', ...args] : ['compose', ...args];

        console.log(`Getting status: ${baseCmd} ${cmdArgs.join(' ')}`);

        const process = spawn(baseCmd, cmdArgs, {
            cwd: path.dirname(filePath),
            shell: true
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            if (code !== 0 || !stdout.trim()) {
                // Return empty status if command fails or no output
                resolve({ services: {}, summary: { running: 0, total: 0 } });
                return;
            }

            try {
                // Parse JSON output - each line is a JSON object
                const lines = stdout.trim().split('\n').filter(line => line.trim());
                const services = {};
                let running = 0;

                for (const line of lines) {
                    try {
                        const container = JSON.parse(line);
                        const serviceName = container.Service || container.Name;
                        const state = container.State || 'unknown';
                        const status = container.Status || '';

                        services[serviceName] = {
                            name: serviceName,
                            containerId: container.ID || container.Id || null,
                            state: state.toLowerCase(),
                            status: status,
                            health: container.Health || null
                        };

                        if (state.toLowerCase() === 'running') {
                            running++;
                        }
                    } catch (parseErr) {
                        // Skip invalid JSON lines
                    }
                }

                resolve({
                    services,
                    summary: {
                        running,
                        total: Object.keys(services).length
                    }
                });
            } catch (err) {
                resolve({ services: {}, summary: { running: 0, total: 0 } });
            }
        });

        process.on('error', () => {
            resolve({ services: {}, summary: { running: 0, total: 0 } });
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            process.kill();
            resolve({ services: {}, summary: { running: 0, total: 0 } });
        }, 30 * 1000);
    });
}

export default {
    scanForComposeFiles,
    parseComposeFile,
    executeComposeCommand,
    getContainerStatus
};
