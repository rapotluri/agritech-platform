"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { State, City, Country, IState, ICountry, ICity } from 'country-state-city';

const formSchema = z.object({
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    district: z.string().min(1, "District is required"),
    startDate: z.date({
        required_error: "Start date is required",
    }),
    endDate: z.date({
        required_error: "End date is required",
    }),
    dataType: z.string().min(1, "Data type is required"),
})


const dataTypes = ["Temperature", "Rainfall", "Humidity", "Wind Speed"]

export default function DataForm() {
    const [countries, setCountries] = useState<ICountry[]>([]);
    const [states, setStates] = useState<IState[]>([])
    const [districts, setDistricts] = useState<ICity[]>([])
    // const [selectedCountry, setSelectedCountry] = useState<string>('');
    // const [selectedState, setSelectedState] = useState<string>('');
    // const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            country: "",
            state: "",
            district: "",
            dataType: "",
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const start = values.startDate.getFullYear() + "-" + values.startDate.getMonth() + "-" + values.startDate.getDate()
        const end = values.endDate.getFullYear() + "-" + values.endDate.getMonth() + "-" + values.endDate.getDate()
        // Build the query string from form values
    const queryParams = new URLSearchParams({
        lat: "123",
        long: "21",
        start_date: start,  // Convert to ISO string
        end_date: end,  // Convert to ISO string
    }).toString();

    // Make the GET request with the query parameters
    fetch(`http://127.0.0.1:8000/api/data?${queryParams}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then((response) => response.json())
    .then((data) => {
            console.log('Received from backend:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
    useEffect(() => {
        // Fetch all countries when the component mounts
        const allCountries = Country.getAllCountries();
        setCountries(allCountries);
    }, []);

    const handleCountryChange = (countryName: string) => {
        // setSelectedCountry(countryName);
        // setSelectedState('');
        // setSelectedDistrict('');

        // Get the ISO code for the selected country
        const country = countries.find((c) => c.name === countryName);
        if (country) {
            const countryIsoCode = country.isoCode;
            // Fetch states based on the country ISO code
            const allStates = State.getStatesOfCountry(countryIsoCode);
            setStates(allStates);
        }


    };

    const handleStateChange = (stateName: string) => {
        // setSelectedState(stateName);
        // setSelectedDistrict('');
        // Get the ISO code for the selected country

        const state = states.find((s) => s.name === stateName);

        if (state) {
            const stateCode = state.isoCode;
            const countryCode = state.countryCode
            // Fetch states based on the country ISO code
            const availableDistricts = City.getCitiesOfState(countryCode, stateCode);
            setDistricts(availableDistricts);
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
                                    field.onChange(value)
                                    handleCountryChange(value)
                                    form.setValue("state", "")
                                    form.setValue("district", "")
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
                                onValueChange={(value) => {
                                    field.onChange(value)
                                    handleStateChange(value)
                                    form.setValue("district", "")
                                }}
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
                    name="district"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>District</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value)
                                // setSelectedDistrict(value)
                            }}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a district" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {districts.map((district) => (
                                        <SelectItem key={district.name} value={district.name}>
                                            {district.name}
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[240px] pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
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

                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
}