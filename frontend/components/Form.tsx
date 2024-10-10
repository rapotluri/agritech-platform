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
import { State, Country, IState, ICountry } from 'country-state-city'
import { generateClimateData, downloadFile } from "@/lib/apiClient"

// Define the form validation schema using Zod
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
})

// Options for the data type dropdown
const dataTypes = ["Temperature", "Precipitation"]

export default function DataForm() {
    const [countries, setCountries] = useState<ICountry[]>([])
    const [states, setStates] = useState<IState[]>([])
    const [fileUrl, setFileUrl] = useState<string | null>(null)  // State to store file URL for download
    const [loading, setLoading] = useState(false)  // State to track if a request is in progress

    // Initialize the form using React Hook Form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            country: "",
            state: "",
            dataType: "",
        },
    })

    // Load all countries when the component mounts
    useEffect(() => {
        const allCountries = Country.getAllCountries()
        setCountries(allCountries)
    }, [])

    // Handle country change to load states for the selected country
    const handleCountryChange = (countryName: string) => {
        const country = countries.find((c) => c.name === countryName)
        if (country) {
            const countryIsoCode = country.isoCode
            const allStates = State.getStatesOfCountry(countryIsoCode)
            setStates(allStates)
        }
    }

    // Handle form submission
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (loading) return

        setLoading(true)  // Mark request as in progress

        // Format the start and end dates correctly
        const start = values.startDate.toISOString().split('T')[0]  // Convert to YYYY-MM-DD
        const end = values.endDate.toISOString().split('T')[0]

        // Remove any spaces in the state name for API compatibility
        const formattedState = values.state.replace(/\s+/g, '')

        const params = {
            province: formattedState,
            start_date: start,
            end_date: end,
            data_type: values.dataType.toLowerCase(),
        }

        try {
            // Send request to backend to generate the climate data file
            const response = await generateClimateData(params)
            const { filename } = response

            if (filename) {
                const downloadLink = await downloadFile(filename)
                setFileUrl(downloadLink)  // Set the download link for the user
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)  // Mark request as complete
        }
    }

    return (
        <>
            <Form {...form}>
                {/* Form Element */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Country Select Field */}
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
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {countries.map((country) => (
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

                    {/* State Select Field */}
                    <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>State</FormLabel>
                                <Select onValueChange={field.onChange}>
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

                    {/* Start Date Picker */}
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

                    {/* End Date Picker */}
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

                    {/* Data Type Select Field */}
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

                    {/* Submit Button */}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Loading..." : "Submit"}
                    </Button>
                </form>
            </Form>

            {/* Separate Download Button Outside the Form */}
            {fileUrl && (
                <div className="mt-4">
                    <a href={fileUrl} download>
                        <Button variant="primary">Download File</Button>
                    </a>
                </div>
            )}
        </>
    )
}
