import { useState } from "react";
import { Hash, Plus, Minus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CounterTool() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="grid gap-6 max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Current value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-8xl font-bold tracking-tighter tabular-nums text-primary transition-all duration-200 scale-100 hover:scale-105">
              {count}
            </div>
            
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => setCount(prev => prev - step)}
                className="h-16 w-16 rounded-full border-2"
              >
                <Minus className="h-8 w-8" />
              </Button>
              <Button 
                size="lg" 
                variant="default" 
                onClick={() => setCount(prev => prev + step)}
                className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <Plus className="h-8 w-8" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Step:</span>
                <Input 
                  type="number" 
                  value={step} 
                  onChange={(e) => setStep(Number(e.target.value) || 1)}
                  className="w-20 text-center h-8"
                />
              </div>
<Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCount(0)}
                className="text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
