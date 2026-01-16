import { NextRequest, NextResponse } from 'next/server';
import { cookiesClient } from '../../../utils/amplify-server-utils';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

export async function POST(req: NextRequest) {
    try {
        const { text, voiceId, emotion } = await req.json();

        if (!text || !voiceId) {
            return NextResponse.json({ error: 'Text and voiceId are required' }, { status: 400 });
        }

        if (!ELEVENLABS_API_KEY) {
            return NextResponse.json({ error: 'ElevenLabs API key is missing' }, { status: 500 });
        }

        // Call ElevenLabs API
        console.log(`Calling ElevenLabs API with voiceId: ${voiceId}`);
        const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
                accept: 'audio/mpeg',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
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
            await cookiesClient.models.Metric.create({
                text,
                emotion,
                voiceId,
                timestamp: new Date().toISOString(),
            });
        } catch (metricError) {
            console.error('Failed to record metrics:', metricError);
            // Continue anyway, don't fail the request if metrics fail
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
