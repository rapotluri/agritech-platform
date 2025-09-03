"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WeatherDownloadsService, WeatherDownload } from '@/lib/supabase';

export default function DownloadHistory() {
    const [downloads, setDownloads] = useState<WeatherDownload[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDownloads();
        
        // Set up real-time subscription for live updates
        const subscription = WeatherDownloadsService.subscribeToAllDownloadUpdates(
            () => {
                loadDownloads() // Refresh when any download changes
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, []);

    const loadDownloads = async () => {
        try {
            const data = await WeatherDownloadsService.getWeatherDownloads()
            setDownloads(data)
        } catch (error) {
            console.error('Error loading downloads:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (download: WeatherDownload) => {
        if (!download.file_url) return
        
        try {
            // Use the stored signed URL directly
            window.open(download.file_url, '_blank')
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            queued: 'secondary',
            running: 'default',
            completed: 'default',
            failed: 'destructive'
        } as const;
        
        return (
            <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
                {status}
            </Badge>
        );
    };

    if (loading) {
        return <div>Loading download history...</div>;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Download History</h2>
            {downloads.length === 0 ? (
                <p>No downloads found.</p>
            ) : (
                <div className="grid gap-4">
                    {downloads.map((download) => (
                        <Card key={download.id}>
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    <span>
                                        {download.dataset} Data - {download.provinces.join(', ')}
                                    </span>
                                    {getStatusBadge(download.status)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p><strong>Date Range:</strong> {download.date_start} to {download.date_end}</p>
                                    <p><strong>Created:</strong> {new Date(download.created_at).toLocaleString()}</p>
                                    {download.error_message && (
                                        <p className="text-red-500"><strong>Error:</strong> {download.error_message}</p>
                                    )}
                                    {download.status === 'completed' && (
                                        <Button onClick={() => downloadFile(download)}>
                                            Download File
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
