"use client";

import { useState } from "react";
import { PytestReport } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PytestReportViewProps {
  reports: PytestReport[];
}

export function PytestReportView({ reports }: PytestReportViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  const toggleRunExpansion = (runId: string) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
  };

  const toggleTestExpansion = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const filteredReports = reports.filter((report) =>
    report.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.started_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadCSV = (report: PytestReport) => {
    const headers = ["Test Name", "Status", "Duration", "Error Message"];
    const rows = report.tests.map((test) => [
      test.name,
      test.status,
      test.duration,
      test.error || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.test_name}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!reports || reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No Pytest reports available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search runs by name or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {filteredReports.length === 0 ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No runs match your search</p>
        </div>
      ) : (
        filteredReports.map((report) => {
          const isRunExpanded = expandedRuns.has(report.test_id);

          return (
            <Card key={report.test_id} className="overflow-hidden border-border bg-card">
              {/* Run Header - Always Visible */}
              <div className="p-6 flex items-start justify-between">
                <button
                  onClick={() => toggleRunExpansion(report.test_id)}
                  className="flex items-start gap-3 flex-1 text-left"
                >
                  {isRunExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground">
                      {report.test_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Executed: {new Date(report.executed_at).toLocaleString()}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleDownloadCSV(report)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0 ml-4"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>

              {/* Collapsible Content */}
              {isRunExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-border pt-6">
                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-xs text-muted-foreground mb-2">Passed</p>
              <p className="text-2xl font-bold text-foreground">{report.passed}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-muted-foreground mb-2">Failed</p>
              <p className="text-2xl font-bold text-foreground">{report.failed}</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs text-muted-foreground mb-2">Skipped</p>
              <p className="text-2xl font-bold text-foreground">{report.skipped}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-muted-foreground mb-2">Total</p>
              <p className="text-2xl font-bold text-foreground">{report.total}</p>
            </div>
          </div>

          {/* Tests List */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Test Results ({report.tests.length})
            </h4>
            <div className="space-y-2">
              {report.tests.map((test) => (
                <div key={test.test_id}>
                  <button
                    onClick={() => toggleTestExpansion(test.test_id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left hover:bg-accent transition-colors"
                  >
                    {expandedTests.has(test.test_id) ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    )}

                    {test.status === "passed" && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                    {test.status === "failed" && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    {test.status === "skipped" && (
                      <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    )}

                    <span className="flex-1 text-sm font-medium text-foreground font-mono">
                      {test.name}
                    </span>

                    <Badge
                      variant={
                        test.status === "passed"
                          ? "default"
                          : test.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {test.status}
                    </Badge>

                    <span className="text-xs text-muted-foreground font-mono">
                      {test.duration}s
                    </span>
                  </button>

                  {expandedTests.has(test.test_id) && test.error && (
                    <div className="ml-7 mt-2 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground mb-2">
                            Error Details
                          </p>
                          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                            {test.error}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
