"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudIcon } from "@heroicons/react/24/outline";
import Form from "../Form";

export default function WeatherDataForm() {
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CloudIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle>Request Weather Data</CardTitle>
            <CardDescription>
              Select your parameters to download weather data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Form />
      </CardContent>
    </Card>
  );
}
