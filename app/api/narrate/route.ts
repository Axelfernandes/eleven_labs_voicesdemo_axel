import { NextRequest, NextResponse } from 'next/server';
import { cookiesClient } from '../../../utils/amplify-server-utils';

export async function POST(req: NextRequest) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

    // Debug logging for Amplify environment
    console.log('Available Env Keys:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')));
    if (apiKey) console.log('ELEVENLABS_API_KEY is present (length:', apiKey.length, ')');
    else console.log('ELEVENLABS_API_KEY is MISSING');

    try {
        const { text, voiceId, emotion } = await req.json();

        if (!text || !voiceId) {
            return NextResponse.json({ error: 'Text and voiceId are required' }, { status: 400 });
        }

        if (!apiKey) {
            console.error('SERVER_ERROR: ELEVENLABS_API_KEY is not defined in the environment.');
            return NextResponse.json({
                error: 'ElevenLabs API key is missing',
                message: 'Please ensure ELEVENLABS_API_KEY is set in the Amplify Console environment variables.'
            }, { status: 500 });
        }

        // Emotion to Voice Settings Mapping
        const emotionSettings: Record<string, { stability: number; similarity_boost: number; style: number }> = {
            'Neutral': { stability: 0.75, similarity_boost: 0.9, style: 0.1 },
            'Happy': { stability: 0.35, similarity_boost: 0.85, style: 0.6 },
            'Sad': { stability: 0.3, similarity_boost: 0.8, style: 0.5 },
            'Angry': { stability: 0.25, similarity_boost: 0.8, style: 0.8 },
            'Excited': { stability: 0.25, similarity_boost: 0.85, style: 0.9 },
            'Terrified': { stability: 0.2, similarity_boost: 0.75, style: 0.9 },
            'Sarcastic': { stability: 0.3, similarity_boost: 0.85, style: 0.7 },
            'Whisper': { stability: 0.4, similarity_boost: 0.7, style: 1.0 },
        };

        const settings = emotionSettings[emotion] || emotionSettings['Neutral'];

        // Call ElevenLabs API
        console.log(`Calling ElevenLabs API with voiceId: ${voiceId}, Emotion: ${emotion}`);
        const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
                accept: 'audio/mpeg',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: settings.stability,
                    similarity_boost: settings.similarity_boost,
                    style: settings.style,
                    use_speaker_boost: true,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('ElevenLabs API error:', response.status, errorData);
            return NextResponse.json(
                { error: 'Failed to generate speech', details: errorData },
                { status: response.status }
            );
        }
        console.log('ElevenLabs API success');

        const audioBuffer = await response.arrayBuffer();

        // Record Metrics (non-blocking)
        try {
            if (cookiesClient.models && cookiesClient.models.Metric) {
                await cookiesClient.models.Metric.create({
                    text,
                    emotion,
                    voiceId,
                    timestamp: new Date().toISOString(),
                });
            } else {
                console.warn('Metrics skip: Amplify Data models not initialized locally.');
            }
        } catch (metricError) {
            console.error('Failed to record metrics:', metricError);
        }

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
            },
        });
    } catch (error: any) {
        console.error('Error in narrate route:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
