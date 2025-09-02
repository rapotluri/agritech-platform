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
    const [fileUrl, setFileUrl] = useState<string | null>(null);  // For the download link
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [taskId, setTaskId] = useState<string | null>(null);  // For polling the task status
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

    // Poll the task status using taskId
    const pollTaskStatus = async (taskId: string) => {
        try {
            const { data } = await apiClient.get(`/api/tasks/${taskId}`);
    
            if (data.status === 'Pending') {
                setTimeout(() => pollTaskStatus(taskId), 15000);  // Poll every 3 seconds
            } else if (data.status === 'SUCCESS') {
                // Assuming 'result' contains the file ID or file URL in successful tasks
                setFileUrl(`https://agritech-prod.onrender.com/api/file?task_id=${taskId}`);  // Assuming the backend returns a file ID
                setLoading(false);
            } else {
                setError("Task failed. Please try again.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Error polling task status:", error);
            setError("Error checking task status.");
            setLoading(false);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        setError(null);
        setFileUrl(null);
    
        const start = `${values.startDate.getFullYear()}-${values.startDate.getMonth() + 1}-${values.startDate.getDate()}`;
        const end = `${values.endDate.getFullYear()}-${values.endDate.getMonth() + 1}-${values.endDate.getDate()}`;
        const formattedState = values.state.replace(/\s+/g, '');
    
        const queryParams = {
            province: formattedState,
            start_date: start,
            end_date: end,
            data_type: values.dataType.toLowerCase(),
        };
    
        try {
            const { data } = await apiClient.get(`/api/climate-data`, { params: queryParams });
            setTaskId(data.task_id);  // Store task ID returned by the backend
            pollTaskStatus(data.task_id);  // Start polling for task status
        } catch (error) {
            console.error("Error submitting form:", error);
            setError("Failed to submit request. Please try again.");
            setLoading(false);
        }
    };
    

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

                
            </form>

            {fileUrl && (
                    <div className="mt-4">
                        <a href={fileUrl} download>
                            <Button variant="default">Download File</Button>
                        </a>
                    </div>
                )}

                {error && <p className="text-red-500">{error}</p>}

        </Form>
    );
}
