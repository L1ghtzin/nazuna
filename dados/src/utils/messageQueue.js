/**
 * MessageQueue - Gerenciador de fila de mensagens para evitar spam e limites de taxa
 */
class MessageQueue {
    constructor(maxWorkers = 4, batchSize = 10, messagesPerBatch = 2) {
        this.queue = [];
        this.maxWorkers = maxWorkers;
        this.batchSize = batchSize;
        this.messagesPerBatch = messagesPerBatch;
        this.activeWorkers = 0;
        this.isProcessing = false;
        this.processingInterval = null;
        this.errorHandler = null;
        this.stats = {
            totalProcessed: 0,
            totalErrors: 0,
            currentQueueLength: 0,
            startTime: Date.now(),
            batchesProcessed: 0,
            avgBatchTime: 0
        };
        this.idCounter = 0;
    }

    setErrorHandler(handler) {
        this.errorHandler = handler;
    }

    async add(message, processor) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                message,
                processor,
                resolve,
                reject,
                timestamp: Date.now(),
                id: `msg_${++this.idCounter}_${Date.now()}`
            });
            
            this.stats.currentQueueLength = this.queue.length;
            
            if (!this.isProcessing) {
                this.startProcessing();
            }
        });
    }

    startProcessing() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.processQueue();
    }

    stopProcessing() {
        this.isProcessing = false;
    }

    resume() {
        if (!this.isProcessing) {
            this.startProcessing();
        }
    }

    async processQueue() {
        while (this.isProcessing && this.queue.length > 0) {
            const availableBatches = Math.min(
                this.batchSize,
                Math.ceil(this.queue.length / this.messagesPerBatch)
            );

            if (availableBatches === 0) break;

            const batches = [];
            for (let i = 0; i < availableBatches && this.queue.length > 0; i++) {
                const batchItems = [];
                for (let j = 0; j < this.messagesPerBatch && this.queue.length > 0; j++) {
                    const item = this.queue.shift();
                    if (item) batchItems.push(item);
                }
                if (batchItems.length > 0) {
                    batches.push(batchItems);
                }
            }

            this.stats.currentQueueLength = this.queue.length;

            const batchStartTime = Date.now();
            await Promise.allSettled(
                batches.map(batch => this.processBatch(batch))
            );
            
            const batchDuration = Date.now() - batchStartTime;
            this.stats.batchesProcessed++;
            this.stats.avgBatchTime = 
                (this.stats.avgBatchTime * (this.stats.batchesProcessed - 1) + batchDuration) / 
                this.stats.batchesProcessed;
        }

        if (this.queue.length === 0) {
            this.stopProcessing();
        }
    }

    async processBatch(batchItems) {
        const batchPromises = batchItems.map(item => this.processItem(item));
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                this.stats.totalProcessed++;
            } else {
                this.stats.totalErrors++;
            }
        });
    }

    async processItem(item) {
        const { message, processor, resolve, reject } = item;
        try {
            const result = await processor(message);
            resolve(result);
            return result;
        } catch (error) {
            await this.handleProcessingError(item, error);
            reject(error);
            throw error;
        }
    }

    async handleProcessingError(item, error) {
        this.stats.totalErrors++;
        console.error(`❌ Queue processing error for message ${item.id}:`, error.message);
        
        if (this.errorHandler) {
            try {
                await this.errorHandler(item, error);
            } catch (handlerError) {
                console.error('❌ Error handler failed:', handlerError.message);
            }
        }
    }

    async shutdown() {
        this.stopProcessing();
        // Espera as operações atuais (lotes) terminarem
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }

    getStatus() {
        const uptime = Date.now() - this.stats.startTime;
        return {
            queueLength: this.queue.length,
            batchSize: this.batchSize,
            messagesPerBatch: this.messagesPerBatch,
            isProcessing: this.isProcessing,
            totalProcessed: this.stats.totalProcessed,
            totalErrors: this.stats.totalErrors,
            avgBatchTime: Math.round(this.stats.avgBatchTime),
            uptime: uptime,
            throughput: this.stats.totalProcessed > 0 ?
                (this.stats.totalProcessed / (uptime / 1000)).toFixed(2) : 0,
            errorRate: this.stats.totalProcessed > 0 ?
                ((this.stats.totalErrors / this.stats.totalProcessed) * 100).toFixed(2) : 0
        };
    }
}

export default MessageQueue;
