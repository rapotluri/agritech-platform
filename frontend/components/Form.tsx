"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/ui/date-input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { State, Country, IState, ICountry } from 'country-state-city';
import apiClient from "@/lib/apiClient";
import { WeatherDownloadsService, WeatherDownload } from '@/lib/supabase';

const formSchema = z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    dataType: z.string().min(1, "Data type is required"),
});

const dataTypes = ["Temperature", "Precipitation"];

export default function DataForm() {
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [states, setStates] = useState<IState[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloadId, setDownloadId] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            country: "",
            state: "",
            dataType: "",
        },
    });

    useEffect(() => {
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
    }, []);

    // Real-time subscription for download status updates
    useEffect(() => {
        if (!downloadId) return

        const subscription = WeatherDownloadsService.subscribeToDownloadUpdates(
            downloadId,
            (updatedDownload) => {
                if (updatedDownload.status === 'completed') {
                    setLoading(false)
                } else if (updatedDownload.status === 'failed') {
                    setError(updatedDownload.error_message || "Download failed")
                    setLoading(false)
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [downloadId])



    const handleCountryChange = (countryName: string) => {
        const country = countries.find((c) => c.name === countryName);
        if (country) {
            const countryIsoCode = country.isoCode;
            let allStates = State.getStatesOfCountry(countryIsoCode);
            // Check if the selected country is Cambodia
            if (country.name === "Cambodia") {
                allStates = allStates.map((state) => {
                    // Replace 'TaiPoDistrict' with 'TbongKhmum' if present
                    if (state.name === "Tai Po District") {
                        return { ...state, name: "Tbong Khmum" };
                    }
                    return state;
                });
            }

            setStates(allStates);
        }
    };

    // Update form submission (still uses backend for processing)
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        setError(null);
        setDownloadId(null);
        
        const requestData = {
            dataset: values.dataType.toLowerCase(),
            provinces: [values.state.replace(/\s+/g, '')],
            date_start: values.startDate.toISOString().split('T')[0],
            date_end: values.endDate.toISOString().split('T')[0]
        };
        
        try {
            const { data } = await apiClient.post('/api/climate-data', requestData);
            setDownloadId(data.download_id);
            // No need for polling - real-time subscription handles updates
        } catch (error) {
            console.error("Error submitting form:", error);
            setError("Failed to submit request. Please try again.");
            setLoading(false);
        }
    };


    

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value);
                                    handleCountryChange(value);
                                    form.setValue("state", "");
                                }}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.values(countries).map((country) => (
                                        <SelectItem key={country.name} value={country.name}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value)}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a state" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {states.map((state) => (
                                        <SelectItem key={state.name} value={state.name}>
                                            {state.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                                <DateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Pick a start date"
                                    id={field.name}
                                    aria-describedby={`${field.name}-error`}
                                    aria-invalid={!!form.formState.errors.startDate}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                                <DateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Pick an end date"
                                    id={field.name}
                                    aria-describedby={`${field.name}-error`}
                                    aria-invalid={!!form.formState.errors.endDate}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="dataType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data Type</FormLabel>
                            <Select onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select data type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {dataTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Submit"}
                </Button>

                {error && <p className="text-red-500">{error}</p>}
            </form>


        </Form>
    );
}
