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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

import { FloorPlan2D } from "../components/floor-plan-2d";
import { FloorPlan3D } from "../components/floor-plan-3d";

export default function Home() {
  const [result, setResult] = useState<FloorPlanResult | null>(null);
  const { toast } = useToast();
  
  const generateMutation = useGenerateFloorPlan();

  const form = useForm<FloorPlanFormValues>({
    resolver: zodResolver(floorPlanFormSchema),
    defaultValues: {
      plotWidth: 30,
      plotLength: 40,
      floors: 1,
      facing: "East" as const,
      bedrooms: 2,
      bathrooms: 2,
      hasParking: true,
      hasGarden: false,
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
          toast({
            title: "Floor plan generated",
            description: "Your custom floor plan is ready.",
          });
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
    <div className="min-h-[100dvh] bg-background font-sans text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight text-primary">VastuPlan</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Architectural Floor Plan Generator</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border shadow-sm bg-card rounded-none">
              <CardHeader className="border-b border-border pb-4 bg-muted/30">
                <CardTitle className="text-lg">Plot Specifications</CardTitle>
                <CardDescription>Enter dimensions in feet and select requirements.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="plotWidth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Width (ft)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="plotLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (ft)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="floors"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floors</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={4} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="facing"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facing</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select facing" />
                                </SelectTrigger>
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
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bedrooms</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={10} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathrooms</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={10} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <label className="text-sm font-medium leading-none">Requirements</label>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="hasParking"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="font-normal">Parking</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasGarden"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="font-normal">Garden</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasPooja"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="font-normal">Pooja Room</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasStudyRoom"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="font-normal">Study Room</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="vastuCompliant"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 col-span-2">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="font-normal">Strict Vastu Compliance</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any specific requirements..." 
                              className="resize-none" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full rounded-none tracking-wide" 
                      disabled={generateMutation.isPending}
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Generating Blueprint...
                        </>
                      ) : (
                        "Generate Floor Plan"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!result && !generateMutation.isPending ? (
              <div className="h-full min-h-[500px] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/50">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M15 3v18" />
                  <path d="M3 9h18" />
                  <path d="M3 15h18" />
                </svg>
                <h3 className="text-xl font-medium text-foreground mb-2">No Draft Available</h3>
                <p className="max-w-md">Enter your plot dimensions and requirements on the left to generate an architectural floor plan.</p>
              </div>
            ) : generateMutation.isPending ? (
              <div className="h-full min-h-[500px] border border-border flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card">
                <Spinner className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">Drafting Blueprint</h3>
                <p className="max-w-md">Our AI architect is analyzing spatial constraints and Vastu principles to design your optimal floor plan...</p>
              </div>
            ) : result && (
              <>
                <Card className="border-border shadow-sm rounded-none overflow-hidden bg-card">
                  <Tabs defaultValue="2d" className="w-full">
                    <div className="border-b border-border bg-muted/30 px-4 py-3 flex justify-between items-center">
                      <h2 className="font-semibold text-lg">Architectural Draft</h2>
                      <TabsList className="bg-transparent space-x-2">
                        <TabsTrigger value="2d" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-none border border-transparent data-[state=active]:border-border">2D Plan</TabsTrigger>
                        <TabsTrigger value="3d" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-none border border-transparent data-[state=active]:border-border">3D View</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <div className="p-4 bg-white">
                      <TabsContent value="2d" className="mt-0 focus-visible:outline-none">
                        <FloorPlan2D result={result} />
                      </TabsContent>
                      <TabsContent value="3d" className="mt-0 h-[600px] focus-visible:outline-none">
                        <FloorPlan3D result={result} />
                      </TabsContent>
                    </div>
                  </Tabs>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-border shadow-sm rounded-none">
                    <CardHeader className="border-b border-border pb-3 bg-muted/20">
                      <CardTitle className="text-base font-semibold">Architect's Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                        {result.description}
                      </p>
                    </CardContent>
                  </Card>

                  {result.vastuNotes && (
                    <Card className="border-border shadow-sm rounded-none">
                      <CardHeader className="border-b border-border pb-3 bg-primary/5">
                        <CardTitle className="text-base font-semibold text-primary">Vastu Shastra Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {result.vastuNotes}
                        </p>
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
