"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow
} from '@/components/ui/table';
import { WeatherDownload } from '@/lib/supabase';
import { DownloadIcon, AlertCircleIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';

interface DownloadHistoryTableProps {
    downloads: WeatherDownload[];
    loading: boolean;
}

export default function DownloadHistoryTable({ downloads, loading }: DownloadHistoryTableProps) {
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
        const statusConfig = {
            queued: { variant: 'secondary' as const, icon: ClockIcon, label: 'Queued' },
            running: { variant: 'default' as const, icon: ClockIcon, label: 'Processing' },
            completed: { variant: 'default' as const, icon: CheckCircleIcon, label: 'Completed' },
            failed: { variant: 'destructive' as const, icon: XCircleIcon, label: 'Failed' }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;
        const Icon = config.icon;
        
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (downloads.length === 0) {
        return (
            <Alert>
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                    No downloads found. Submit a request to start downloading weather data.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 border-b">
                        <TableRow>
                            <TableHead className="w-[200px]">Dataset</TableHead>
                            <TableHead className="w-[150px]">Provinces</TableHead>
                            <TableHead className="w-[180px]">Date Range</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[120px]">Created</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {downloads.map((download) => (
                            <TableRow key={download.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="capitalize">{download.dataset}</span>
                                        <span className="text-xs text-muted-foreground">
                                            Weather Data
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-[150px] truncate" title={download.provinces.join(', ')}>
                                        {download.provinces.join(', ')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>{download.date_start}</div>
                                        <div className="text-muted-foreground">to {download.date_end}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(download.status)}
                                    {download.status === 'failed' && download.error_message && (
                                        <div className="mt-1 text-xs text-destructive max-w-[100px] truncate" title={download.error_message}>
                                            {download.error_message}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        {new Date(download.created_at).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {download.status === 'completed' && download.file_url ? (
                                        <Button 
                                            size="sm" 
                                            onClick={() => downloadFile(download)}
                                            className="flex items-center gap-1"
                                        >
                                            <DownloadIcon className="h-3 w-3" />
                                            Download
                                        </Button>
                                    ) : download.status === 'running' ? (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <ClockIcon className="h-3 w-3 animate-spin" />
                                            Processing
                                        </div>
                                    ) : download.status === 'failed' ? (
                                        <div className="flex items-center gap-1 text-sm text-destructive">
                                            <XCircleIcon className="h-3 w-3" />
                                            Failed
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <ClockIcon className="h-3 w-3" />
                                            Queued
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex-shrink-0 p-4 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                    A list of your weather data downloads.
                </p>
            </div>
        </div>
    );
}
