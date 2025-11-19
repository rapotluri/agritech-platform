"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { WeatherDownloadsService, WeatherDownload } from '@/lib/supabase';
import DownloadHistoryTable from './DownloadHistoryTable';

export default function WeatherDownloadHistory() {
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

    return (
        <Card className="h-[800px] flex flex-col">
            <CardHeader className="flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <CardTitle>Download History</CardTitle>
                        <CardDescription>
                            View and manage your weather data downloads
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
                <DownloadHistoryTable downloads={downloads} loading={loading} />
            </CardContent>
        </Card>
    );
}
