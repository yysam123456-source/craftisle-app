import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckLeapYearTool() {
  const [years, setYears] = useState("");
  const [results, setResults] = useState<{ year: number; isLeap: boolean }[]>([]);

  const handleCheck = useCallback(() => {
    const yearList = years
      .split("\n")
      .map(y => parseInt(y.trim()))
      .filter(y => !isNaN(y));
    
    const results = yearList.map(year => ({
      year,
      isLeap: (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    }));
    
    setResults(results);
  }, [years]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Check Leap Year</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Enter Years (one per line)</label>
          <textarea
            value={years}
            onChange={(e) => setYears(e.target.value)}
            placeholder="2024\n2025\n2026"
            className="w-full h-32 px-3 py-2 border rounded-md font-mono text-sm"
          />
        </div>
        <Button onClick={handleCheck} className="w-full">Check</Button>
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Results</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left">Year</th>
                    <th className="px-4 py-2 text-left">Is Leap Year?</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.year} className="border-b">
                      <td className="px-4 py-2">{r.year}</td>
                      <td className="px-4 py-2">
                        {r.isLeap ? (
                          <span className="text-green-600 font-medium">✓ Yes</span>
                        ) : (
                          <span className="text-red-600">✗ No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
