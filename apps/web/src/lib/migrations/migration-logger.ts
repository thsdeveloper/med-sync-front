/**
 * Migration Logger Utility
 *
 * Provides structured logging for data migration operations
 * with detailed tracking of successes, failures, and warnings.
 */

export interface MigrationLogEntry {
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    metadata?: Record<string, any>;
}

export interface MigrationResult {
    success: boolean;
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    warningCount: number;
    startTime: string;
    endTime: string;
    duration: number; // milliseconds
    logs: MigrationLogEntry[];
    errors: Array<{
        facilityId?: string;
        facilityName?: string;
        error: string;
    }>;
}

export class MigrationLogger {
    private logs: MigrationLogEntry[] = [];
    private errors: Array<{ facilityId?: string; facilityName?: string; error: string }> = [];
    private successCount = 0;
    private failureCount = 0;
    private warningCount = 0;
    private startTime: Date;

    constructor() {
        this.startTime = new Date();
        this.info('Migration started');
    }

    private log(level: MigrationLogEntry['level'], message: string, metadata?: Record<string, any>) {
        const entry: MigrationLogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            metadata,
        };
        this.logs.push(entry);

        // Also log to console for real-time monitoring
        const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
        logMethod(`[${level.toUpperCase()}] ${message}`, metadata || '');
    }

    info(message: string, metadata?: Record<string, any>) {
        this.log('info', message, metadata);
    }

    success(message: string, metadata?: Record<string, any>) {
        this.log('success', message, metadata);
        this.successCount++;
    }

    warning(message: string, metadata?: Record<string, any>) {
        this.log('warning', message, metadata);
        this.warningCount++;
    }

    error(message: string, metadata?: Record<string, any>) {
        this.log('error', message, metadata);
        this.failureCount++;

        // Track detailed error information
        this.errors.push({
            facilityId: metadata?.facilityId,
            facilityName: metadata?.facilityName,
            error: message,
        });
    }

    getResult(): MigrationResult {
        const endTime = new Date();
        const duration = endTime.getTime() - this.startTime.getTime();

        return {
            success: this.failureCount === 0,
            totalProcessed: this.successCount + this.failureCount,
            successCount: this.successCount,
            failureCount: this.failureCount,
            warningCount: this.warningCount,
            startTime: this.startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration,
            logs: this.logs,
            errors: this.errors,
        };
    }

    printSummary() {
        const result = this.getResult();
        console.log('\n=== Migration Summary ===');
        console.log(`Status: ${result.success ? 'SUCCESS' : 'COMPLETED WITH ERRORS'}`);
        console.log(`Total Processed: ${result.totalProcessed}`);
        console.log(`Successful: ${result.successCount}`);
        console.log(`Failed: ${result.failureCount}`);
        console.log(`Warnings: ${result.warningCount}`);
        console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);

        if (result.errors.length > 0) {
            console.log('\n=== Errors ===');
            result.errors.forEach((err, idx) => {
                console.log(`${idx + 1}. ${err.facilityName || err.facilityId || 'Unknown'}: ${err.error}`);
            });
        }
        console.log('========================\n');
    }
}
