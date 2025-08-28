import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, ScanLine, Zap, Database, Leaf } from "lucide-react";

interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  iron?: number;
  vitaminC?: number;
  magnesium?: number;
  vitaminB12?: number;
  sodium?: number;
  sugar?: number;
  saturatedFat?: number;
}

interface FoodItem {
  name: string;
  barcode?: string;
  quantity: number;
  unit: string;
  nutrition: NutritionData;
  confidence: number;
  source: string;
  brand?: string;
  ingredients?: string[];
}

export default function NutritionSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "barcode">("search");
  const [hasSearched, setHasSearched] = useState(false);

  // Text search query
  const { data: searchResults, isLoading: searchLoading, refetch: searchRefetch } = useQuery<FoodItem[]>({
    queryKey: ["/api/nutrition/search", searchQuery],
    enabled: false,
  });

  // Barcode query  
  const { data: barcodeResult, isLoading: barcodeLoading, refetch: barcodeRefetch } = useQuery<FoodItem>({
    queryKey: ["/api/nutrition/barcode", barcode],
    enabled: false,
  });

  const handleTextSearch = () => {
    if (searchQuery.trim()) {
      setHasSearched(true);
      searchRefetch();
    }
  };

  const handleBarcodeSearch = () => {
    if (barcode.trim()) {
      setHasSearched(true);
      barcodeRefetch();
    }
  };

  const formatNutrient = (value?: number, unit = "g") => {
    return value !== undefined ? `${value.toFixed(1)}${unit}` : "N/A";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Nutrition Database</h1>
          <p className="text-muted-foreground">
            Search our comprehensive nutrition database powered by multiple APIs including USDA FoodData, Open Food Facts, and more.
          </p>
        </div>

        {/* Search Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Text Search</span>
            </Button>
            <Button
              variant={activeTab === "barcode" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("barcode")}
              className="flex items-center space-x-2"
            >
              <ScanLine className="h-4 w-4" />
              <span>Barcode</span>
            </Button>
          </div>
        </div>

        {/* Search Interface */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {activeTab === "search" && (
              <div className="flex space-x-4">
                <Input
                  placeholder="Search for foods (e.g., banana, chicken breast, apple)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleTextSearch()}
                  className="flex-1"
                />
                <Button onClick={handleTextSearch} disabled={searchLoading}>
                  {searchLoading ? <Zap className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Search
                </Button>
              </div>
            )}

            {activeTab === "barcode" && (
              <div className="flex space-x-4">
                <Input
                  placeholder="Enter barcode number (e.g., 3017620422003 for Nutella)"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBarcodeSearch()}
                  className="flex-1"
                />
                <Button onClick={handleBarcodeSearch} disabled={barcodeLoading}>
                  {barcodeLoading ? <Zap className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                  Scan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {activeTab === "search" && searchResults && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Search Results ({searchResults.length} found)
            </h2>
            <div className="grid gap-4">
              {searchResults.map((food, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{food.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <Database className="h-3 w-3" />
                            <span>{food.source}</span>
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(food.confidence * 100)}% confidence
                          </Badge>
                          {food.brand && <Badge variant="outline">{food.brand}</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {food.nutrition.calories || 0} <span className="text-sm text-muted-foreground">cal</span>
                        </div>
                        <div className="text-sm text-muted-foreground">per {food.quantity}{food.unit}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground">Protein</div>
                        <div className="text-lg">{formatNutrient(food.nutrition.protein)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Carbs</div>
                        <div className="text-lg">{formatNutrient(food.nutrition.carbs)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Fat</div>
                        <div className="text-lg">{formatNutrient(food.nutrition.fat)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Fiber</div>
                        <div className="text-lg">{formatNutrient(food.nutrition.fiber)}</div>
                      </div>
                    </div>
                    
                    {food.nutrition.vitaminC || food.nutrition.iron || food.nutrition.sodium ? (
                      <>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {food.nutrition.vitaminC && (
                            <div>
                              <div className="font-medium text-muted-foreground">Vitamin C</div>
                              <div>{formatNutrient(food.nutrition.vitaminC, "mg")}</div>
                            </div>
                          )}
                          {food.nutrition.iron && (
                            <div>
                              <div className="font-medium text-muted-foreground">Iron</div>
                              <div>{formatNutrient(food.nutrition.iron, "mg")}</div>
                            </div>
                          )}
                          {food.nutrition.sodium && (
                            <div>
                              <div className="font-medium text-muted-foreground">Sodium</div>
                              <div>{formatNutrient(food.nutrition.sodium, "mg")}</div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "barcode" && barcodeResult && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Barcode Result</h2>
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{barcodeResult.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Database className="h-3 w-3" />
                        <span>{barcodeResult.source}</span>
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(barcodeResult.confidence * 100)}% confidence
                      </Badge>
                      {barcodeResult.brand && <Badge variant="outline">{barcodeResult.brand}</Badge>}
                      {barcodeResult.barcode && <Badge variant="outline">#{barcodeResult.barcode}</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {barcodeResult.nutrition.calories || 0} <span className="text-sm text-muted-foreground">cal</span>
                    </div>
                    <div className="text-sm text-muted-foreground">per {barcodeResult.quantity}{barcodeResult.unit}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatNutrient(barcodeResult.nutrition.protein)}</div>
                    <div className="text-sm text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatNutrient(barcodeResult.nutrition.carbs)}</div>
                    <div className="text-sm text-muted-foreground">Carbs</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatNutrient(barcodeResult.nutrition.fat)}</div>
                    <div className="text-sm text-muted-foreground">Fat</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatNutrient(barcodeResult.nutrition.sugar)}</div>
                    <div className="text-sm text-muted-foreground">Sugar</div>
                  </div>
                </div>

                {barcodeResult.ingredients && barcodeResult.ingredients.length > 0 && (
                  <>
                    <Separator className="mb-4" />
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Leaf className="h-4 w-4" />
                        <h3 className="font-medium">Ingredients</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {barcodeResult.ingredients.join(", ")}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-muted/20 rounded-lg">
          <h3 className="font-medium mb-2">Try these sample searches:</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("banana");
                setActiveTab("search");
              }}
            >
              banana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("chicken breast");
                setActiveTab("search");
              }}
            >
              chicken breast
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBarcode("3017620422003");
                setActiveTab("barcode");
              }}
            >
              Nutella barcode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}