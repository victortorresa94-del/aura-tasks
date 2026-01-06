class AudioRecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096;
        this._buffer = new Float32Array(this.bufferSize);
        this._bytesWritten = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        const channelData = input[0];
        if (!channelData) return true;

        // Downmix or just take the first channel
        // We need to buffer this data and send it to the main thread
        // Optimized for 16kHz conversion if needed, but for now passing raw
        // The main thread will handle the Float32 -> Int16 conversion to keep this lightweight

        this.port.postMessage(channelData);

        return true;
    }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
