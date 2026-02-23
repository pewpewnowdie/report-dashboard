"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JMeterReport, PytestReport } from "@/lib/mock-data";
import { JMeterReportView } from "./jmeter-report-view";
import { PytestReportView } from "./pytest-report-view";

interface ReportTabsProps {
  jmeterReports: JMeterReport[];
  pytestReports: PytestReport[];
}

export function ReportTabs({ jmeterReports, pytestReports }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState("jmeter");

  const hasJMeter = jmeterReports && jmeterReports.length > 0;
  const hasPytest = pytestReports && pytestReports.length > 0;

  if (!hasJMeter && !hasPytest) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground">No reports available for this release</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full max-w-md bg-muted" style={{ gridTemplateColumns: `repeat(${(hasJMeter ? 1 : 0) + (hasPytest ? 1 : 0)}, minmax(0, 1fr))` }}>
        {hasJMeter && (
          <TabsTrigger value="jmeter" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Load Test ({jmeterReports.length})
          </TabsTrigger>
        )}
        {hasPytest && (
          <TabsTrigger value="pytest" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Automation ({pytestReports.length})
          </TabsTrigger>
        )}
      </TabsList>

      {hasJMeter && (
        <TabsContent value="jmeter" className="mt-6">
          <JMeterReportView reports={jmeterReports} />
        </TabsContent>
      )}

      {hasPytest && (
        <TabsContent value="pytest" className="mt-6">
          <PytestReportView reports={pytestReports} />
        </TabsContent>
      )}
    </Tabs>
  );
}
