import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    scanForComposeFiles,
    parseComposeFile,
    executeComposeCommand,
    getContainerStatus
} from '../services/composeService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Store for discovered compose files (in-memory cache)
let composeFilesCache = [];
let lastScanTime = null;

/**
 * GET /api/compose/files
 * List all docker-compose.yml files found on the system
 */
router.get('/files', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const cacheAge = lastScanTime ? Date.now() - lastScanTime : Infinity;

        // Use cache if less than 5 minutes old and not forcing refresh
        if (!forceRefresh && cacheAge < 5 * 60 * 1000 && composeFilesCache.length > 0) {
            return res.json({
                files: composeFilesCache,
                cached: true,
                lastScan: lastScanTime
            });
        }

        // Scan for compose files
        const files = await scanForComposeFiles();
        composeFilesCache = files;
        lastScanTime = Date.now();

        res.json({
            files,
            cached: false,
            lastScan: lastScanTime
        });

    } catch (err) {
        console.error('Error scanning files:', err);
        res.status(500).json({ error: 'Failed to scan for compose files' });
    }
});

/**
 * GET /api/compose/files/:id/details
 * Get parsed details of a specific compose file
 */
router.get('/files/:id/details', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id, 10);

        // Find the file in cache
        if (fileId < 0 || fileId >= composeFilesCache.length) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = composeFilesCache[fileId];
        const [details, status] = await Promise.all([
            parseComposeFile(file.path),
            getContainerStatus(file.path)
        ]);

        res.json({
            file,
            details,
            status
        });

    } catch (err) {
        console.error('Error parsing file:', err);
        res.status(500).json({ error: 'Failed to parse compose file' });
    }
});

/**
 * POST /api/compose/files/:id/command
 * Execute a docker-compose command on a specific file
 */
router.post('/files/:id/command', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id, 10);
        const { command } = req.body;

        // Validate command
        const allowedCommands = ['up', 'down', 'build', 'ps', 'logs'];
        if (!command || !allowedCommands.includes(command)) {
            return res.status(400).json({
                error: `Invalid command. Allowed: ${allowedCommands.join(', ')}`
            });
        }

        // Find the file in cache
        if (fileId < 0 || fileId >= composeFilesCache.length) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = composeFilesCache[fileId];
        const result = await executeComposeCommand(file.path, command);

        res.json({
            file,
            command,
            result
        });

    } catch (err) {
        console.error('Error executing command:', err);
        res.status(500).json({
            error: 'Failed to execute command',
            details: err.message
        });
    }
});

/**
 * GET /api/compose/files/:id/status
 * Get container status for a specific compose file
 */
router.get('/files/:id/status', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id, 10);

        // Find the file in cache
        if (fileId < 0 || fileId >= composeFilesCache.length) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = composeFilesCache[fileId];
        const status = await getContainerStatus(file.path);

        res.json({
            file,
            status
        });

    } catch (err) {
        console.error('Error getting status:', err);
        res.status(500).json({ error: 'Failed to get container status' });
    }
});

export default router;
