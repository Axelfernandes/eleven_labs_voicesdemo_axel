import { NextRequest, NextResponse } from 'next/server';
import { cookiesClient } from '../../../../utils/amplify-server-utils';

export async function GET(req: NextRequest) {
    try {
        const { data: metrics, errors } = await cookiesClient.models.Metric.list();

        if (errors) {
            console.error('Error fetching metrics:', errors);
            return NextResponse.json({ error: 'Failed to fetch metrics', details: errors }, { status: 500 });
        }

        if (!metrics || metrics.length === 0) {
            return new NextResponse('No metrics found', { status: 404 });
        }

        // Generate CSV
        const headers = ['Timestamp', 'VoiceId', 'Emotion', 'Text'];
        const rows = metrics.map((m) => [
            m.timestamp,
            m.voiceId,
            m.emotion,
            `"${m.text.replace(/"/g, '""')}"` // Escape quotes for CSV
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((r) => r.join(','))
        ].join('\n');

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="emo_narrator_metrics.csv"',
            },
        });
    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
