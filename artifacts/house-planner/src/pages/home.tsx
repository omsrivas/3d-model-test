import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGenerateFloorPlan } from "@workspace/api-client-react";
import type { FloorPlanResult } from "@workspace/api-client-react";
import { floorPlanFormSchema, FloorPlanFormValues } from "../lib/schema";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

import { FloorPlan2D } from "../components/floor-plan-2d";

export default function Home() {
  const [result, setResult] = useState<FloorPlanResult | null>(null);
  const { toast } = useToast();
  const generateMutation = useGenerateFloorPlan();

  const form = useForm<FloorPlanFormValues>({
    resolver: zodResolver(floorPlanFormSchema),
    defaultValues: {
      plotWidth: 50,
      plotLength: 70,
      floors: 1,
      facing: "North" as const,
      bedrooms: 3,
      bathrooms: 3,
      hasParking: true,
      hasGarden: true,
      hasPooja: true,
      hasStudyRoom: false,
      vastuCompliant: true,
      additionalNotes: "",
    },
  });

  const onSubmit = (values: FloorPlanFormValues) => {
    generateMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setResult(data);
          toast({ title: "Floor plan ready", description: "Your architectural blueprint is ready." });
        },
        onError: () => {
          toast({
            title: "Generation failed",
            description: "There was an error generating your floor plan. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8f6f2] font-sans text-foreground">
      <header className="border-b border-gray-300 bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-baseline gap-3">
          <h1 className="text-2xl font-black tracking-tight text-gray-900">VastuPlan</h1>
          <span className="text-sm text-gray-500 font-medium">Architectural Floor Plan Generator</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Input Panel */}
          <div className="lg:col-span-4">
            <Card className="border border-gray-300 shadow-sm rounded-none bg-white">
              <CardHeader className="border-b border-gray-200 pb-3 bg-gray-50">
                <CardTitle className="text-base font-bold text-gray-900">Plot Specifications</CardTitle>
                <CardDescription className="text-xs">Enter dimensions in feet and select requirements.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="plotWidth" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Width (ft)</FormLabel>
                          <FormControl><Input type="number" className="rounded-none" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="plotLength" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Length (ft)</FormLabel>
                          <FormControl><Input type="number" className="rounded-none" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="floors" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Floors</FormLabel>
                          <FormControl><Input type="number" min={1} max={4} className="rounded-none" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="facing" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Facing</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-none"><SelectValue placeholder="Select facing"/></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="North">North</SelectItem>
                              <SelectItem value="South">South</SelectItem>
                              <SelectItem value="East">East</SelectItem>
                              <SelectItem value="West">West</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="bedrooms" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Bedrooms</FormLabel>
                          <FormControl><Input type="number" min={1} max={10} className="rounded-none" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="bathrooms" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-gray-700">Bathrooms</FormLabel>
                          <FormControl><Input type="number" min={1} max={10} className="rounded-none" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Requirements</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { name: "hasParking" as const, label: "Car Parking" },
                          { name: "hasGarden" as const, label: "Garden / Lawn" },
                          { name: "hasPooja" as const, label: "Pooja Room" },
                          { name: "hasStudyRoom" as const, label: "Study Room" },
                        ].map(({ name, label }) => (
                          <FormField key={name} control={form.control} name={name} render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} className="rounded-none"/>
                              </FormControl>
                              <FormLabel className="text-xs font-normal text-gray-700 cursor-pointer">{label}</FormLabel>
                            </FormItem>
                          )}/>
                        ))}
                        <FormField control={form.control} name="vastuCompliant" render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0 col-span-2">
                            <FormControl>
                              <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} className="rounded-none"/>
                            </FormControl>
                            <FormLabel className="text-xs font-normal text-gray-700 cursor-pointer">Strict Vastu Compliance</FormLabel>
                          </FormItem>
                        )}/>
                      </div>
                    </div>

                    <FormField control={form.control} name="additionalNotes" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-gray-700">Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any specific requirements..." className="resize-none rounded-none text-sm" {...field} value={field.value || ""}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>

                    <Button type="submit" className="w-full rounded-none bg-gray-900 hover:bg-gray-700 text-white font-bold tracking-wider text-sm py-5" disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? (
                        <><Spinner className="mr-2 h-4 w-4"/> Drafting Blueprint...</>
                      ) : "GENERATE FLOOR PLAN"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Plan Display */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {!result && !generateMutation.isPending ? (
              <div className="min-h-[560px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="mb-4 opacity-40">
                  <rect x="8" y="8" width="44" height="44" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="28" x2="52" y2="28" stroke="currentColor" strokeWidth="2"/>
                  <line x1="28" y1="8" x2="28" y2="52" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="42" x2="52" y2="42" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No Blueprint Yet</h3>
                <p className="text-sm max-w-sm text-gray-400">Enter your plot dimensions and requirements on the left to generate a professional architectural floor plan.</p>
              </div>
            ) : generateMutation.isPending ? (
              <div className="min-h-[560px] border border-gray-300 flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-white">
                <Spinner className="h-10 w-10 text-gray-800 mb-4"/>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Drafting Your Blueprint</h3>
                <p className="text-sm max-w-sm text-gray-500">Our AI architect is analyzing spatial constraints and Vastu principles to design your optimal floor plan...</p>
              </div>
            ) : result && (
              <>
                <div className="border border-gray-300 bg-white shadow-sm">
                  <div className="border-b border-gray-200 px-4 py-2.5 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Architectural Blueprint</span>
                    <span className="text-xs text-gray-500">{result.rooms.length} rooms · {(result as any).facing ?? "North"} Facing</span>
                  </div>
                  <div className="p-4">
                    <FloorPlan2D result={result}/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-300 shadow-sm rounded-none">
                    <CardHeader className="border-b border-gray-200 pb-2.5 bg-gray-50">
                      <CardTitle className="text-sm font-bold text-gray-800">Architect's Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">{result.description}</p>
                    </CardContent>
                  </Card>
                  {result.vastuNotes && (
                    <Card className="border border-gray-300 shadow-sm rounded-none">
                      <CardHeader className="border-b border-gray-200 pb-2.5 bg-amber-50">
                        <CardTitle className="text-sm font-bold text-amber-800">Vastu Shastra Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">{result.vastuNotes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
