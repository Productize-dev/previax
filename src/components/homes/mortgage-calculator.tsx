"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  estimateMonthlyPayment,
  formatMonthly,
} from "@/lib/mortgage";

type MortgageCalculatorProps = {
  price: number;
};

export function MortgageCalculator({ price }: MortgageCalculatorProps) {
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [term, setTerm] = useState(30);

  const monthly = estimateMonthlyPayment(price, downPct, rate, term);

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">Estimated monthly payment</p>
      <p className="font-heading mt-1 text-2xl text-primary">
        {formatMonthly(monthly)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Principal & interest only — excludes taxes, insurance, HOA
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Down %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={downPct}
            onChange={(e) => setDownPct(Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rate %</Label>
          <Input
            type="number"
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Years</Label>
          <Input
            type="number"
            min={5}
            max={30}
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
}
