"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Send, Play } from "lucide-react";

interface VoiceRecorderProps {
    onSend: (file: File, duration: number) => Promise<void> | void;
    onCancel: () => void;
}

export default function VoiceRecorder({
    onSend,
    onCancel,
}: VoiceRecorderProps) {
    const [recording, setRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [duration, setDuration] = useState(0);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAtRef = useRef(0);
    const durationRef = useRef(0);

    const previewUrl = useRef<string | null>(null);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    const startRecording = async () => {
        try {
            setError("");

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Microphone recording is not supported.");
            }

            if (!window.MediaRecorder) {
                throw new Error("Audio recording is not supported by this browser.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            streamRef.current = stream;
            chunksRef.current = [];

            const mimeType = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/mp4",
            ].find((type) => MediaRecorder.isTypeSupported(type));

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            recorderRef.current = recorder;
            startedAtRef.current = Date.now();
            durationRef.current = 0;
            setDuration(0);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || "audio/webm",
                });

                setAudioBlob(blob);

                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            };

            recorder.start();
            setRecording(true);

            timerRef.current = setInterval(() => {
                const seconds = Math.floor(
                    (Date.now() - startedAtRef.current) / 1000
                );

                durationRef.current = seconds;
                setDuration(seconds);

                if (seconds >= 300 && recorderRef.current?.state === "recording") {
                    recorderRef.current.stop();
                    setRecording(false);

                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                }
            }, 250);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not access microphone."
            );
        }
    };

    const stopRecording = () => {
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setRecording(false);
    };

    const cancelRecording = () => {
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (previewUrl.current) {
            URL.revokeObjectURL(previewUrl.current);
            previewUrl.current = null;
        }

        setAudioBlob(null);
        setDuration(0);
        setRecording(false);
        setError("");
        onCancel();
    };

    const sendRecording = async () => {
        if (!audioBlob || sending) return;

        if (duration < 1 || audioBlob.size === 0) {
            setError("Record a little longer before sending.");
            return;
        }

        const extension = audioBlob.type.includes("mp4") ? "m4a" : "webm";

        const file = new File(
            [audioBlob],
            `voice-${Date.now()}.${extension}`,
            { type: audioBlob.type }
        );

        try {
            setSending(true);
            await onSend(file, duration);

            setAudioBlob(null);
            setDuration(0);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to send voice message."
            );
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);

            streamRef.current?.getTracks().forEach((track) => track.stop());

            if (previewUrl.current) {
                URL.revokeObjectURL(previewUrl.current);
            }
        };
    }, []);

    return (
        <div className="m-3">
            <div className="flex w-full items-center gap-3 rounded-xl border p-3">
                {recording ? (
                    <>
                        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

                        <span className="min-w-14 text-sm font-medium">
                            {formatTime(duration)}
                        </span>

                        <span className="flex-1 text-sm text-muted-foreground">
                            Recording...
                        </span>

                        <button
                            type="button"
                            onClick={stopRecording}
                            className="rounded-full p-2 hover:bg-muted"
                            aria-label="Stop recording"
                        >
                            <Square size={20} />
                        </button>
                    </>
                ) : audioBlob ? (
                    <>
                        <audio
                            controls
                            src={
                                previewUrl.current ??
                                (previewUrl.current = URL.createObjectURL(audioBlob))
                            }
                            className="min-w-0 flex-1"
                        />

                        <button
                            type="button"
                            onClick={cancelRecording}
                            className="rounded-full p-2 hover:bg-muted"
                            aria-label="Discard recording"
                        >
                            <Trash2 size={20} />
                        </button>

                        <button
                            type="button"
                            onClick={sendRecording}
                            disabled={sending}
                            className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-50"
                            aria-label="Send voice message"
                        >
                            <Send size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <Mic size={20} />

                        <span className="flex-1 text-sm text-muted-foreground">
                            Ready to record
                        </span>

                        <button
                            type="button"
                            onClick={startRecording}
                            className="rounded-full bg-primary p-2 text-primary-foreground"
                        >
                            Start recording
                        </button>
                    </>
                )}

                {error && (
                    <p className="text-sm text-red-500" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}
